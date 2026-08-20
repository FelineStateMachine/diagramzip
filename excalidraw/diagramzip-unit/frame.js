const CHANNEL = 'diagram.zip:renderer:v1'
const ENGINE = 'excalidraw'
const VERSION = '@excalidraw/excalidraw@0.18.1'
const MAX_SOURCE_LENGTH = 524_288

// The frame has an opaque origin because diagram.zip omits allow-same-origin.
// Resolve font files against the document URL rather than location.origin.
window.EXCALIDRAW_ASSET_PATH = new URL('/', window.location.href).href
const library = import('@excalidraw/excalidraw')

let queue = Promise.resolve()

function sceneFrom(source) {
  if (typeof source !== 'string' || source.length > MAX_SOURCE_LENGTH) {
    throw new Error('Excalidraw source must be a JSON string no larger than 512 KiB.')
  }
  const scene = JSON.parse(source)
  if (typeof scene !== 'object' || scene === null || Array.isArray(scene)) {
    throw new Error('Excalidraw source must be a JSON object.')
  }
  return scene
}

window.addEventListener('message', event => {
  const message = event.data
  if (
    event.source !== parent
    || message?.channel !== CHANNEL
    || message?.type !== 'render'
    || message?.engine !== ENGINE
    || typeof message?.requestId !== 'string'
  ) return

  queue = queue.then(async () => {
    try {
      const { exportToSvg } = await library
      const svg = await exportToSvg(sceneFrom(message.source))
      parent.postMessage({
        channel: CHANNEL,
        type: 'result',
        requestId: message.requestId,
        ok: true,
        svg: svg.outerHTML,
        version: VERSION,
      }, '*')
    } catch (error) {
      parent.postMessage({
        channel: CHANNEL,
        type: 'result',
        requestId: message.requestId,
        ok: false,
        error: error instanceof Error ? error.message.slice(0, 500) : 'Excalidraw rendering failed.',
      }, '*')
    }
  })
})

parent.postMessage({ channel: CHANNEL, type: 'ready', engine: ENGINE, version: VERSION }, '*')
