const CHANNEL = 'diagram.zip:renderer:v1'
const ENGINE = 'diagramsnet'
const VERSION = 'diagrams.net@29.6.1'
const BUILD = 'diagramsnet-29.6.1-client-unit-1'
const MAX_SOURCE_LENGTH = 524_288
const MAX_OUTPUT_LENGTH = 4_194_304
const RENDER_TIMEOUT = 20_000

let latest = 0
let queue = Promise.resolve()

function reply(origin, message) {
  parent.postMessage({ channel: CHANNEL, ...message }, origin)
}

function allowedOrigin() {
  try { return document.referrer ? new URL(document.referrer).origin : null } catch { return null }
}

async function renderMessage(message, origin, sequence) {
  if (sequence !== latest) return
  if (typeof message.source !== 'string' || message.source.length > MAX_SOURCE_LENGTH) throw new Error('Diagrams.net source must be a string no larger than 512 KB.')
  document.getElementById('LoadingComplete')?.remove()
  const graph = render({ xml: message.source, format: 'svg' })
  const deadline = Date.now() + RENDER_TIMEOUT
  while (!document.getElementById('LoadingComplete')) {
    if (sequence !== latest) return
    if (Date.now() >= deadline) throw new Error('Diagrams.net rendering timed out.')
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  if (sequence !== latest) return
  const background = graph.background === mxConstants.NONE ? null : graph.background
  const svg = new XMLSerializer().serializeToString(graph.getSvg(background, 1, 0, false, null, true, null, null))
  if (svg.length > MAX_OUTPUT_LENGTH) throw new Error('Diagrams.net SVG output is too large.')
  reply(origin, { type: 'result', requestId: message.requestId, ok: true, svg, version: VERSION, build: BUILD, pipeline: [ENGINE] })
}

window.addEventListener('message', event => {
  const message = event.data
  const origin = allowedOrigin()
  if (event.source !== parent || message?.channel !== CHANNEL || message?.type !== 'render' || message?.engine !== ENGINE || typeof message?.requestId !== 'string') return
  const sequence = ++latest
  queue = queue.then(async () => {
    if (sequence !== latest) return
    try { await renderMessage(message, origin ?? '*', sequence) }
    catch (error) { if (sequence === latest) reply(origin ?? '*', { type: 'result', requestId: message.requestId, ok: false, error: error instanceof Error ? error.message.slice(0, 500) : 'Diagrams.net rendering failed.' }) }
  })
})

reply(allowedOrigin() ?? '*', { type: 'ready', engine: ENGINE, version: VERSION, build: BUILD })
