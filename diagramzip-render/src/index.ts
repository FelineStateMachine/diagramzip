import { ENGINE_CATALOG, ENGINE_CATALOG_BY_ID } from './catalog'
import { originAdapter } from './adapters/origin'
import { RenderError, RequestError } from './errors'
import { sanitizeAndDecorateSvg } from './svg'
import type { EngineId, RendererAdapter, RenderRequest } from './types'
import { parseRenderRequest } from './validation'

const CACHE_MAX_AGE = 1_800

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  headers.set('Access-Control-Allow-Origin', '*')
  return Response.json(value, { ...init, headers })
}

function errorResponse(error: unknown): Response {
  if (error instanceof RequestError || error instanceof RenderError) {
    return json({ error: { code: error.code, message: error.message } }, { status: error.status })
  }
  return json({ error: { code: 'internal_error', message: 'The diagram could not be rendered.' } }, { status: 500 })
}

function assertGatewayRoutable(id: EngineId): void {
  const entry = ENGINE_CATALOG_BY_ID.get(id)
  if (entry?.activeRuntime !== 'origin') {
    throw new RenderError(503, 'renderer_unit_required', `The ${id} renderer is available through its dedicated renderer unit.`)
  }
}

function adapterFor(id: EngineId, env: Env): RendererAdapter {
  assertGatewayRoutable(id)
  return originAdapter(id, env.ORIGIN_URL)
}

function canonicalRequest(request: RenderRequest): string {
  const options = Object.fromEntries(Object.entries(request.options).sort(([left], [right]) => left.localeCompare(right)))
  return JSON.stringify({ ...request, options })
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

async function cacheRequestFor(request: RenderRequest, env: Env): Promise<Request> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest(request)))
  return new Request(`https://diagramzip-render-cache.invalid/${encodeURIComponent(env.RENDERER_BUILD)}/${base64Url(new Uint8Array(digest))}`, {
    method: 'GET',
  })
}

function responseWithCacheStatus(response: Response, status: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Diagram-Cache', status)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function render(request: RenderRequest, env: Env, signal: AbortSignal): Promise<Response> {
  const entry = ENGINE_CATALOG_BY_ID.get(request.engine)
  if (entry === undefined) throw new RequestError(400, 'unknown_engine', `Unknown diagram engine: ${request.engine}.`)
  let adapter = adapterFor(request.engine, env)
  let rendered
  try {
    rendered = await adapter.render(request, signal)
  } catch (error) {
    if (!(error instanceof RenderError) || error.code !== 'origin_required' || entry.fallback !== 'origin') throw error
    console.log(JSON.stringify({ message: 'renderer fallback', engine: request.engine, from: adapter.runtime, to: 'origin', reason: error.message }))
    adapter = originAdapter(request.engine, env.ORIGIN_URL)
    rendered = await adapter.render(request, signal)
  }
  if (signal.aborted) throw signal.reason
  const body = sanitizeAndDecorateSvg(rendered.body, request.metadata, request.presentation, request.engine)
  return new Response(body, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Diagram-Engine': request.engine,
      'X-Diagram-Engine-Version': rendered.engineVersion,
      'X-Diagram-Renderer': rendered.runtime,
      'X-Renderer-Build': env.RENDERER_BUILD,
    },
  })
}

async function renderRoute(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const input = await parseRenderRequest(request)
  // Check before consulting the gateway cache so a pre-cutover response cannot
  // hide the dedicated-unit boundary.
  assertGatewayRoutable(input.engine)
  const cacheKey = await cacheRequestFor(input, env)
  const cached = await caches.default.match(cacheKey)
  if (cached !== undefined) return responseWithCacheStatus(cached, 'HIT')
  const response = await render(input, env, request.signal)
  ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
  return responseWithCacheStatus(response, 'MISS')
}

function catalogResponse(): Response {
  return json({ format: 'svg', engines: ENGINE_CATALOG }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Headers': 'Accept, Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    try {
      if (request.method === 'GET' && url.pathname === '/render/v1/health') return json({ ok: true })
      if (request.method === 'GET' && url.pathname === '/render/v1/catalog') return catalogResponse()
      if (request.method === 'POST' && url.pathname === '/render/v1/svg') return await renderRoute(request, env, ctx)
      return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
    } catch (error) {
      if (!(error instanceof RequestError || error instanceof RenderError)) {
        console.error(JSON.stringify({
          message: 'unhandled render error',
          error: error instanceof Error ? error.message : String(error),
          path: url.pathname,
        }))
      }
      return errorResponse(error)
    }
  },
} satisfies ExportedHandler<Env>
