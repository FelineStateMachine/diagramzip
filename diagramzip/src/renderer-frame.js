import mermaid from 'mermaid'
import BpmnViewer from 'bpmn-js/lib/Viewer'

const CHANNEL = 'diagram.zip:renderer:v1'
const VERSIONS = {
  mermaid: 'mermaid@11.17.0',
  bpmn: 'bpmn-js@18.25.1',
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  suppressErrorRendering: true,
  maxTextSize: 100_000,
  maxEdges: 5_000,
  flowchart: { useMaxWidth: false },
})

let queue = Promise.resolve()

async function renderMermaid(message) {
  const id = `diagramzip-${message.requestId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const { svg } = await mermaid.render(id, message.source)
  return svg
}

async function renderBpmn(message) {
  const container = document.createElement('div')
  Object.assign(container.style, { width: '1280px', height: '800px' })
  document.body.append(container)
  const viewer = new BpmnViewer({ container })
  try {
    await viewer.importXML(message.source)
    const { svg } = await viewer.saveSVG()
    return svg
  } finally {
    viewer.destroy()
    container.remove()
  }
}

async function render(message) {
  let svg
  if (message.engine === 'mermaid') svg = await renderMermaid(message)
  else if (message.engine === 'bpmn') svg = await renderBpmn(message)
  else throw new Error(`No client renderer for ${message.engine}.`)
  return { svg, version: VERSIONS[message.engine] }
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
