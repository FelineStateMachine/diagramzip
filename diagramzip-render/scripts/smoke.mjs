import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const endpoint = process.env.DIAGRAMZIP_RENDER_URL ?? 'http://127.0.0.1:8788/render/v1/svg'
const fixtureDirectory = resolve(import.meta.dirname, '../../ci/tests/diagrams')

const fixtures = {
  plantuml: 'architecture.puml',
  mermaid: 'contribute.mmd',
  graphviz: 'hello.dot',
  d2: 'connections.d2',
  c4plantuml: 'banking-system.puml',
  blockdiag: 'kroki.diag',
  seqdiag: 'sequence.diag',
  actdiag: 'actions.diag',
  nwdiag: 'network.diag',
  packetdiag: 'packet.diag',
  rackdiag: 'rack.diag',
  bpmn: 'example.bpmn',
  bytefield: 'bytefield.bf',
  dbml: 'dbml.dbml',
  diagramsnet: 'diagramsnet-venn.xml',
  ditaa: 'components.ditaa',
  erd: 'schema.erd',
  excalidraw: 'venn.excalidraw',
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

const expectedLabels = {
  mermaid: 'How to contribute?',
  d2: 'dogs',
  ditaa: 'Kroki',
  symbolator: 'Clocking',
  tikz: 'Hydrogen',
}

const canvasEngines = new Set(['graphviz', 'd2', 'ditaa', 'svgbob', 'symbolator'])

async function render([engine, filename]) {
  const source = await readFile(resolve(fixtureDirectory, filename), 'utf8')
  const presentation = canvasEngines.has(engine)
    ? { background: '#f3f3f3', padding: engine === 'svgbob' ? 256 : 24, frame: true }
    : { background: '', padding: 0, frame: false }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: 'image/svg+xml', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      engine,
      source,
      format: 'svg',
      options: {},
      metadata: { title: '', description: '' },
      presentation,
    }),
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`${engine}: HTTP ${response.status}: ${body.slice(0, 240)}`)
  if (!/<svg[\s>]/i.test(body)) throw new Error(`${engine}: response is not SVG`)
  if (!/\bviewBox\s*=|\bwidth\s*=.*\bheight\s*=/is.test(body)) throw new Error(`${engine}: SVG has no usable dimensions`)
  if (expectedLabels[engine] && !body.includes(expectedLabels[engine])) {
    throw new Error(`${engine}: expected label was removed from the SVG`)
  }
  if (engine === 'tikz' && !body.includes('data:application/x-font-woff;base64')) {
    throw new Error('tikz: embedded font stylesheet was removed from the SVG')
  }
  if (engine === 'd2' && (!body.includes('@keyframes dashdraw') || !body.includes('animation: dashdraw'))) {
    throw new Error('d2: animated connection stylesheet was removed from the SVG')
  }
  if (engine === 'symbolator' && !body.includes('.fnt1')) {
    throw new Error('symbolator: embedded stylesheet was removed from the SVG')
  }
  if (canvasEngines.has(engine)) {
    if (!body.includes('background-color:#f3f3f3') || !body.includes('fill="#f3f3f3"')) {
      throw new Error(`${engine}: selected canvas background was not applied`)
    }
    if (/class="backdrop"|<rect[^>]*width="100%"[^>]*height="100%"[^>]*fill="white"|<polygon fill="white" stroke="none"/i.test(body)) {
      throw new Error(`${engine}: renderer backdrop still masks the selected canvas`)
    }
  }
  if (engine === 'svgbob') {
    const root = body.match(/<svg\b[^>]*>/i)?.[0] ?? ''
    if (!/viewBox="-256 -256 /.test(root) || !/width="\d+(?:\.\d+)?"/.test(root) || !/height="\d+(?:\.\d+)?"/.test(root)) {
      throw new Error('svgbob: 256px padding was not applied to the SVG viewport')
    }
  }
  return {
    engine,
    runtime: response.headers.get('X-Diagram-Renderer') ?? 'unknown',
    bytes: new TextEncoder().encode(body).byteLength,
  }
}

const entries = Object.entries(fixtures)
const results = []
const failures = []
for (let index = 0; index < entries.length; index += 4) {
  const batch = await Promise.allSettled(entries.slice(index, index + 4).map(render))
  for (const result of batch) {
    if (result.status === 'fulfilled') results.push(result.value)
    else failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason))
  }
}

for (const result of results) console.log(`${result.engine.padEnd(13)} ${result.runtime.padEnd(10)} ${String(result.bytes).padStart(8)} bytes`)
if (failures.length > 0) {
  for (const failure of failures) console.error(failure)
  process.exitCode = 1
} else {
  console.log(`30/30 engines returned structurally valid SVG through ${endpoint}`)
}
