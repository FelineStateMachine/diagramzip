import { RenderError } from '../../errors'
import type { RenderResult } from '../../types'

export type EdgeEngineId = 'bytefield' | 'nomnoml' | 'vega' | 'vegalite' | 'wavedrom'

export function edgeResult(id: EdgeEngineId, version: string, body: string): RenderResult {
  if (typeof body !== 'string' || body.trim() === '') {
    throw new RenderError(422, 'empty_render', `The ${id} renderer returned no SVG.`)
  }
  return { body, contentType: 'image/svg+xml', engineVersion: version, runtime: 'edge-js' }
}

export function edgeFailure(id: EdgeEngineId, error: unknown): never {
  if (error instanceof RenderError) throw error
  const message = error instanceof Error ? error.message : String(error)
  throw new RenderError(422, 'render_failed', message.slice(0, 500) || `The ${id} renderer could not render this source.`)
}
