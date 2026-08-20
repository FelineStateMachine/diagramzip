import mermaid from 'mermaid'

const CHANNEL = 'diagram.zip:renderer:v1'
const VERSION = 'mermaid@11.17.0'

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  suppressErrorRendering: true,
  maxTextSize: 100_000,
  maxEdges: 5_000,
  flowchart: { useMaxWidth: false },
})

let queue = Promise.resolve()

async function render(message) {
  if (message.engine !== 'mermaid') throw new Error(`No client renderer for ${message.engine}.`)
  const id = `diagramzip-${message.requestId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const { svg } = await mermaid.render(id, message.source)
  return { svg, version: VERSION }
}

window.addEventListener('message', event => {
  if (event.source !== parent || event.data?.channel !== CHANNEL || event.data?.type !== 'render') return
  const message = event.data
  queue = queue.then(async () => {
    try {
      const result = await render(message)
      parent.postMessage({ channel: CHANNEL, type: 'result', requestId: message.requestId, ok: true, ...result }, '*')
    } catch (error) {
      parent.postMessage({
        channel: CHANNEL,
        type: 'result',
        requestId: message.requestId,
        ok: false,
        error: error instanceof Error ? error.message.slice(0, 500) : 'Client rendering failed.',
      }, '*')
    }
  })
})

parent.postMessage({ channel: CHANNEL, type: 'ready' }, '*')
