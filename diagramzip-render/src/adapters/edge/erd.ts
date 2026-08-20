import { erdToDot, ErdSyntaxError, parseErd } from '../../erd'
import { RenderError } from '../../errors'
import type { RendererAdapter } from '../../types'
import { renderGraphvizSource } from './graphviz'
import { edgeResult } from './types'

const VERSION = 'erd@0.2.1.0+graphviz@15.1.1'

export const erdAdapter: RendererAdapter = {
  id: 'erd',
  runtime: 'edge-wasm',
  version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (Object.keys(request.options).length > 0) {
      throw new RenderError(400, 'invalid_options', 'ERD does not accept renderer options.')
    }
    try {
      const dot = erdToDot(parseErd(request.source))
      if (signal.aborted) throw signal.reason
      return edgeResult('erd', VERSION, await renderGraphvizSource(dot), 'edge-wasm')
    } catch (error) {
      if (error instanceof RenderError) throw error
      if (error instanceof ErdSyntaxError) throw new RenderError(422, 'render_failed', error.message)
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'ERD could not render this source.')
    }
  },
}
