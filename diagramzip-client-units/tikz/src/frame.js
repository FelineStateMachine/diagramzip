const CHANNEL = 'diagram.zip:renderer:v1'
const ENGINE = 'tikz'
const VERSION = '@planktimerr/tikzjax@1.0.63'
const BUILD = 'tikzjax-1.0.63-client-unit-1'
const MAX_SOURCE_LENGTH = 262_144
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

function normalizedSource(source) {
  const begin = source.search(/\\begin\s*\{document\}/)
  if (begin < 0) return { body: source, preamble: '' }
  const beginMatch = source.slice(begin).match(/^\\begin\s*\{document\}/)
  const endMatch = source.match(/\\end\s*\{document\}\s*$/)
  const end = endMatch ? endMatch.index : source.length
  const preamble = source.slice(0, begin).replace(/^\s*\\documentclass(?:\[[^\]]*\])?\s*\{[^}]*\}\s*/m, '')
  return { body: source.slice(begin + beginMatch[0].length, end), preamble }
}

function safeSvg(svg) {
  if (typeof svg === 'string') {
    const start = svg.indexOf('<svg')
    const end = svg.lastIndexOf('</svg>')
    if (start >= 0 && end > start) svg = svg.slice(start, end + 6)
  }
  let documentSvg = typeof svg === 'string'
    ? new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
    : (svg.matches?.('svg') ? svg : svg.querySelector?.('svg'))?.cloneNode(true)
  if (!documentSvg || documentSvg.nodeName.toLowerCase() !== 'svg') throw new Error('TikZ did not produce an SVG.')
  for (const element of documentSvg.querySelectorAll('script,foreignObject')) element.remove()
  for (const element of documentSvg.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name)
      if (/^(href|src|xlink:href)$/i.test(attribute.name) && !attribute.value.startsWith('#') && !attribute.value.startsWith('data:')) element.removeAttribute(attribute.name)
    }
  }
  return new XMLSerializer().serializeToString(documentSvg)
}

async function renderMessage(message, origin, sequence) {
  if (sequence !== latest) return
  if (typeof message.source !== 'string' || message.source.length > MAX_SOURCE_LENGTH) throw new Error('TikZ source must be a string no larger than 256 KB.')
  const { body, preamble } = normalizedSource(message.source)
  const script = document.createElement('script')
  script.type = 'text/tikz'
  script.dataset.disableCache = 'true'
  if (preamble.length > MAX_SOURCE_LENGTH) throw new Error('TikZ preamble is too large.')
  if (preamble) script.dataset.addToPreamble = preamble
  script.textContent = body
  const container = document.createElement('div')
  container.hidden = true
  container.append(script)
  const finished = new Promise((resolve, reject) => {
    let timer
    const cleanup = () => {
      clearTimeout(timer)
      document.removeEventListener('tikzjax-load-finished', onFinished)
    }
    const onFinished = event => {
      if (!container.contains(event.target)) return
      cleanup()
      resolve(event.target)
    }
    timer = setTimeout(() => {
      cleanup()
      container.remove()
      reject(new Error('TikZ rendering timed out.'))
    }, RENDER_TIMEOUT)
    document.addEventListener('tikzjax-load-finished', onFinished)
  })
  document.body.append(container)
  try {
    const svg = await finished
    if (sequence !== latest) return
    const output = safeSvg(svg.outerHTML)
    if (output.length > MAX_OUTPUT_LENGTH) throw new Error('TikZ SVG output is too large.')
    reply(origin, { type: 'result', requestId: message.requestId, ok: true, svg: output, version: VERSION, build: BUILD, pipeline: [ENGINE] })
  } finally {
    container.remove()
  }
}

window.addEventListener('message', event => {
  const message = event.data
  const origin = allowedOrigin()
  if (event.source !== parent || message?.channel !== CHANNEL || message?.type !== 'render' || message?.engine !== ENGINE || typeof message?.requestId !== 'string') return
  const sequence = ++latest
  queue = queue.then(async () => {
    if (sequence !== latest) return
    try { await renderMessage(message, origin ?? '*', sequence) }
    catch (error) { if (sequence === latest) reply(origin ?? '*', { type: 'result', requestId: message.requestId, ok: false, error: error instanceof Error ? error.message.slice(0, 500) : 'TikZ rendering failed.' }) }
  })
})

reply(allowedOrigin() ?? '*', { type: 'ready', engine: ENGINE, version: VERSION, build: BUILD })
