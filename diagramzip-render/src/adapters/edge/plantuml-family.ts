import { parseHTML } from 'linkedom'
// @ts-expect-error The pinned TeaVM browser artifact is vendored JavaScript.
import plantumlViz from '../../vendor/plantuml-family/viz-global.cjs'
import vizModule from '../../vendor/plantuml-family/viz.wasm'
// @ts-expect-error The pinned TeaVM browser artifact is vendored JavaScript.
import { renderToString } from '../../vendor/plantuml-family/plantuml.js'
import { RenderError } from '../../errors'
import type { RendererAdapter } from '../../types'
import { edgeResult } from './types'
import { lowerC4 } from './c4-lowerer'

const VERSION = 'plantuml@1.2026.6/edge-wasm-1'
const MAX_SOURCE_BYTES = 256 * 1024
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024
const THEMES = new Set([
  'amiga', 'black-knight', 'bluegray', 'blueprint', 'cerulean-outline', 'cerulean',
  'crt-amber', 'crt-green', 'cyborg-outline', 'cyborg', 'hacker', 'hacker-hold',
  'lightgray', 'materia-outline', 'materia', 'metal', 'mimeograph', 'minty', 'plain',
  'resume-light', 'sandstone', 'silver', 'sketchy-outline', 'sketchy', 'spacelab',
  'superhero-outline', 'superhero', 'united',
])

const DOM = parseHTML('<html><head></head><body></body></html>')
const document = DOM.document
const window = DOM.window
const globals = globalThis as typeof globalThis & Record<string, unknown>
globals.document = document
globals.window = window
globals.self = globalThis
globals.Viz = plantumlViz
globals.__DIAGRAMZIP_PLANTUML_VIZ_MODULE = vizModule
window.Viz = plantumlViz
globals.XMLSerializer = class { serializeToString(node: unknown) { return String(node) } }
window.SVGElement.prototype.getBBox = function () { return { x: 0, y: 0, width: 100, height: 20 } }
const createElement = document.createElement.bind(document)
document.createElement = (tagName: string) => {
  const element = createElement(tagName)
  if (tagName === 'canvas') {
    element.getContext = () => ({ font: '', measureText: (text: string) => ({ width: text.length * 8 }) }) as never
  }
  return element
}
window._measureCanvas = document.createElement('canvas')
window._measureCtx = window._measureCanvas.getContext('2d')

let renderTail: Promise<void> = Promise.resolve()
function withRenderLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = renderTail
  let release!: () => void
  renderTail = new Promise(resolve => { release = resolve })
  return previous.then(async () => { try { return await operation() } finally { release() } })
}

function prepareSource(source: string, engine: 'plantuml' | 'c4plantuml', options: Record<string, string>): string {
  const c4Include = /!include\s+(?:<C4\/)?C4_(Context|Container|Component|Deployment|Dynamic|Sequence)(?:\.puml)?(?:>)?/i
  const sourceWithoutC4 = source.replace(c4Include, '')
  if (/^\s*!(?:include|includeurl|includesub|import|load|theme)\b/im.test(sourceWithoutC4)) {
    throw new RenderError(400, 'unsupported_directive', 'PlantUML resource and theme directives are disabled in the edge renderer.')
  }
  if (/^\s*!include\s+(?:https?:|file:|\/)/im.test(sourceWithoutC4)) {
    throw new RenderError(400, 'unsupported_include', 'Remote and filesystem PlantUML resources are disabled in the edge renderer.')
  }
  let prepared = source.trim()
  if (!prepared.startsWith('@start')) prepared = `@startuml\n${prepared}\n@enduml`
  if (engine === 'c4plantuml') {
    prepared = lowerC4(prepared)
  }
  const theme = options.theme?.trim()
  if (theme) {
    if (!THEMES.has(theme)) throw new RenderError(400, 'invalid_options', `Unsupported PlantUML theme: ${theme}.`)
    prepared = prepared.replace(/(^@start[^\n]*\n)/i, `$1!theme ${theme}\n`)
  }
  return prepared
}

export const plantumlFamilyAdapter: RendererAdapter = {
  id: 'plantuml', runtime: 'edge-wasm', version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    const sourceBytes = new TextEncoder().encode(request.source).byteLength
    if (sourceBytes > MAX_SOURCE_BYTES) throw new RenderError(413, 'source_too_large', 'PlantUML source exceeds the 256 KiB limit.')
    for (const key of Object.keys(request.options)) if (!['theme', 'no-metadata'].includes(key)) throw new RenderError(400, 'unsupported_options', `Unsupported PlantUML option: ${key}.`)
    const source = prepareSource(request.source, request.engine as 'plantuml' | 'c4plantuml', request.options)
    return withRenderLock(() => new Promise((resolve, reject) => {
      if (signal.aborted) return reject(signal.reason)
      renderToString(source.split(/\r?\n/), (svg: string) => {
        if (/(?:Syntax Error\?|Error line \d+)/i.test(svg)) return reject(new RenderError(422, 'render_failed', 'PlantUML returned a syntax-error SVG.'))
        if (new TextEncoder().encode(svg).byteLength > MAX_OUTPUT_BYTES) return reject(new RenderError(413, 'render_too_large', 'PlantUML output exceeds the 4 MiB limit.'))
        const body = request.options['no-metadata'] !== undefined ? svg.replace(/<\?plantuml-src[^?]*\?>/g, '') : svg
        resolve(edgeResult(request.engine as never, VERSION, body, 'edge-wasm'))
      }, (error: string) => reject(new RenderError(422, 'render_failed', String(error).slice(0, 500))))
    }))
  },
}
