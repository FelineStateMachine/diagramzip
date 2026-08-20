import { RenderError, RequestError } from './errors'
import { sanitizeAndDecorateSvg } from './svg'
import type { EngineId, RendererAdapter, RenderRequest } from './types'
import { parseUnitRenderRequest } from './validation'

const CACHE_MAX_AGE = 1_800

export interface RendererUnitDescriptor {
  readonly id: EngineId
  readonly kind: 'render' | 'translate' | 'compatibility'
  readonly adapter: RendererAdapter
  readonly pipeline?: readonly EngineId[]
  readonly knownLosses?: readonly string[]
}

interface RendererUnitEnv {
  RENDERER_BUILD: string
}

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

function canonicalRequest(request: RenderRequest): string {
  const options = Object.fromEntries(Object.entries(request.options).sort(([left], [right]) => left.localeCompare(right)))
  return JSON.stringify({ ...request, options })
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

async function cacheRequestFor(request: RenderRequest, build: string): Promise<Request> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest(request)))
  return new Request(`https://diagramzip-unit-cache.invalid/${encodeURIComponent(request.engine)}/${encodeURIComponent(build)}/${base64Url(new Uint8Array(digest))}`)
}

function responseWithCacheStatus(response: Response, status: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Diagram-Cache', status)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function render(
  descriptor: RendererUnitDescriptor,
  request: RenderRequest,
  build: string,
  signal: AbortSignal,
): Promise<Response> {
  const rendered = await descriptor.adapter.render(request, signal)
  if (signal.aborted) throw signal.reason
  const body = sanitizeAndDecorateSvg(rendered.body, request.metadata, request.presentation, descriptor.id)
  return new Response(body, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Diagram-Engine': descriptor.id,
      'X-Diagram-Engine-Version': rendered.engineVersion,
      'X-Diagram-Renderer': rendered.runtime,
      'X-Diagram-Unit': descriptor.id,
      'X-Diagram-Pipeline': [descriptor.id, ...(descriptor.pipeline ?? [])].join(','),
      'X-Renderer-Build': build,
    },
  })
}

function capabilities(descriptor: RendererUnitDescriptor, build: string): Response {
  return json({
    id: descriptor.id,
    kind: descriptor.kind,
    format: 'svg',
    runtime: descriptor.adapter.runtime,
    version: descriptor.adapter.version,
    build,
    pipeline: [descriptor.id, ...(descriptor.pipeline ?? [])],
    knownLosses: descriptor.knownLosses ?? [],
  }, { headers: { 'Cache-Control': 'public, max-age=300' } })
}

export function createRendererUnit(descriptor: RendererUnitDescriptor): ExportedHandler<RendererUnitEnv> {
  if (descriptor.adapter.id !== descriptor.id) throw new Error('Renderer unit adapter identity does not match its unit identity.')

  return {
    async fetch(request, env, ctx): Promise<Response> {
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
        if (request.method === 'GET' && url.pathname === '/v1/health') return json({ ok: true, id: descriptor.id })
        if (request.method === 'GET' && url.pathname === '/v1/capabilities') return capabilities(descriptor, env.RENDERER_BUILD)
        if (request.method !== 'POST' || url.pathname !== '/v1/svg') {
          return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
        }
        const input = await parseUnitRenderRequest(request, descriptor.id)
        const cacheKey = await cacheRequestFor(input, env.RENDERER_BUILD)
        const cached = await caches.default.match(cacheKey)
        if (cached !== undefined) return responseWithCacheStatus(cached, 'HIT')
        const response = await render(descriptor, input, env.RENDERER_BUILD, request.signal)
        ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
        return responseWithCacheStatus(response, 'MISS')
      } catch (error) {
        if (!(error instanceof RequestError || error instanceof RenderError)) {
          console.error(JSON.stringify({
            message: 'unhandled renderer unit error',
            unit: descriptor.id,
            error: error instanceof Error ? error.message : String(error),
            path: url.pathname,
          }))
        }
        return errorResponse(error)
      }
    },
  }
}
