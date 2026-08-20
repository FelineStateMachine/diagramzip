import { RequestError } from './errors'
import { isEngineId, type RenderMetadata, type RenderPresentation, type RenderRequest } from './types'

const MAX_REQUEST_BYTES = 1_048_576
const MAX_SOURCE_LENGTH = 524_288
const MAX_OPTION_COUNT = 64

function objectValue(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RequestError(400, 'invalid_request', `${name} must be an object.`)
  }
  return value as Record<string, unknown>
}

function boundedString(value: unknown, name: string, maximum: number): string {
  if (typeof value !== 'string') throw new RequestError(400, 'invalid_request', `${name} must be a string.`)
  if (value.length > maximum) throw new RequestError(413, 'request_too_large', `${name} is too large.`)
  return value
}

async function boundedBody(request: Request): Promise<string> {
  const declaredLength = request.headers.get('Content-Length')
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength)
    if (!Number.isInteger(parsedLength) || parsedLength < 0) {
      throw new RequestError(400, 'invalid_request', 'Content-Length is invalid.')
    }
    if (parsedLength > MAX_REQUEST_BYTES) {
      throw new RequestError(413, 'request_too_large', 'Render request is too large.')
    }
  }

  if (request.body === null) throw new RequestError(400, 'invalid_request', 'A JSON request body is required.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > MAX_REQUEST_BYTES) {
      await reader.cancel('request too large')
      throw new RequestError(413, 'request_too_large', 'Render request is too large.')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

function optionsValue(value: unknown): Record<string, string> {
  const input = value === undefined ? {} : objectValue(value, 'options')
  const entries = Object.entries(input)
  if (entries.length > MAX_OPTION_COUNT) {
    throw new RequestError(400, 'invalid_options', `options cannot contain more than ${MAX_OPTION_COUNT} entries.`)
  }
  const output: Record<string, string> = {}
  for (const [name, option] of entries) {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(name)) {
      throw new RequestError(400, 'invalid_options', `Invalid renderer option: ${name}.`)
    }
    if (!['string', 'number', 'boolean'].includes(typeof option)) {
      throw new RequestError(400, 'invalid_options', `Renderer option ${name} must be a string, number, or boolean.`)
    }
    const normalized = String(option)
    if (normalized.length > 4_096) {
      throw new RequestError(400, 'invalid_options', `Renderer option ${name} is too large.`)
    }
    output[name.toLowerCase()] = normalized
  }
  return output
}

function metadataValue(value: unknown): RenderMetadata {
  const input = value === undefined ? {} : objectValue(value, 'metadata')
  return {
    title: boundedString(input.title ?? '', 'metadata.title', 200),
    description: boundedString(input.description ?? '', 'metadata.description', 2_000),
  }
}

function presentationValue(value: unknown): RenderPresentation {
  const input = value === undefined ? {} : objectValue(value, 'presentation')
  const background = boundedString(input.background ?? '', 'presentation.background', 7)
  const padding = input.padding ?? 0
  const frame = input.frame ?? false
  if (background !== '' && !/^#[0-9a-f]{6}$/i.test(background)) {
    throw new RequestError(400, 'invalid_presentation', 'presentation.background must be an RGB hex color.')
  }
  if (!Number.isInteger(padding) || Number(padding) < 0 || Number(padding) > 256) {
    throw new RequestError(400, 'invalid_presentation', 'presentation.padding must be an integer from 0 to 256.')
  }
  if (typeof frame !== 'boolean') {
    throw new RequestError(400, 'invalid_presentation', 'presentation.frame must be a boolean.')
  }
  return { background, padding: Number(padding), frame }
}

export async function parseRenderRequest(request: Request): Promise<RenderRequest> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    throw new RequestError(415, 'unsupported_media_type', 'Render requests must use application/json.')
  }
  let value: unknown
  try {
    value = JSON.parse(await boundedBody(request))
  } catch (error) {
    if (error instanceof RequestError) throw error
    throw new RequestError(400, 'invalid_json', 'Render request is not valid JSON.')
  }
  const input = objectValue(value, 'request')
  const engine = boundedString(input.engine, 'engine', 32)
  if (!isEngineId(engine)) throw new RequestError(400, 'unknown_engine', `Unknown diagram engine: ${engine}.`)
  const source = boundedString(input.source, 'source', MAX_SOURCE_LENGTH)
  if (source.trim() === '') throw new RequestError(400, 'empty_source', 'Diagram source cannot be empty.')
  if (input.format !== undefined && input.format !== 'svg') {
    throw new RequestError(400, 'unsupported_format', 'The v2 rendering plane currently supports SVG only.')
  }
  return {
    engine,
    source,
    format: 'svg',
    options: optionsValue(input.options),
    metadata: metadataValue(input.metadata),
    presentation: presentationValue(input.presentation),
  }
}
