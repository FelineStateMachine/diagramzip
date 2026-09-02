import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const diagramDirectory = resolve(import.meta.dirname, '../../examples/diagrams')
const diagrams = {
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
  squaring: 'order-nine.squaring',
  trn: 'zenith.trn',
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
  graphviz: 'graphviz-family',
  dbml: 'graphviz-family',
  erd: 'graphviz-family',
  vega: 'vega-family',
  vegalite: 'vega-family',
  wireviz: 'wireviz',
  structurizr: 'structurizr',
  svgbob: 'svgbob-family',
  ditaa: 'svgbob-family',
}

const pythonEngines = new Set(['blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'packetdiag', 'rackdiag'])
const graphvizEngines = new Set(['graphviz', 'erd', 'dbml'])
const pikchrEngines = new Set(['pikchr'])
const svgbobEngines = new Set(['svgbob', 'ditaa'])
const goatEngines = new Set(['goat'])
const wirevizEngines = new Set(['wireviz'])
const plantumlEngines = new Set(['plantuml', 'c4plantuml'])
const structurizrEngines = new Set(['structurizr'])
const d2Engines = new Set(['d2'])
const symbolatorEngines = new Set(['symbolator'])
const umletEngines = new Set(['umlet'])
const browserRunEngines = new Set(['mermaid', 'diagramsnet'])
const bpmnEngines = new Set(['bpmn'])
const excalidrawEngines = new Set(['excalidraw'])
const tikzEngines = new Set(['tikz'])

async function smoke([engine, filename]) {
  const source = await readFile(resolve(diagramDirectory, filename), 'utf8')
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
  const expectedPipeline = engine === 'vegalite'
    ? `${expectedUnit},vega`
    : engine === 'graphviz'
      ? `${expectedUnit},graphviz`
      : engine === 'erd'
        ? `${expectedUnit},erd,graphviz`
        : engine === 'dbml'
          ? `${expectedUnit},dbml,graphviz`
        : engine === 'wireviz'
          ? `${expectedUnit},graphviz-family,graphviz`
        : engine === 'structurizr'
          ? `${expectedUnit},plantuml-family,plantuml`
        : engine === 'ditaa'
          ? `${expectedUnit},svgbob`
        : expectedUnit
  if (pipeline !== expectedPipeline) {
    throw new Error(`${engine}: unexpected pipeline ${pipeline}`)
  }
  if (browserRunEngines.has(engine) && response.headers.get('X-Diagram-Renderer') !== 'browser-run') {
    throw new Error(`${engine}: expected browser-run renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
  }
  if (bpmnEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-js') throw new Error(`${engine}: expected edge-js renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('bpmn-direct-svg-')) throw new Error(`${engine}: unexpected BPMN Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  if (excalidrawEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-js') throw new Error(`${engine}: expected edge-js renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('excalidraw-0.18.1-edge-dom-')) throw new Error(`${engine}: unexpected Excalidraw Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  if (tikzEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-wasm') throw new Error(`${engine}: expected edge-wasm renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('tikzjax-1.0.63-edge-core-')) throw new Error(`${engine}: unexpected TikZ Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  if (pythonEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-python') {
      throw new Error(`${engine}: expected edge-python renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    }
    if (!response.headers.get('X-Renderer-Build')?.startsWith('blockdiag-3.4.2-family-python-')) {
      throw new Error(`${engine}: unexpected Python Worker build ${response.headers.get('X-Renderer-Build')}`)
    }
  }
  if (graphvizEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-wasm') {
      throw new Error(`${engine}: expected edge-wasm renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    }
    if (!response.headers.get('X-Renderer-Build')?.startsWith('graphviz-15.1.1-family-edge-wasm-')) {
      throw new Error(`${engine}: unexpected GraphViz-family Worker build ${response.headers.get('X-Renderer-Build')}`)
    }
  }
  if (pikchrEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-wasm') {
      throw new Error(`${engine}: expected edge-wasm renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    }
    if (!response.headers.get('X-Renderer-Build')?.startsWith('pikchr-85e65b9686-edge-wasm-')) {
      throw new Error(`${engine}: unexpected Pikchr Worker build ${response.headers.get('X-Renderer-Build')}`)
    }
  }
  if (svgbobEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-wasm') {
      throw new Error(`${engine}: expected edge-wasm renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    }
    if (!response.headers.get('X-Renderer-Build')?.startsWith('svgbob-0.7.6-ditaa-translation-')) {
      throw new Error(`${engine}: unexpected Svgbob Worker build ${response.headers.get('X-Renderer-Build')}`)
    }
  }
  if (goatEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-wasm') throw new Error(`${engine}: expected edge-wasm renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('goat-0.5.1-edge-wasm-')) throw new Error(`${engine}: unexpected GoAT Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  if (wirevizEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-python') {
      throw new Error(`${engine}: expected edge-python renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    }
    if (!response.headers.get('X-Renderer-Build')?.startsWith('wireviz-0.3.2-python-dot-')) {
      throw new Error(`${engine}: unexpected WireViz Worker build ${response.headers.get('X-Renderer-Build')}`)
    }
  }
  if (plantumlEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-wasm') {
      throw new Error(`${engine}: expected edge-wasm renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    }
    if (!response.headers.get('X-Renderer-Build')?.startsWith('plantuml-family-edge-wasm-')) {
      throw new Error(`${engine}: unexpected PlantUML-family Worker build ${response.headers.get('X-Renderer-Build')}`)
    }
  }
  if (structurizrEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-js') throw new Error(`${engine}: expected edge-js renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('structurizr-6.2.2-plantuml-translation-')) throw new Error(`${engine}: unexpected Structurizr Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  if (d2Engines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-wasm') throw new Error(`${engine}: expected edge-wasm renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('d2-0.7.1-dagre-wasm-')) throw new Error(`${engine}: unexpected D2 Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  if (symbolatorEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-python') throw new Error(`${engine}: expected edge-python renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('symbolator-python-')) throw new Error(`${engine}: unexpected Symbolator Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  if (umletEngines.has(engine)) {
    if (response.headers.get('X-Diagram-Renderer') !== 'edge-js') throw new Error(`${engine}: expected edge-js renderer, received ${response.headers.get('X-Diagram-Renderer')}`)
    if (!response.headers.get('X-Renderer-Build')?.startsWith('umlet-direct-svg-')) throw new Error(`${engine}: unexpected UMLet Worker build ${response.headers.get('X-Renderer-Build')}`)
  }
  return `${engine.padEnd(10)} ${response.headers.get('X-Diagram-Cache')?.padEnd(4)} ${body.length} bytes`
}

const entries = Object.entries(diagrams)
const results = []
for (let index = 0; index < entries.length; index += 4) {
  results.push(...await Promise.all(entries.slice(index, index + 4).map(smoke)))
}
for (const result of results) console.log(result)
console.log(`${results.length}/${results.length} catalog engines passed structural unit smoke`)
