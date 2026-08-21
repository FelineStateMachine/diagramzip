import '../../../d2-wasm/wasm_exec.js'
import wasmModule from '../../../d2-wasm/d2-custom.wasm'
import { RenderError } from '../../errors'
import type { RendererAdapter } from '../../types'
import { edgeResult } from './types'

const VERSION = 'd2@0.7.1/dagre-wasm-1'
const MAX_SOURCE_BYTES = 512 * 1024
const SUPPORTED_OPTIONS = new Set(['layout', 'animate-interval'])

type GoRuntime = { importObject: WebAssembly.Imports; run(instance: WebAssembly.Instance): Promise<unknown> }
type D2Global = typeof globalThis & { d2CustomRender?: (source: string, options?: string) => string }
type D2Response = { svg?: string; error?: string }

let initPromise: Promise<void> | undefined
let renderTail: Promise<void> = Promise.resolve()

function styleDeclaration(style: string, name: string): string | null {
  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':')
    if (separator < 0 || declaration.slice(0, separator).trim().toLowerCase() !== name) continue
    return declaration.slice(separator + 1).trim()
  }
  return null
}

export function imageCompatibleAnimations(svg: string): string {
  return svg.replace(/<path\b(?=[^>]*\bclass="[^"]*\banimated-connection\b[^"]*")(?=[^>]*\bstyle="([^"]*)")[^>]*>/g, (tag, style: string) => {
    const offset = styleDeclaration(style, 'stroke-dashoffset')
    const animation = styleDeclaration(style, 'animation')
    const duration = animation?.match(/^dashdraw\s+(\d+(?:\.\d+)?)s\s+linear\s+infinite$/)?.[1]
    if (!offset || !/^-?\d+(?:\.\d+)?(?:px)?$/.test(offset) || !duration) return tag
    const imageCompatibleStyle = style
      .split(';')
      .filter(declaration => declaration.trim() && !/^\s*(?:animation|stroke-dashoffset)\s*:/i.test(declaration))
      .join(';')
    const normalizedTag = tag
      .replace(/\s+mask="[^"]*"/, '')
      .replace(/\bstyle="[^"]*"/, `style="${imageCompatibleStyle};"`)
    const animate = `<animate attributeName="stroke-dashoffset" from="0" to="${offset}" dur="${duration}s" calcMode="linear" repeatCount="indefinite"></animate>`
    return /\/\s*>$/.test(normalizedTag)
      ? `${normalizedTag.replace(/\/\s*>$/, '>')}${animate}</path>`
      : `${normalizedTag}${animate}`
  })
}

async function init(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const go = new (globalThis as unknown as { Go: new () => GoRuntime }).Go()
    const result = await WebAssembly.instantiate(wasmModule, go.importObject) as unknown as WebAssembly.Instance | { instance: WebAssembly.Instance }
    const instance = result instanceof WebAssembly.Instance ? result : result.instance
    void go.run(instance)
    for (let i = 0; i < 100; i++) {
      if ((globalThis as D2Global).d2CustomRender) return
      await new Promise(resolve => setTimeout(resolve, 1))
    }
    throw new Error('D2 Wasm runtime did not initialize.')
  })()
  return initPromise
}

function withRenderLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = renderTail
  let release!: () => void
  renderTail = new Promise(resolve => { release = resolve })
  return previous.then(async () => {
    try { return await operation() } finally { release() }
  })
}

export const d2Adapter: RendererAdapter = {
  id: 'd2', runtime: 'edge-wasm', version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (new TextEncoder().encode(request.source).byteLength > MAX_SOURCE_BYTES) {
      throw new RenderError(413, 'source_too_large', 'D2 source exceeds the 512 KiB limit.')
    }
    for (const name of Object.keys(request.options)) {
      if (!SUPPORTED_OPTIONS.has(name)) {
        throw new RenderError(400, 'unsupported_options', `Unsupported D2 option: ${name}.`)
      }
    }
    if (request.options.layout !== undefined && request.options.layout.toLowerCase() !== 'dagre') {
      throw new RenderError(400, 'unsupported_options', 'D2 supports Dagre layout in the edge unit; ELK is unavailable.')
    }
    const animateInterval = request.options['animate-interval']
    if (animateInterval !== undefined && (!/^\d+$/.test(animateInterval) || Number(animateInterval) < 1 || Number(animateInterval) > 60_000)) {
      throw new RenderError(400, 'invalid_options', 'D2 animate-interval must be an integer from 1 to 60000 milliseconds.')
    }
    await init()
    return withRenderLock(async () => {
      if (signal.aborted) throw signal.reason
      const render = (globalThis as D2Global).d2CustomRender
      if (!render) throw new RenderError(500, 'renderer_unavailable', 'D2 Wasm renderer is unavailable.')
      let result: D2Response
      try { result = JSON.parse(render(request.source, animateInterval === undefined ? '' : JSON.stringify({ animateInterval: Number(animateInterval) }))) as D2Response } catch (error) {
        throw new RenderError(422, 'render_failed', error instanceof Error ? error.message : String(error))
      }
      if (result.error) throw new RenderError(422, 'render_failed', result.error.slice(0, 500))
      if (!result.svg || result.svg.trim() === '') throw new RenderError(422, 'empty_render', 'D2 returned no SVG.')
      return edgeResult('d2', VERSION, imageCompatibleAnimations(result.svg), 'edge-wasm')
    })
  },
}
