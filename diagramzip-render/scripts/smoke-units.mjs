import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const fixtureDirectory = resolve(import.meta.dirname, '../../ci/tests/diagrams')
const fixtures = {
  bytefield: 'bytefield.bf',
  nomnoml: 'pirate.nomnoml',
  vega: 'bar-chart.vega',
  vegalite: 'discretizing-scale.vlite',
  wavedrom: 'wavedrom.json5',
}

async function smoke([engine, filename]) {
  const source = await readFile(resolve(fixtureDirectory, filename), 'utf8')
  const endpoint = `https://${engine}.render.diagram.zip/v1/svg`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: 'image/svg+xml', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source,
      format: 'svg',
      options: {},
      metadata: { title: '', description: '' },
      presentation: { background: '', padding: 0, frame: false },
    }),
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`${engine}: HTTP ${response.status}: ${body.slice(0, 240)}`)
  if (!/<svg[\s>]/i.test(body)) throw new Error(`${engine}: response is not SVG`)
  if (response.headers.get('X-Diagram-Unit') !== engine) throw new Error(`${engine}: unit identity header is missing`)
  const pipeline = response.headers.get('X-Diagram-Pipeline')
  if (engine === 'vegalite' ? pipeline !== 'vegalite,vega' : pipeline !== engine) {
    throw new Error(`${engine}: unexpected pipeline ${pipeline}`)
  }
  return `${engine.padEnd(10)} ${response.headers.get('X-Diagram-Cache')?.padEnd(4)} ${body.length} bytes`
}

const results = await Promise.all(Object.entries(fixtures).map(smoke))
for (const result of results) console.log(result)
console.log(`${results.length}/${results.length} independent renderer units returned SVG`)
