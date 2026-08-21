import wasmModule from '../../../goat-wasm/goat.wasm'
import { RenderError } from '../../errors'
import type { RendererAdapter } from '../../types'
import type { GoatWasmExports } from '../../vendor/goat-wasm.d'
import { edgeResult } from './types'

const VERSION = 'goat@0.5.1/edge-wasm-1'
const MAX_SOURCE_BYTES = 256 * 1024
const MAX_COLOR_BYTES = 256
const COLOR = /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba)\(\s*(?:\d{1,3}%?\s*,\s*){2}\d{1,3}%?(?:\s*,\s*(?:0|1|0?\.\d+|100%))?\s*\)|(?:hsl|hsla)\(\s*\d{1,3}(?:\.\d+)?\s*(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+|100%))?\s*\)|[a-z]+|currentColor|transparent)$/i
const instance = new WebAssembly.Instance(wasmModule, {})
const wasm = instance.exports as unknown as GoatWasmExports
wasm._initialize()
let renderTail: Promise<void> = Promise.resolve()

function withRenderLock<T>(operation: () => T): Promise<T> {
  const previous = renderTail
  let release!: () => void
  renderTail = new Promise(resolve => { release = resolve })
  return previous.then(() => {
    try { return operation() } finally { release() }
  })
}

function colorOption(options: Record<string, string>, name: string, fallback: string): string {
  const value = options[name] ?? fallback
  if (!COLOR.test(value) || new TextEncoder().encode(value).byteLength > MAX_COLOR_BYTES) {
    throw new RenderError(400, 'invalid_options', `GoAT option '${name}' must be a safe CSS color.`)
  }
  return value
}

function writeString(value: string): [number, number] {
  const bytes = new TextEncoder().encode(value)
  const pointer = wasm.alloc(bytes.byteLength)
  if (!pointer) throw new RenderError(500, 'renderer_unavailable', 'GoAT could not allocate render memory.')
  new Uint8Array(wasm.memory.buffer).set(bytes, pointer)
  return [pointer, bytes.byteLength]
}

export const goatAdapter: RendererAdapter = {
  id: 'goat', runtime: 'edge-wasm', version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (new TextEncoder().encode(request.source).byteLength > MAX_SOURCE_BYTES) throw new RenderError(413, 'source_too_large', 'GoAT source exceeds the 256 KiB limit.')
    for (const name of Object.keys(request.options)) if (!['svg-color-light-scheme', 'svg-color-dark-scheme', 'utf8'].includes(name)) throw new RenderError(400, 'unsupported_options', `Unsupported GoAT option: ${name}.`)
    const light = colorOption(request.options, 'svg-color-light-scheme', '#000')
    const dark = colorOption(request.options, 'svg-color-dark-scheme', '#FFF')
    const utf8 = Object.hasOwn(request.options, 'utf8')
    try {
      const body = await withRenderLock(() => {
        if (signal.aborted) throw signal.reason
        wasm.beginRender()
        const [source, sourceLength] = writeString(request.source)
        const [lightPointer, lightLength] = writeString(light)
        const [darkPointer, darkLength] = writeString(dark)
        const output = wasm.render(source, sourceLength, utf8 ? 1 : 0, lightPointer, lightLength, darkPointer, darkLength)
        const outputLength = wasm.outputLen()
        if (!output || outputLength === 0) throw new RenderError(422, 'render_failed', 'GoAT returned no SVG.')
        return new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, output, outputLength))
      })
      return edgeResult('goat', VERSION, body, 'edge-wasm')
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'GoAT could not render this source.')
    }
  },
}
