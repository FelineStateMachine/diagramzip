const CAPABILITIES = Object.freeze({
  id: 'mermaid',
  kind: 'render',
  format: 'svg',
  runtime: 'client',
  version: 'mermaid@11.17.0',
  build: 'mermaid-11.17.0-client-unit-1',
  pipeline: ['mermaid'],
  frame: '/index.html?v=1',
  knownLosses: [
    'External links and resource-loading elements are removed; XHTML labels retain only safe text formatting.',
  ],
})

function json(value, init = {}) {
  const headers = new Headers(init.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Cache-Control', 'public, max-age=300')
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return Response.json(value, { ...init, headers })
}

export default {
  fetch(request, env) {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/v1/health') return json({ ok: true, id: CAPABILITIES.id })
    if (request.method === 'GET' && url.pathname === '/v1/capabilities') return json(CAPABILITIES)
    if (url.pathname.startsWith('/v1/')) {
      return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
    }
    return env.ASSETS.fetch(request)
  },
}
