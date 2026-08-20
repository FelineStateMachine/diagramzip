import type {
  AliasInput,
  AliasMetadata,
  Diagram,
  EncryptedBlob,
  JsonValue,
  KeyEnvelope,
  OpenAliasInput,
} from './model'

export const MAX_REQUEST_BYTES = 1024 * 1024
export const MAX_SOURCE_BYTES = 768 * 1024

const encoder = new TextEncoder()
const diagramTypePattern = /^[a-z0-9][a-z0-9-]{0,63}$/
const backgroundPattern = /^(?:|#[0-9a-f]{6})$/i
const base64UrlPattern = /^[A-Za-z0-9_-]+$/

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedKeys = new Set(allowed)
  if (Object.keys(value).some(key => !allowedKeys.has(key))) {
    throw new RequestError(400, 'invalid_request', `${label} contains an unsupported field.`)
  }
}

function normalizeJson(value: unknown, depth = 0): JsonValue {
  if (depth > 20) {
    throw new RequestError(400, 'invalid_request', 'Diagram options are nested too deeply.')
  }
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.map(item => normalizeJson(item, depth + 1))
  if (isRecord(value)) {
    const normalized: { [key: string]: JsonValue } = Object.create(null) as { [key: string]: JsonValue }
    for (const key of Object.keys(value).sort()) normalized[key] = normalizeJson(value[key], depth + 1)
    return normalized
  }
  throw new RequestError(400, 'invalid_request', 'Diagram options must contain JSON values.')
}

function normalizeDiagram(value: unknown): Diagram {
  if (!isRecord(value)) throw new RequestError(400, 'invalid_request', 'diagram must be an object.')
  assertOnlyKeys(value, ['type', 'source', 'options', 'presentation'], 'diagram')
  if (typeof value.type !== 'string' || !diagramTypePattern.test(value.type)) {
    throw new RequestError(400, 'invalid_request', 'diagram.type is invalid.')
  }
  if (typeof value.source !== 'string') {
    throw new RequestError(400, 'invalid_request', 'diagram.source must be a string.')
  }
  if (encoder.encode(value.source).byteLength > MAX_SOURCE_BYTES) {
    throw new RequestError(413, 'request_too_large', 'Diagram source is too large.')
  }
  if (!isRecord(value.options)) {
    throw new RequestError(400, 'invalid_request', 'diagram.options must be an object.')
  }
  const options = normalizeJson(value.options)
  if (!isRecord(options)) throw new RequestError(400, 'invalid_request', 'diagram.options must be an object.')

  if (!isRecord(value.presentation)) {
    throw new RequestError(400, 'invalid_request', 'diagram.presentation must be an object.')
  }
  assertOnlyKeys(value.presentation, ['background', 'padding', 'frame'], 'diagram.presentation')
  const { background, padding, frame } = value.presentation
  if (typeof background !== 'string' || !backgroundPattern.test(background)) {
    throw new RequestError(400, 'invalid_request', 'diagram.presentation.background is invalid.')
  }
  if (!Number.isInteger(padding) || (padding as number) < 0 || (padding as number) > 256) {
    throw new RequestError(400, 'invalid_request', 'diagram.presentation.padding is invalid.')
  }
  if (typeof frame !== 'boolean') {
    throw new RequestError(400, 'invalid_request', 'diagram.presentation.frame is invalid.')
  }

  return {
    type: value.type,
    source: value.source,
    options,
    presentation: { background, padding: padding as number, frame },
  }
}

function normalizeMetadata(value: unknown): AliasMetadata {
  if (!isRecord(value)) throw new RequestError(400, 'invalid_request', 'metadata must be an object.')
  assertOnlyKeys(value, ['title', 'description'], 'metadata')
  if (typeof value.title !== 'string' || value.title.length > 200) {
    throw new RequestError(400, 'invalid_request', 'metadata.title is invalid.')
  }
  if (typeof value.description !== 'string' || value.description.length > 2000) {
    throw new RequestError(400, 'invalid_request', 'metadata.description is invalid.')
  }
  return { title: value.title, description: value.description }
}

export function normalizeOpenAliasInput(value: unknown): OpenAliasInput {
  if (!isRecord(value)) throw new RequestError(400, 'invalid_request', 'Request body must be an object.')
  assertOnlyKeys(value, ['mode', 'diagram', 'metadata'], 'Request body')
  if (value.mode !== 'open') {
    throw new RequestError(400, 'unsupported_mode', 'Only open diagrams are supported in this release.')
  }
  return {
    mode: 'open',
    diagram: normalizeDiagram(value.diagram),
    metadata: normalizeMetadata(value.metadata),
  }
}

