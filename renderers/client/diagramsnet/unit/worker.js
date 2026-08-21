const CAPABILITIES = Object.freeze({
  id: 'diagramsnet',
  kind: 'render',
  format: 'svg',
  runtime: 'client',
  version: 'diagrams.net@29.6.1',
  build: 'diagramsnet-29.6.1-client-unit-1',
  pipeline: ['diagramsnet'],
  frame: '/index.html?v=1',
  license: 'Apache-2.0 AND LicenseRef-diagrams-net-assets',
  licenses: '/licenses/',
  source: '/SOURCE.md',
  knownLosses: [
    'Rendering requires the sandboxed browser exporter; there is no server-side rendering fallback.',
    'External resources are blocked; embedded data images remain supported.',
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
    if (url.pathname.startsWith('/v1/')) return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
    return env.ASSETS.fetch(request)
  },
}
