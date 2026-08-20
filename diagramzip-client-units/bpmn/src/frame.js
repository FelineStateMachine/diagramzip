import BpmnViewer from 'bpmn-js/lib/Viewer'

const CHANNEL = 'diagram.zip:renderer:v1'
const ENGINE = 'bpmn'
const VERSION = 'bpmn-js@18.25.1'
const BUILD = 'bpmn-js-18.25.1-client-unit-1'
const MAX_SOURCE_LENGTH = 524_288

let queue = Promise.resolve()

async function render(message) {
  if (typeof message.source !== 'string' || message.source.length > MAX_SOURCE_LENGTH) {
    throw new Error('BPMN source must be a string no larger than 512 KiB.')
  }
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
        error: error instanceof Error ? error.message.slice(0, 500) : 'BPMN rendering failed.',
      }, '*')
    }
  })
})

parent.postMessage({ channel: CHANNEL, type: 'ready', engine: ENGINE, version: VERSION, build: BUILD }, '*')
