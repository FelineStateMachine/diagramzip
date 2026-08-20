import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const fixtureDirectory = resolve(import.meta.dirname, '../../ci/tests/diagrams')
const fixtures = {
  plantuml: 'architecture.puml',
  graphviz: 'hello.dot',
  d2: 'connections.d2',
  c4plantuml: 'banking-system.puml',
  blockdiag: 'kroki.diag',
  seqdiag: 'sequence.diag',
  actdiag: 'actions.diag',
  nwdiag: 'network.diag',
  packetdiag: 'packet.diag',
  rackdiag: 'rack.diag',
  bytefield: 'bytefield.bf',
  dbml: 'dbml.dbml',
  diagramsnet: 'diagramsnet-venn.xml',
  ditaa: 'components.ditaa',
  erd: 'schema.erd',
  goat: 'components.goat',
  nomnoml: 'pirate.nomnoml',
  pikchr: 'diamond.pikchr',
  structurizr: 'gettingstarted.structurizr',
  svgbob: 'cloud.bob',
  symbolator: 'component.sv',
  tikz: 'periodic-table.tex',
  umlet: 'umlet.xml',
  vega: 'bar-chart.vega',
  vegalite: 'discretizing-scale.vlite',
  wavedrom: 'wavedrom.json5',
  wireviz: 'wireviz.yaml',
}

const sharedUnits = {
  plantuml: 'plantuml-family',
  c4plantuml: 'plantuml-family',
  blockdiag: 'blockdiag-family',
  seqdiag: 'blockdiag-family',
  actdiag: 'blockdiag-family',
  nwdiag: 'blockdiag-family',
  packetdiag: 'blockdiag-family',
  rackdiag: 'blockdiag-family',
  vega: 'vega-family',
  vegalite: 'vega-family',
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
  const expectedUnit = sharedUnits[engine] ?? engine
  if (response.headers.get('X-Diagram-Unit') !== expectedUnit) {
    throw new Error(`${engine}: expected unit ${expectedUnit}, received ${response.headers.get('X-Diagram-Unit')}`)
  }
  const pipeline = response.headers.get('X-Diagram-Pipeline')
  const expectedPipeline = engine === 'vegalite' ? `${expectedUnit},vega` : expectedUnit
  if (pipeline !== expectedPipeline) {
    throw new Error(`${engine}: unexpected pipeline ${pipeline}`)
  }
  return `${engine.padEnd(10)} ${response.headers.get('X-Diagram-Cache')?.padEnd(4)} ${body.length} bytes`
}

const entries = Object.entries(fixtures)
const results = []
for (let index = 0; index < entries.length; index += 4) {
  results.push(...await Promise.all(entries.slice(index, index + 4).map(smoke)))
}
for (const result of results) console.log(result)
console.log(`${results.length}/${results.length} catalog engines returned SVG through dependency-backed units`)
