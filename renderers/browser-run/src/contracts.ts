export const CHANNEL = 'diagram.zip:renderer:v1' as const

export const ENGINES = ['bpmn', 'mermaid', 'excalidraw', 'diagramsnet', 'tikz'] as const
export type Engine = (typeof ENGINES)[number]

export const FRAME_URLS: Readonly<Record<Engine, string>> = Object.freeze({
  bpmn: 'https://bpmn.render.diagram.zip/index.html?v=1',
  mermaid: 'https://mermaid.render.diagram.zip/index.html?v=1',
  excalidraw: 'https://excalidraw.render.diagram.zip/index.html?v=4',
  diagramsnet: 'https://diagramsnet.render.diagram.zip/index.html?v=1',
  tikz: 'https://tikz.render.diagram.zip/index.html?v=2',
})

export const LIMITS = Object.freeze({
  source: 524_288,
  output: 4_194_304,
  timeoutMs: 60_000,
})

export interface RenderRequest {
  engine: Engine
  requestId: string
  source: string
}

export interface RenderResult {
  ok: true
  svg: string
  version: string
  build: string
  pipeline: string[]
}

export interface RenderFailure {
  ok: false
  error: string
}

export type RenderResponse = RenderResult | RenderFailure

export function isEngine(value: unknown): value is Engine {
  return typeof value === 'string' && (ENGINES as readonly string[]).includes(value)
}

export function validateRenderRequest(value: unknown): RenderRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RenderInputError('invalid_request', 'Request body must be a JSON object.')
  }
  const request = value as Record<string, unknown>
  if (!isEngine(request.engine)) throw new RenderInputError('invalid_engine', 'Unsupported renderer engine.')
  if (typeof request.requestId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(request.requestId)) {
    throw new RenderInputError('invalid_request_id', 'requestId must be 1-128 safe identifier characters.')
  }
  if (typeof request.source !== 'string') throw new RenderInputError('invalid_source', 'source must be a string.')
  if (request.source.length > LIMITS.source) throw new RenderInputError('source_too_large', 'Source exceeds the 512 KiB limit.')
  return { engine: request.engine, requestId: request.requestId, source: request.source }
}

export class RenderInputError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'RenderInputError'
  }
}

export function errorResponse(error: unknown): Response {
  const input = error instanceof RenderInputError
  const code = input ? error.code : 'render_failed'
  const message = input ? error.message : error instanceof Error ? error.message.slice(0, 500) : 'Rendering failed.'
  return Response.json({ error: { code, message } }, { status: input ? 400 : 500 })
}
