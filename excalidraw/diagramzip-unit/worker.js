const CAPABILITIES = Object.freeze({
  id: 'excalidraw',
  kind: 'render',
  format: 'svg',
  runtime: 'client',
  version: '@excalidraw/excalidraw@0.18.1',
  build: 'excalidraw-0.18.1-client-unit-1',
  pipeline: ['excalidraw'],
  frame: '/index.html?v=3',
  knownLosses: [
    'External resources are blocked; image data must be embedded in the scene.',
    'Font subsetting is disabled by the sandbox policy, so exports embed the complete self-hosted font.',
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
