import { parseStructurizr, lowerStructurizr } from '../structurizr'
import { RenderError, RequestError } from '../errors'
import { parseUnitRenderRequest } from '../validation'

const UNIT_ID = 'structurizr'
const VERSION = 'structurizr@6.2.2/plantuml@1.2026.6-translation-1'
const EXPOSED = 'Cache-Control, Content-Type, X-Diagram-Cache, X-Diagram-Engine, X-Diagram-Engine-Version, X-Diagram-Pipeline, X-Diagram-Renderer, X-Diagram-Unit, X-Renderer-Build'

interface StructurizrEnv { RENDERER_BUILD: string; PLANTUML: Fetcher }

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  headers.set('Access-Control-Allow-Origin', '*')
  return Response.json(value, { ...init, headers })
}

function errorResponse(error: unknown): Response {
  if (error instanceof RequestError || error instanceof RenderError) return json({ error: { code: error.code, message: error.message } }, { status: error.status })
  return json({ error: { code: 'internal_error', message: 'The Structurizr diagram could not be rendered.' } }, { status: 500 })
}

async function cacheKey(input: unknown, build: string): Promise<Request> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(input)))
  let binary = ''; for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte)
  const hash = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  return new Request(`https://diagramzip-structurizr-cache.invalid/${encodeURIComponent(build)}/${hash}`)
}

export default {
  async fetch(request: Request, env: StructurizrEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Headers': 'Accept, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Origin': '*', 'Access-Control-Max-Age': '86400' } })
    try {
      if (request.method === 'GET' && url.pathname === '/v1/health') return json({ ok: true, unit: UNIT_ID, id: UNIT_ID })
      if (request.method === 'GET' && url.pathname === '/v1/capabilities') return json({
        unit: UNIT_ID, id: UNIT_ID, kind: 'translate', format: 'svg', runtime: 'edge-js', version: VERSION,
        build: env.RENDERER_BUILD, pipeline: [UNIT_ID, 'plantuml-family', 'plantuml'],
        knownLosses: ['Only SVG is supported.', 'Structurizr scripts, docs, plugins, filesystem access, and arbitrary remote themes are rejected.', 'Layout and typography may differ from the legacy Structurizr exporter.'],
      }, { headers: { 'Cache-Control': 'public, max-age=300' } })
      if (request.method !== 'POST' || url.pathname !== '/v1/svg') return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
      const input = await parseUnitRenderRequest(request, 'structurizr')
      const key = await cacheKey(input, env.RENDERER_BUILD)
      let cached: Response | undefined
      try { cached = await caches.default.match(key) } catch (error) { console.warn(JSON.stringify({ message: 'Structurizr cache read failed', error: String(error) })) }
      if (cached) { const headers = new Headers(cached.headers); headers.set('X-Diagram-Cache', 'HIT'); return new Response(cached.body, { status: cached.status, headers }) }
      const lowered = lowerStructurizr(parseStructurizr(input.source), input.options)
      const downstream = await env.PLANTUML.fetch(new Request('https://plantuml.render.diagram.zip/v1/svg', {
        method: 'POST', headers: { Accept: 'image/svg+xml', 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: lowered, format: 'svg', options: {}, metadata: input.metadata, presentation: input.presentation }),
        signal: request.signal,
      }))
      if (!downstream.ok) return new Response(downstream.body, { status: downstream.status, headers: downstream.headers })
      const headers = new Headers(downstream.headers)
      headers.set('Access-Control-Allow-Origin', '*'); headers.set('Access-Control-Expose-Headers', EXPOSED)
      headers.set('X-Diagram-Engine', 'structurizr'); headers.set('X-Diagram-Engine-Version', VERSION); headers.set('X-Diagram-Unit', UNIT_ID); headers.set('X-Diagram-Pipeline', `${UNIT_ID},plantuml-family,plantuml`); headers.set('X-Diagram-Renderer', 'edge-js'); headers.set('X-Renderer-Build', env.RENDERER_BUILD); headers.set('X-Diagram-Cache', 'MISS')
      const response = new Response(downstream.body, { status: downstream.status, headers })
      try {
        if (typeof caches !== 'undefined') ctx.waitUntil(caches.default.put(key, response.clone()).catch(error => console.warn(JSON.stringify({ message: 'Structurizr cache write failed', error: String(error) }))))
      } catch (error) { console.warn(JSON.stringify({ message: 'Structurizr cache write failed', error: String(error) })) }
      return response
    } catch (error) {
      if (!(error instanceof RequestError || error instanceof RenderError)) console.error(JSON.stringify({ message: 'unhandled Structurizr error', error: error instanceof Error ? error.message : String(error) }))
      return errorResponse(error)
    }
  },
} satisfies ExportedHandler<StructurizrEnv>
