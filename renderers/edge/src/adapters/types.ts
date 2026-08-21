import { RenderError } from '../runtime/errors'
import type { EngineId, RenderResult } from '../runtime/types'

export type EdgeEngineId = 'bytefield' | 'dbml' | 'ditaa' | 'erd' | 'goat' | 'graphviz' | 'nomnoml' | 'svgbob' | 'vega' | 'vegalite' | 'wavedrom'

export function edgeResult(id: EngineId, version: string, body: string, runtime: 'edge-js' | 'edge-wasm' = 'edge-js'): RenderResult {
  if (typeof body !== 'string' || body.trim() === '') {
    throw new RenderError(422, 'empty_render', `The ${id} renderer returned no SVG.`)
  }
  return { body, contentType: 'image/svg+xml', engineVersion: version, runtime }
}

export function edgeFailure(id: EdgeEngineId, error: unknown): never {
  if (error instanceof RenderError) throw error
  const message = error instanceof Error ? error.message : String(error)
  throw new RenderError(422, 'render_failed', message.slice(0, 500) || `The ${id} renderer could not render this source.`)
}
