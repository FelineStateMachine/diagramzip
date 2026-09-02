const base = (process.env.DIAGRAMZIP_RENDER_URL ?? 'http://127.0.0.1:8788').replace(/\/$/, '')

const [healthResponse, catalogResponse, removedRenderResponse] = await Promise.all([
  fetch(`${base}/render/v1/health`),
  fetch(`${base}/render/v1/catalog`),
  fetch(`${base}/render/v1/svg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine: 'graphviz', source: 'digraph { a -> b }', format: 'svg' }),
  }),
])

if (!healthResponse.ok) throw new Error(`Health check returned HTTP ${healthResponse.status}.`)
const health = await healthResponse.json()
if (health.ok !== true) throw new Error('The health response is invalid.')

if (!catalogResponse.ok) throw new Error(`Catalog check returned HTTP ${catalogResponse.status}.`)
const catalog = await catalogResponse.json()
if (catalog.format !== 'svg' || !Array.isArray(catalog.engines) || catalog.engines.length !== 32) {
  throw new Error('The catalog response does not contain all 32 SVG engines.')
}

if (removedRenderResponse.status !== 404) {
  throw new Error(`The removed render proxy returned HTTP ${removedRenderResponse.status}.`)
}

console.log('The catalog service is healthy. It lists 32 engines and has no render proxy.')
