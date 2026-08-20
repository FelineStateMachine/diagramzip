import initPikchrModule from '../../vendor/pikchr-backend.js'
import wasmModule from '../../vendor/pikchr.wasm'
import { RenderError } from '../../errors'
import type { RendererAdapter } from '../../types'

const VERSION = 'pikchr@85e65b9686/edge-wasm-1'
const MAX_SOURCE = 256 * 1024
let modulePromise: Promise<any> | undefined
let renderTail: Promise<void> = Promise.resolve()

function pikchrModule(): Promise<any> {
  modulePromise ??= initPikchrModule({
    instantiateWasm(imports: WebAssembly.Imports, receive: (instance: WebAssembly.Instance) => void) {
      const instance = new WebAssembly.Instance(wasmModule, imports)
      receive(instance)
      return instance.exports
    },
  })
  return modulePromise!
}

async function withPikchrLock<T>(operation: () => T): Promise<T> {
  const previous = renderTail
  let release!: () => void
  renderTail = new Promise(resolve => { release = resolve })
  await previous
  try { return operation() } finally { release() }
}

export const pikchrAdapter: RendererAdapter = {
  id: 'pikchr', runtime: 'edge-wasm', version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (new TextEncoder().encode(request.source).byteLength > MAX_SOURCE) throw new RenderError(413, 'source_too_large', 'Pikchr source exceeds the 256 KiB limit.')
    if (Object.keys(request.options).length > 0) throw new RenderError(400, 'unsupported_options', 'Pikchr options are not supported by the edge renderer.')
    try {
      const body = await withPikchrLock(async () => {
        if (signal.aborted) throw signal.reason
        const module = await pikchrModule()
        const dimensions = module.ccall('malloc', 'number', ['number'], [8])
        if (!dimensions) throw new RenderError(500, 'renderer_unavailable', 'Pikchr could not allocate render state.')
        let pointer = 0
        try {
          pointer = module.ccall('pikchr', 'number', ['string', 'string', 'number', 'number', 'number'], [request.source, 'pikchr', 1, dimensions, dimensions + 4])
          if (!pointer) throw new RenderError(422, 'render_failed', 'Pikchr returned no SVG.')
          const width = module.getValue(dimensions, 'i32')
          const height = module.getValue(dimensions + 4, 'i32')
          const body = module.UTF8ToString(pointer)
          if (width < 0 || height < 0 || /<pre\b/i.test(body)) throw new RenderError(422, 'render_failed', body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) || 'Pikchr could not parse the source.')
          return body
        } finally {
          if (pointer) module.ccall('free', 'number', ['number'], [pointer])
          module.ccall('free', 'number', ['number'], [dimensions])
        }
      })
      if (signal.aborted) throw signal.reason
      if (!body.includes('<svg')) throw new RenderError(422, 'render_failed', 'Pikchr could not parse the source.')
      return { body, contentType: 'image/svg+xml', engineVersion: VERSION, runtime: 'edge-wasm' }
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'Pikchr could not render this source.')
    }
  },
}
