import { canonicalizeSvg, SvgNormalizationError, normalizationFor } from '../../shared/svg/index.js'

const CACHE_MAX_AGE = 1_800
const CACHE_SCHEMA = '1'
const MAX_REQUEST_BYTES = 1_048_576
const MAX_SOURCE_LENGTH = 524_288
const MAX_OPTION_COUNT = 64
const EXPOSED_HEADERS = [
  'Cache-Control', 'Content-Type', 'X-Diagram-Cache', 'X-Diagram-Engine',
  'X-Diagram-Engine-Version', 'X-Diagram-Pipeline', 'X-Diagram-Renderer',
  'X-Diagram-Unit', 'X-Renderer-Build',
].join(', ')

export interface BrowserUnitDescriptor {
  readonly id: string
  readonly kind: 'render' | 'translate'
  readonly version: string
  readonly build: string
  readonly pipeline: readonly string[]
  readonly frame: string
  readonly knownLosses: readonly string[]
  readonly license?: string
  readonly licenses?: string
  readonly source?: string
}

interface RenderRequest {
  engine: string
  source: string
  format: 'svg'
  options: Record<string, string>
  metadata: { title: string; description: string }
  presentation: { background: string; padding: number; frame: boolean }
}

interface BrowserRendererBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
}

interface BrowserUnitEnv {
  ASSETS: Fetcher
  BROWSER_RENDERER: BrowserRendererBinding
}

class UnitError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message)
    this.name = 'UnitError'
  }
}

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS)
  headers.set('Cache-Control', 'no-store')
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('X-Content-Type-Options', 'nosniff')
  return Response.json(value, { ...init, headers })
}

function errorResponse(error: unknown): Response {
  if (error instanceof UnitError) return json({ error: { code: error.code, message: error.message } }, { status: error.status })
  if (error instanceof SvgNormalizationError) return json({ error: { code: error.code, message: error.message } }, { status: error.status })
  return json({ error: { code: 'internal_error', message: 'The diagram could not be rendered.' } }, { status: 500 })
}

function objectValue(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new UnitError(400, 'invalid_request', `${name} must be an object.`)
  return value as Record<string, unknown>
}

function boundedString(value: unknown, name: string, maximum: number): string {
  if (typeof value !== 'string') throw new UnitError(400, 'invalid_request', `${name} must be a string.`)
  if (value.length > maximum) throw new UnitError(413, 'request_too_large', `${name} is too large.`)
  return value
}

async function bodyText(request: Request): Promise<string> {
  const length = request.headers.get('Content-Length')
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)) throw new UnitError(413, 'request_too_large', 'Render request is too large.')
  if (request.body === null) throw new UnitError(400, 'invalid_request', 'A JSON request body is required.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const item = await reader.read()
    if (item.done) break
    total += item.value.byteLength
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel('request too large')
      throw new UnitError(413, 'request_too_large', 'Render request is too large.')
    }
    chunks.push(item.value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder().decode(bytes)
}

function optionsValue(value: unknown): Record<string, string> {
  const input = value === undefined ? {} : objectValue(value, 'options')
  const entries = Object.entries(input)
  if (entries.length > MAX_OPTION_COUNT) throw new UnitError(400, 'invalid_options', `options cannot contain more than ${MAX_OPTION_COUNT} entries.`)
  const output: Record<string, string> = {}
  for (const [name, option] of entries) {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(name) || !['string', 'number', 'boolean'].includes(typeof option)) throw new UnitError(400, 'invalid_options', `Invalid renderer option: ${name}.`)
    const normalized = String(option)
    if (normalized.length > 4_096) throw new UnitError(400, 'invalid_options', `Renderer option ${name} is too large.`)
    output[name.toLowerCase()] = normalized
  }
  return output
}

function parseRequest(input: Record<string, unknown>, engine: string): RenderRequest {
  if (input.engine !== undefined) throw new UnitError(400, 'invalid_request', 'Renderer unit requests must not select an engine.')
  const source = boundedString(input.source, 'source', MAX_SOURCE_LENGTH)
  if (source.trim() === '') throw new UnitError(400, 'empty_source', 'Diagram source cannot be empty.')
  if (input.format !== undefined && input.format !== 'svg') throw new UnitError(400, 'unsupported_format', 'The v2 rendering plane currently supports SVG only.')
  const metadataInput = input.metadata === undefined ? {} : objectValue(input.metadata, 'metadata')
  const presentationInput = input.presentation === undefined ? {} : objectValue(input.presentation, 'presentation')
  const title = boundedString(metadataInput.title ?? '', 'metadata.title', 200)
  const description = boundedString(metadataInput.description ?? '', 'metadata.description', 2_000)
  const background = boundedString(presentationInput.background ?? '', 'presentation.background', 7)
  const padding = presentationInput.padding ?? 0
  const frame = presentationInput.frame ?? false
  if (background !== '' && !/^#[0-9a-f]{6}$/i.test(background)) throw new UnitError(400, 'invalid_presentation', 'presentation.background must be an RGB hex color.')
  if (!Number.isInteger(padding) || Number(padding) < 0 || Number(padding) > 256) throw new UnitError(400, 'invalid_presentation', 'presentation.padding must be an integer from 0 to 256.')
  if (typeof frame !== 'boolean') throw new UnitError(400, 'invalid_presentation', 'presentation.frame must be a boolean.')
  return { engine, source, format: 'svg', options: optionsValue(input.options), metadata: { title, description }, presentation: { background, padding: Number(padding), frame } }
}

async function parseUnitRequest(request: Request, engine: string): Promise<RenderRequest> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new UnitError(415, 'unsupported_media_type', 'Render requests must use application/json.')
  let input: unknown
  try { input = JSON.parse(await bodyText(request)) } catch (error) {
    if (error instanceof UnitError) throw error
    throw new UnitError(400, 'invalid_json', 'Render request is not valid JSON.')
  }
  return parseRequest(objectValue(input, 'request'), engine)
}

