export const HTTP_RENDERER_UNITS = Object.freeze({
  plantuml: 'https://plantuml.render.diagram.zip/v1/svg',
  graphviz: 'https://graphviz.render.diagram.zip/v1/svg',
  d2: 'https://d2.render.diagram.zip/v1/svg',
  c4plantuml: 'https://c4plantuml.render.diagram.zip/v1/svg',
  blockdiag: 'https://blockdiag.render.diagram.zip/v1/svg',
  seqdiag: 'https://seqdiag.render.diagram.zip/v1/svg',
  actdiag: 'https://actdiag.render.diagram.zip/v1/svg',
  nwdiag: 'https://nwdiag.render.diagram.zip/v1/svg',
  packetdiag: 'https://packetdiag.render.diagram.zip/v1/svg',
  rackdiag: 'https://rackdiag.render.diagram.zip/v1/svg',
  bytefield: 'https://bytefield.render.diagram.zip/v1/svg',
  dbml: 'https://dbml.render.diagram.zip/v1/svg',
  ditaa: 'https://ditaa.render.diagram.zip/v1/svg',
  erd: 'https://erd.render.diagram.zip/v1/svg',
  goat: 'https://goat.render.diagram.zip/v1/svg',
  nomnoml: 'https://nomnoml.render.diagram.zip/v1/svg',
  pikchr: 'https://pikchr.render.diagram.zip/v1/svg',
  structurizr: 'https://structurizr.render.diagram.zip/v1/svg',
  svgbob: 'https://svgbob.render.diagram.zip/v1/svg',
  symbolator: 'https://symbolator.render.diagram.zip/v1/svg',
  tikz: 'https://tikz.render.diagram.zip/v1/svg',
  umlet: 'https://umlet.render.diagram.zip/v1/svg',
  vega: 'https://vega.render.diagram.zip/v1/svg',
  vegalite: 'https://vegalite.render.diagram.zip/v1/svg',
  wavedrom: 'https://wavedrom.render.diagram.zip/v1/svg',
  wireviz: 'https://wireviz.render.diagram.zip/v1/svg',
})

export const NO_GATEWAY_FALLBACK_ENGINES = Object.freeze([
  'mermaid', 'bpmn', 'excalidraw', 'diagramsnet',
  'plantuml', 'c4plantuml',
  'bytefield', 'nomnoml', 'vega', 'vegalite', 'wavedrom',
  'blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'packetdiag', 'rackdiag',
  'graphviz', 'erd', 'dbml', 'goat', 'pikchr', 'svgbob', 'wireviz',
])

export function requiresDedicatedRenderer(engine) {
  return NO_GATEWAY_FALLBACK_ENGINES.includes(engine)
}

export function httpRendererUnitFor(engine) {
  return HTTP_RENDERER_UNITS[engine] ?? null
}
