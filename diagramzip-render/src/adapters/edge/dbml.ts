import { RenderError } from '../../errors'
import { dbmlToDot } from '../../vendor/dbml-backend.js'
import type { RendererAdapter } from '../../types'
import { edgeResult } from './types'
import { renderGraphvizSource } from './graphviz'

const VERSION = 'dbml@1.0.31+graphviz@15.1.1'
const MAX_SOURCE_BYTES = 262_144
const MAX_DECLARATIONS = 2_000
const MAX_REFERENCES = 10_000
const MAX_DOT_BYTES = 4_194_304

function preflight(source: string): void {
  if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) {
    throw new RenderError(413, 'request_too_large', 'DBML source is too large for the edge renderer.')
  }
  const declarations = source.match(/^\s*(?:Table|TableGroup|Enum)\b/gm)?.length ?? 0
  if (declarations > MAX_DECLARATIONS) {
    throw new RenderError(413, 'request_too_large', 'DBML contains too many declarations for the edge renderer.')
  }
  const references = source.match(/^\s*Ref\b/gm)?.length ?? 0
  if (references > MAX_REFERENCES) {
    throw new RenderError(413, 'request_too_large', 'DBML contains too many references for the edge renderer.')
  }
}

export const dbmlAdapter: RendererAdapter = {
  id: 'dbml',
  runtime: 'edge-wasm',
  version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (Object.keys(request.options).length > 0) {
      throw new RenderError(400, 'invalid_options', 'DBML does not accept renderer options.')
    }
    try {
      preflight(request.source)
      const dot = dbmlToDot(request.source)
      if (new TextEncoder().encode(dot).byteLength > MAX_DOT_BYTES) {
        throw new RenderError(413, 'output_too_large', 'DBML produced too large a GraphViz model.')
      }
      if (signal.aborted) throw signal.reason
      return edgeResult('dbml', VERSION, await renderGraphvizSource(dot), 'edge-wasm')
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'DBML could not render this source.')
    }
  },
}