function canonicalRequest(request: RenderRequest): string {
  const { presentation: _presentation, ...canonical } = request
  return JSON.stringify({ ...canonical, options: Object.fromEntries(Object.entries(request.options).sort(([a], [b]) => a.localeCompare(b))) })
}

async function cacheKey(request: RenderRequest, descriptor: BrowserUnitDescriptor): Promise<Request> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest(request)))
  let binary = ''
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte)
  const encoded = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  return new Request(`https://diagramzip-browser-unit-cache.invalid/${CACHE_SCHEMA}/${descriptor.id}/${descriptor.build}/${encoded}`)
}

function identityHeaders(descriptor: BrowserUnitDescriptor, cache: 'HIT' | 'MISS'): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': EXPOSED_HEADERS,
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`, 'Content-Type': 'image/svg+xml; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    'X-Content-Type-Options': 'nosniff', 'X-Diagram-Cache': cache, 'X-Diagram-Engine': descriptor.id,
    'X-Diagram-Engine-Version': descriptor.version, 'X-Diagram-Renderer': 'browser-run',
    'X-Diagram-Unit': descriptor.id, 'X-Diagram-Pipeline': descriptor.pipeline.join(','), 'X-Renderer-Build': descriptor.build,
  })
  return headers
}

async function render(request: RenderRequest, descriptor: BrowserUnitDescriptor, env: BrowserUnitEnv): Promise<string> {
  const requestId = crypto.randomUUID()
  const response = await env.BROWSER_RENDERER.fetch('https://browser-run.internal/render', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Diagram-Request-Id': requestId },
    body: JSON.stringify({ engine: descriptor.id, source: request.source, requestId }),
  })
  if (!response.ok) {
    const status = response.status >= 400 && response.status < 500 ? response.status : 502
    throw new UnitError(status, status === 413 ? 'request_too_large' : 'render_failed', status === 413 ? 'Render request is too large.' : 'The browser renderer could not render the diagram.')
  }
  let result: unknown
  try { result = await response.json() } catch { throw new UnitError(502, 'render_failed', 'The browser renderer returned an invalid response.') }
  const payload = objectValue(result, 'browser renderer response')
  if (typeof payload.version !== 'string' || payload.version.length === 0 || typeof payload.build !== 'string' || payload.build.length === 0 || !Array.isArray(payload.pipeline) || payload.pipeline.some(value => typeof value !== 'string') || payload.pipeline[0] !== descriptor.id) {
    throw new UnitError(502, 'render_failed', 'The browser renderer returned an invalid result.')
  }
  const svg = payload.svg
  if (typeof svg !== 'string' || svg.length === 0) throw new UnitError(502, 'render_failed', 'The browser renderer returned no SVG.')
  return canonicalizeSvg(svg, request.metadata, descriptor.id, descriptor.version)
}

export function createBrowserRendererUnit(descriptor: BrowserUnitDescriptor): ExportedHandler<BrowserUnitEnv> {
  return {
    async fetch(request, env, ctx): Promise<Response> {
      const url = new URL(request.url)
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Headers': 'Accept, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Origin': '*', 'Access-Control-Max-Age': '86400' } })
      try {
        if (request.method === 'GET' && url.pathname === '/v1/health') return json({ ok: true, unit: descriptor.id, id: descriptor.id })
        if (request.method === 'GET' && url.pathname === '/v1/capabilities') return json({ ...descriptor, unit: descriptor.id, format: 'svg', runtime: 'browser-run', normalization: normalizationFor(descriptor.id, descriptor.version) }, { headers: { 'Cache-Control': 'public, max-age=300' } })
        if (request.method !== 'POST' || url.pathname !== '/v1/svg') {
          if (url.pathname.startsWith('/v1/')) return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
          return env.ASSETS.fetch(request)
        }
        const input = await parseUnitRequest(request, descriptor.id)
        const key = await cacheKey(input, descriptor)
        const cached = await caches.default.match(key)
        if (cached !== undefined) {
          const headers = new Headers(cached.headers); headers.set('X-Diagram-Cache', 'HIT')
          return new Response(cached.body, { status: cached.status, headers })
        }
        const body = await render(input, descriptor, env)
        const response = new Response(body, { headers: identityHeaders(descriptor, 'MISS') })
        ctx.waitUntil(caches.default.put(key, response.clone()))
        return response
      } catch (error) {
        if (!(error instanceof UnitError || error instanceof SvgNormalizationError)) console.error(JSON.stringify({ message: 'browser renderer unit error', unit: descriptor.id, error: error instanceof Error ? error.message : String(error) }))
        return errorResponse(error)
      }
    },
  }
}
