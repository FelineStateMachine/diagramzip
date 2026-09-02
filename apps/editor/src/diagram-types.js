const DIAGRAM_TYPES = [
  ['plantuml', 'PlantUML'],
  ['mermaid', 'Mermaid'],
  ['graphviz', 'GraphViz'],
  ['d2', 'D2'],
  ['c4plantuml', 'C4 PlantUML'],
  ['blockdiag', 'BlockDiag'],
  ['seqdiag', 'SeqDiag'],
  ['actdiag', 'ActDiag'],
  ['nwdiag', 'NwDiag'],
  ['packetdiag', 'PacketDiag'],
  ['rackdiag', 'RackDiag'],
  ['squaring', 'Squaring'],
  ['bpmn', 'BPMN'],
  ['bytefield', 'Bytefield'],
  ['dbml', 'DBML'],
  ['diagramsnet', 'Diagrams.net'],
  ['ditaa', 'Ditaa'],
  ['erd', 'ERD'],
  ['excalidraw', 'Excalidraw'],
  ['goat', 'GoAT'],
  ['nomnoml', 'Nomnoml'],
  ['pikchr', 'Pikchr'],
  ['structurizr', 'Structurizr'],
  ['svgbob', 'Svgbob'],
  ['symbolator', 'Symbolator'],
  ['tikz', 'TikZ'],
  ['trn', 'TRN'],
  ['umlet', 'UMLet'],
  ['vega', 'Vega'],
  ['vegalite', 'Vega-Lite'],
  ['wavedrom', 'WaveDrom'],
  ['wireviz', 'WireViz'],
]

export const diagramTypes = DIAGRAM_TYPES.map(([id, label]) => ({ id, label }))

export function isKnownDiagramType(type) {
  return diagramTypes.some(diagramType => diagramType.id === type)
}

/** Return the known diagram type from a URL query string, or null. */
export function diagramTypeFromQuery(search = '') {
  const params = new URLSearchParams(search)
  const type = params.get('type')
  return isKnownDiagramType(type) ? type : null
}

export function urlWithDiagramType(url, type) {
  if (!isKnownDiagramType(type)) throw new Error('Unsupported diagram type.')
  const next = new URL(url, 'https://diagram.zip')
  next.searchParams.set('type', type)
  return `${next.pathname}${next.search}${next.hash}`
}
