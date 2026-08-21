const CHANNEL = 'diagram.zip:renderer:v1'
const RENDER_TIMEOUT = 60_000

export const CLIENT_RENDERERS = Object.freeze({
  mermaid: Object.freeze({ frameUrl: 'https://mermaid.render.diagram.zip/index.html?v=1' }),
  bpmn: Object.freeze({ frameUrl: 'https://bpmn.render.diagram.zip/index.html?v=1' }),
  excalidraw: Object.freeze({ frameUrl: 'https://excalidraw.render.diagram.zip/index.html?v=3' }),
  diagramsnet: Object.freeze({ frameUrl: 'https://diagramsnet.render.diagram.zip/index.html?v=1' }),
  tikz: Object.freeze({ frameUrl: 'https://tikz.render.diagram.zip/index.html?v=2' }),
})

export const CLIENT_RENDERER_IDS = Object.freeze(Object.keys(CLIENT_RENDERERS))

function abortError(reason) {
  if (reason?.name === 'AbortError') return reason
  return new DOMException('Render superseded.', 'AbortError')
}

export class RendererFrame {
  constructor({ documentObject = document, windowObject = window, frameUrl } = {}) {
    this.document = documentObject
    this.window = windowObject
    this.frameUrl = frameUrl
    this.frame = null
    this.ready = null
    this.resolveReady = null
    this.rejectReady = null
    this.sequence = 0
    this.pending = new Map()
    this.handleMessage = event => this.receive(event)
    this.window.addEventListener('message', this.handleMessage)
  }

  ensureFrame() {
    if (this.frame) return this.ready
    const frame = this.document.createElement('iframe')
    frame.title = 'Diagram renderer'
    frame.setAttribute('sandbox', 'allow-scripts')
    frame.setAttribute('aria-hidden', 'true')
    frame.tabIndex = -1
    Object.assign(frame.style, {
      position: 'fixed',
      left: '-200vw',
      top: '0',
      width: '1280px',
      height: '800px',
      border: '0',
      pointerEvents: 'none',
      visibility: 'hidden',
    })
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve
      this.rejectReady = reject
    })
    frame.addEventListener('error', () => this.rejectReady?.(new Error('The client renderer could not be loaded.')), { once: true })
    frame.src = this.frameUrl
    this.frame = frame
    this.document.body.append(frame)
    return this.ready
  }

  receive(event) {
    if (!this.frame || event.source !== this.frame.contentWindow || event.data?.channel !== CHANNEL) return
    if (event.data.type === 'ready') {
      this.resolveReady?.()
      this.resolveReady = null
      this.rejectReady = null
      return
    }
    if (event.data.type !== 'result') return
    const pending = this.pending.get(event.data.requestId)
    if (!pending) return
    this.pending.delete(event.data.requestId)
    pending.finish()
    if (event.data.ok && typeof event.data.svg === 'string') {
      pending.resolve({
        body: event.data.svg,
        version: event.data.version,
        build: event.data.build,
        pipeline: event.data.pipeline,
        runtime: 'client',
      })
    } else {
      pending.reject(new Error(event.data.error || 'Client rendering failed.'))
    }
  }

  async render(engine, source, signal) {
    let loadTimeout
    try {
      await Promise.race([
        this.ensureFrame(),
        new Promise((_, reject) => {
          loadTimeout = setTimeout(() => reject(new Error('The client renderer timed out while loading.')), RENDER_TIMEOUT)
        }),
      ])
    } finally {
      clearTimeout(loadTimeout)
    }
    if (signal.aborted) throw abortError(signal.reason)
    const requestId = `${Date.now().toString(36)}-${++this.sequence}`
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId)
        signal.removeEventListener('abort', onAbort)
        reject(new Error('The client renderer timed out.'))
      }, RENDER_TIMEOUT)
      const onAbort = () => {
        this.pending.delete(requestId)
        clearTimeout(timeout)
        reject(abortError(signal.reason))
      }
      const finish = () => {
        clearTimeout(timeout)
        signal.removeEventListener('abort', onAbort)
      }
      signal.addEventListener('abort', onAbort, { once: true })
      this.pending.set(requestId, { resolve, reject, finish })
      this.frame.contentWindow.postMessage({ channel: CHANNEL, type: 'render', requestId, engine, source }, '*')
    })
  }
}

const frames = new Map()

export function clientAdapterFor(engine) {
  const renderer = CLIENT_RENDERERS[engine]
  if (!renderer) return null
  let frame = frames.get(renderer.frameUrl)
  if (!frame) {
    frame = new RendererFrame({ frameUrl: renderer.frameUrl })
    frames.set(renderer.frameUrl, frame)
  }
  return {
    id: engine,
    runtime: 'client',
    render: ({ source }, signal) => frame.render(engine, source, signal),
  }
}
