import type { EngineId, EngineRuntime } from '../../../shared/engines'

export { ENGINE_IDS, isEngineId } from '../../../shared/engines'
export type { EngineId, EngineRuntime } from '../../../shared/engines'

export interface RenderMetadata {
  title: string
  description: string
}

export interface RenderPresentation {
  background: string
  padding: number
  frame: boolean
}

export interface RenderRequest {
  engine: EngineId
  source: string
  format: 'svg'
  options: Record<string, string>
  metadata: RenderMetadata
  presentation: RenderPresentation
}

export interface RenderResult {
  body: string
  contentType: 'image/svg+xml'
  engineVersion: string
  runtime: EngineRuntime
}

export interface RendererAdapter {
  readonly id: EngineId
  readonly runtime: EngineRuntime
  readonly version: string
  render(request: RenderRequest, signal: AbortSignal): Promise<RenderResult>
}