export function normalizeEncryptedBlob(value: unknown, label: string): EncryptedBlob {
  if (!isRecord(value)) throw new RequestError(400, 'invalid_request', `${label} must be an object.`)
  assertOnlyKeys(value, ['v', 'alg', 'iv', 'ciphertext'], label)
  if (value.v !== 1 || value.alg !== 'A256GCM') {
    throw new RequestError(400, 'invalid_request', `${label} uses an unsupported encryption format.`)
  }
  if (typeof value.iv !== 'string' || value.iv.length !== 16 || !base64UrlPattern.test(value.iv)) {
    throw new RequestError(400, 'invalid_request', `${label}.iv is invalid.`)
  }
  if (typeof value.ciphertext !== 'string' || value.ciphertext.length < 22 || !base64UrlPattern.test(value.ciphertext)) {
    throw new RequestError(400, 'invalid_request', `${label}.ciphertext is invalid.`)
  }
  return { v: 1, alg: 'A256GCM', iv: value.iv, ciphertext: value.ciphertext }
}

function normalizeKeyEnvelope(value: unknown): KeyEnvelope {
  if (!isRecord(value)) throw new RequestError(400, 'invalid_request', 'keyEnvelope must be an object.')
  assertOnlyKeys(value, ['v', 'kdf', 'wrap'], 'keyEnvelope')
  if (value.v !== 1 || !isRecord(value.kdf)) {
    throw new RequestError(400, 'invalid_request', 'keyEnvelope uses an unsupported format.')
  }
  assertOnlyKeys(value.kdf, ['name', 'hash', 'iterations', 'salt'], 'keyEnvelope.kdf')
  if (value.kdf.name !== 'PBKDF2' || value.kdf.hash !== 'SHA-256') {
    throw new RequestError(400, 'invalid_request', 'keyEnvelope uses an unsupported KDF.')
  }
  if (!Number.isInteger(value.kdf.iterations)
    || (value.kdf.iterations as number) < 100_000
    || (value.kdf.iterations as number) > 5_000_000) {
    throw new RequestError(400, 'invalid_request', 'keyEnvelope.kdf.iterations is invalid.')
  }
  if (typeof value.kdf.salt !== 'string' || value.kdf.salt.length !== 22 || !base64UrlPattern.test(value.kdf.salt)) {
    throw new RequestError(400, 'invalid_request', 'keyEnvelope.kdf.salt is invalid.')
  }
  return {
    v: 1,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: value.kdf.iterations as number,
      salt: value.kdf.salt,
    },
    wrap: normalizeEncryptedBlob(value.wrap, 'keyEnvelope.wrap'),
  }
}

export function normalizeAliasInput(value: unknown): AliasInput {
  if (!isRecord(value)) throw new RequestError(400, 'invalid_request', 'Request body must be an object.')
  if (value.mode === 'open') return normalizeOpenAliasInput(value)
  if (value.mode !== 'locked') {
    throw new RequestError(400, 'unsupported_mode', 'Diagram mode must be open or locked.')
  }
  assertOnlyKeys(value, ['mode', 'encryptedContent', 'encryptedMetadata', 'keyEnvelope'], 'Request body')
  return {
    mode: 'locked',
    encryptedContent: normalizeEncryptedBlob(value.encryptedContent, 'encryptedContent'),
    encryptedMetadata: normalizeEncryptedBlob(value.encryptedMetadata, 'encryptedMetadata'),
    keyEnvelope: normalizeKeyEnvelope(value.keyEnvelope),
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') {
    throw new RequestError(415, 'unsupported_media_type', 'Content-Type must be application/json.')
  }
  const contentEncoding = request.headers.get('Content-Encoding')?.trim().toLowerCase()
  if (contentEncoding && contentEncoding !== 'identity') {
    throw new RequestError(415, 'unsupported_content_encoding', 'Compressed request bodies are not supported.')
  }
  const declaredLength = request.headers.get('Content-Length')
  if (declaredLength !== null) {
    if (!/^[0-9]+$/.test(declaredLength)) {
      throw new RequestError(400, 'invalid_request', 'Content-Length is invalid.')
    }
    const parsedLength = Number(declaredLength)
    if (parsedLength > MAX_REQUEST_BYTES) {
      throw new RequestError(413, 'request_too_large', 'Request body is too large.')
    }
  }

  const reader = request.body?.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel('Request body is too large.')
        throw new RequestError(413, 'request_too_large', 'Request body is too large.')
      }
      chunks.push(value)
    }
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  let body: string
  try {
    body = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)
  } catch {
    throw new RequestError(400, 'invalid_encoding', 'Request body must be valid UTF-8.')
  }
  try {
    return JSON.parse(body) as unknown
  } catch {
    throw new RequestError(400, 'invalid_json', 'Request body is not valid JSON.')
  }
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(item => canonicalJson(item)).join(',')}]`
  const record = value as { [key: string]: unknown }
  return `{${Object.keys(record).sort().map(key => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`
}
