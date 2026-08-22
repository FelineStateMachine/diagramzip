import { tikzCore } from '../../artifacts/tikz/tikz-core.js'
import texWasm from '../../artifacts/tikz/tex.wasm'
import { RenderError } from '../runtime/errors'
import type { RendererAdapter } from '../runtime/types'

const VERSION = '@planktimerr/tikzjax@1.0.63-edge-core-1'
const MAX_SOURCE = 256 * 1024
const MAX_OUTPUT = 4 * 1024 * 1024
const CORE_ASSET_BASE = '__tikz_asset_base__'

export function setTikzAssetBase(value: string): void {
  ;(globalThis as typeof globalThis & { __tikzAssetBase?: string }).__tikzAssetBase = value
  ;(globalThis as typeof globalThis & { __tikzWasm?: WebAssembly.Module }).__tikzWasm = texWasm
}

// TikZJax's TeX virtual filesystem and Wasm instance are process-global. Keep
// requests strictly serial, including first-load initialization.
let renderTail: Promise<void> = Promise.resolve()

function assetBase(): string {
  const value = (globalThis as typeof globalThis & { __tikzAssetBase?: string }).__tikzAssetBase
  return value ?? CORE_ASSET_BASE
}

function normalizedSource(source: string): { body: string; preamble: string } {
  const begin = source.search(/\\begin\s*\{document\}/)
  if (begin < 0) return { body: source, preamble: '' }
  const match = source.slice(begin).match(/^\\begin\s*\{document\}/)
  if (!match) return { body: source, preamble: '' }
  const endMatch = source.match(/\\end\s*\{document\}\s*$/)
  const end = endMatch?.index ?? source.length
  const preamble = source.slice(0, begin).replace(/^\s*\\documentclass(?:\[[^\]]*\])?\s*\{[^}]*\}\s*/m, '')
  return { body: source.slice(begin + match[0].length, end), preamble }
}

async function loadCore(): Promise<void> {
  // The extracted core releases its decompressed 68.75 MiB format dump after
  // copying it into the request's fresh Wasm memory, so load it per request.
  await tikzCore.load(assetBase())
}

async function locked<T>(operation: () => Promise<T>): Promise<T> {
  const previous = renderTail
  let release!: () => void
  renderTail = new Promise(resolve => { release = resolve })
  await previous
  try { return await operation() } finally { release() }
}

export const tikzAdapter: RendererAdapter = {
  id: 'tikz', runtime: 'edge-wasm', version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (new TextEncoder().encode(request.source).byteLength > MAX_SOURCE) {
      throw new RenderError(413, 'source_too_large', 'TikZ source may not exceed 256 KiB.')
    }
    const { body, preamble } = normalizedSource(request.source)
    if (new TextEncoder().encode(preamble).byteLength > MAX_SOURCE) {
      throw new RenderError(413, 'source_too_large', 'TikZ preamble may not exceed 256 KiB.')
    }
    try {
      const svg = await locked(async () => {
        if (signal.aborted) throw signal.reason
        await loadCore()
        const options = { ...request.options, ...(preamble ? { addToPreamble: preamble } : {}) }
        const value = await tikzCore.texify(body, options)
        if (typeof value !== 'string' || !value.includes('<svg')) throw new Error('TikZ did not produce an SVG.')
        if (new TextEncoder().encode(value).byteLength > MAX_OUTPUT) throw new RenderError(413, 'output_too_large', 'TikZ SVG output exceeds 4 MiB.')
        return value
      })
      if (signal.aborted) throw signal.reason
      return { body: svg, contentType: 'image/svg+xml', engineVersion: VERSION, runtime: 'edge-wasm' }
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'TikZ could not render the source.')
    }
  },
}
