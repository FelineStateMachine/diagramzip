import { RenderError, RequestError } from './errors'
import { sanitizeAndDecorateSvg } from './svg'
import type { EngineId, RendererAdapter, RenderRequest } from './types'
import { parseUnitRenderRequest } from './validation'

const CACHE_MAX_AGE = 1_800
const CACHE_SCHEMA = '2'
const EXPOSED_RESPONSE_HEADERS = [
  'Cache-Control',
  'Content-Type',
  'X-Diagram-Cache',
  'X-Diagram-Engine',
  'X-Diagram-Engine-Version',
  'X-Diagram-Pipeline',
  'X-Diagram-Renderer',
  'X-Diagram-Unit',
  'X-Renderer-Build',
].join(', ')

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
  return new Request(`https://diagramzip-unit-cache.invalid/${CACHE_SCHEMA}/${encodeURIComponent(request.engine)}/${encodeURIComponent(build)}/${base64Url(new Uint8Array(digest))}`)
}

function responseWithCacheStatus(response: Response, status: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Diagram-Cache', status)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

async function render(
  unitId: string,
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
      'Access-Control-Expose-Headers': EXPOSED_RESPONSE_HEADERS,
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Diagram-Engine': descriptor.id,
      'X-Diagram-Engine-Version': rendered.engineVersion,
      'X-Diagram-Renderer': rendered.runtime,
      'X-Diagram-Unit': unitId,
      'X-Diagram-Pipeline': [unitId, ...(descriptor.pipeline ?? [])].join(','),
      'X-Renderer-Build': build,
    },
  })
}

function capabilities(unitId: string, descriptor: RendererUnitDescriptor, build: string): Response {
  return json({
    unit: unitId,
    id: descriptor.id,
    kind: descriptor.kind,
    format: 'svg',
    runtime: descriptor.adapter.runtime,
    version: descriptor.adapter.version,
    build,
    pipeline: [unitId, ...(descriptor.pipeline ?? [])],
    knownLosses: descriptor.knownLosses ?? [],
  }, { headers: { 'Cache-Control': 'public, max-age=300' } })
}

export function createRendererUnit(descriptor: RendererUnitDescriptor): ExportedHandler<RendererUnitEnv> {
  return createRendererUnitGroup(descriptor.id, [descriptor])
}

function engineFromHostname(hostname: string): string {
  return hostname.split('.')[0]?.toLowerCase() ?? ''
}

export function createRendererUnitGroup(
  unitId: string,
  descriptors: readonly RendererUnitDescriptor[],
): ExportedHandler<RendererUnitEnv> {
  if (descriptors.length === 0) throw new Error('A renderer unit group must contain at least one engine.')
  const byEngine = new Map<EngineId, RendererUnitDescriptor>()
  for (const descriptor of descriptors) {
    if (descriptor.adapter.id !== descriptor.id) throw new Error('Renderer adapter identity does not match its engine identity.')
    if (byEngine.has(descriptor.id)) throw new Error(`Renderer engine ${descriptor.id} is declared more than once.`)
    byEngine.set(descriptor.id, descriptor)
  }

  return {
    async fetch(request, env, ctx): Promise<Response> {
      const url = new URL(request.url)
      const requestedEngine = engineFromHostname(url.hostname)
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
        const descriptor = byEngine.get(requestedEngine as EngineId)
        if (descriptor === undefined) {
          return json({ error: { code: 'not_found', message: 'This renderer unit does not serve the requested engine.' } }, { status: 404 })
        }
        if (request.method === 'GET' && url.pathname === '/v1/health') return json({ ok: true, unit: unitId, id: descriptor.id })
        if (request.method === 'GET' && url.pathname === '/v1/capabilities') return capabilities(unitId, descriptor, env.RENDERER_BUILD)
        if (request.method !== 'POST' || url.pathname !== '/v1/svg') {
          return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
        }
        const input = await parseUnitRenderRequest(request, descriptor.id)
        const cacheKey = await cacheRequestFor(input, env.RENDERER_BUILD)
        const cached = await caches.default.match(cacheKey)
        if (cached !== undefined) return responseWithCacheStatus(cached, 'HIT')
        const response = await render(unitId, descriptor, input, env.RENDERER_BUILD, request.signal)
        ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
        return responseWithCacheStatus(response, 'MISS')
      } catch (error) {
        if (!(error instanceof RequestError || error instanceof RenderError)) {
          console.error(JSON.stringify({
            message: 'unhandled renderer unit error',
            unit: unitId,
            engine: requestedEngine,
            error: error instanceof Error ? error.message : String(error),
            path: url.pathname,
          }))
        }
        return errorResponse(error)
      }
    },
  }
}
