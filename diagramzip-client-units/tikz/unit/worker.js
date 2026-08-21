const CAPABILITIES = Object.freeze({
  id: 'tikz',
  kind: 'render',
  format: 'svg',
  runtime: 'client',
  version: '@planktimerr/tikzjax@1.0.63',
  build: 'tikzjax-1.0.63-client-unit-2',
  pipeline: ['tikz'],
  frame: '/index.html?v=1',
  knownLosses: [
    'The browser unit uses the bundled TeX/PGF package set, not the full TeX Live installation.',
    'Layout, fonts, and SVG details can differ from the native dvisvgm renderer.',
    'External files, shell escape, external links, and resource loads are unavailable.',
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
