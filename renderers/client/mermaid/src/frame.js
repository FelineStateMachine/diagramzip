import mermaid from 'mermaid'

const CHANNEL = 'diagram.zip:renderer:v1'
const ENGINE = 'mermaid'
const VERSION = 'mermaid@11.17.0'
const BUILD = 'mermaid-11.17.0-client-unit-1'
const MAX_SOURCE_LENGTH = 100_000

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  suppressErrorRendering: true,
  maxTextSize: MAX_SOURCE_LENGTH,
  maxEdges: 5_000,
  flowchart: { useMaxWidth: false },
})

let queue = Promise.resolve()

async function render(message) {
  if (typeof message.source !== 'string' || message.source.length > MAX_SOURCE_LENGTH) {
    throw new Error('Mermaid source must be a string no larger than 100 KB.')
  }
  const id = `diagramzip-${message.requestId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const { svg } = await mermaid.render(id, message.source)
  return svg
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
      parent.postMessage({
        channel: CHANNEL,
        type: 'result',
        requestId: message.requestId,
        ok: true,
        svg: await render(message),
        version: VERSION,
        build: BUILD,
        pipeline: [ENGINE],
      }, '*')
    } catch (error) {
      parent.postMessage({
        channel: CHANNEL,
        type: 'result',
        requestId: message.requestId,
        ok: false,
        error: error instanceof Error ? error.message.slice(0, 500) : 'Mermaid rendering failed.',
      }, '*')
    }
  })
})

parent.postMessage({ channel: CHANNEL, type: 'ready', engine: ENGINE, version: VERSION, build: BUILD }, '*')
