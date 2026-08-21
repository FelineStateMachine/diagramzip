export type EngineRuntime = 'edge-js' | 'edge-wasm' | 'edge-python' | 'client'

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

export const ENGINE_IDS = [
  'plantuml',
  'mermaid',
  'graphviz',
  'd2',
  'c4plantuml',
  'blockdiag',
  'seqdiag',
  'actdiag',
  'nwdiag',
  'packetdiag',
  'rackdiag',
  'bpmn',
  'bytefield',
  'dbml',
  'diagramsnet',
  'ditaa',
  'erd',
  'excalidraw',
  'goat',
  'nomnoml',
  'pikchr',
  'structurizr',
  'svgbob',
  'symbolator',
  'tikz',
  'umlet',
  'vega',
  'vegalite',
  'wavedrom',
  'wireviz',
] as const

export type EngineId = typeof ENGINE_IDS[number]

export function isEngineId(value: string): value is EngineId {
  return (ENGINE_IDS as readonly string[]).includes(value)
}
