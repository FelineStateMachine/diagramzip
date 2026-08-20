export const HTTP_RENDERER_UNITS = Object.freeze({
  bytefield: 'https://bytefield.render.diagram.zip/v1/svg',
  nomnoml: 'https://nomnoml.render.diagram.zip/v1/svg',
  vega: 'https://vega.render.diagram.zip/v1/svg',
  vegalite: 'https://vegalite.render.diagram.zip/v1/svg',
  wavedrom: 'https://wavedrom.render.diagram.zip/v1/svg',
})

export function httpRendererUnitFor(engine) {
  return HTTP_RENDERER_UNITS[engine] ?? null
}
