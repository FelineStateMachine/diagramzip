import { ENGINE_CATALOG } from './catalog'

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  headers.set('Access-Control-Allow-Origin', '*')
  return Response.json(value, { ...init, headers })
}

function catalogResponse(): Response {
  return json({ format: 'svg', engines: ENGINE_CATALOG }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Headers': 'Accept, Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    if (request.method === 'GET' && url.pathname === '/render/v1/health') return json({ ok: true })
    if (request.method === 'GET' && url.pathname === '/render/v1/catalog') return catalogResponse()
    return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
  },
} satisfies ExportedHandler<Env>
