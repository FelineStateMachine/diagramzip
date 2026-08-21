export const CLIENT_RENDERERS = Object.freeze({
  mermaid: 'https://mermaid.render.diagram.zip/index.html?v=1',
  bpmn: 'https://bpmn.render.diagram.zip/index.html?v=1',
  excalidraw: 'https://excalidraw.render.diagram.zip/index.html?v=3',
  diagramsnet: 'https://diagramsnet.render.diagram.zip/index.html?v=1',
  tikz: 'https://tikz.render.diagram.zip/index.html?v=1',
})

export const CLIENT_RENDERER_IDS = Object.freeze(Object.keys(CLIENT_RENDERERS))

export function clientFrameUrlFor(engine) {
  return CLIENT_RENDERERS[engine] || null
}

export function httpRendererUrlFor(engine) {
  if (!/^[a-z0-9-]+$/.test(engine)) throw new Error('The renderer name is invalid.')
  return `https://${engine}.render.diagram.zip/v1/svg`
}
