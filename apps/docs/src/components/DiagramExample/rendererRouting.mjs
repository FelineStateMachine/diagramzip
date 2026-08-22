export function httpRendererUrlFor(engine) {
  if (!/^[a-z0-9-]+$/.test(engine)) throw new Error('The renderer name is invalid.')
  return `https://${engine}.render.diagram.zip/v1/svg`
}
