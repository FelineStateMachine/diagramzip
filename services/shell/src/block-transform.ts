import { APPEARANCES, materializeSvg, SvgNormalizationError, supportedAppearances, type SvgAppearance } from '../../../shared/svg/index.js'
import { ENGINE_IDS, type EngineId } from '../../../renderers/shared/engines'

export const BLOCK_TRANSFORM_PATH = '/transform/blocks'
export const TINY_TRANSFORM_PATH = '/transform/tiny'
export const DEFAULT_RENDER_UNIT_ORIGIN_PATTERN = 'https://{engine}.render.diagram.zip'
export const DEFAULT_APPEARANCE: SvgAppearance = 'auto-transparent'
const MAX_BODY_BYTES = 1_048_576
const MAX_BLOCKS = 32
const MAX_BLOCK_SOURCE_LENGTH = 524_288
const RENDER_TIMEOUT_MS = 20_000
const RENDER_CONCURRENCY = 6
const MAX_ERROR_DETAIL_LENGTH = 200
const SIGNATURE_PREFIX = 'sha256='

const LANG_ALIASES: ReadonlyMap<string, EngineId> = new Map<string, EngineId>([
  ...ENGINE_IDS.map((engine): [string, EngineId] => [engine, engine]),
  ['mmd', 'mermaid'],
  ['dot', 'graphviz'],
  ['puml', 'plantuml'],
  ['uml', 'plantuml'],
  ['c4', 'c4plantuml'],
  ['bob', 'svgbob'],
  ['vega-lite', 'vegalite'],
  ['drawio', 'diagramsnet'],
])

export interface BlockTransformEnv {
  BLOCK_TRANSFORM_SECRET?: string
  TINY_TRANSFORM_SECRET?: string
  RENDER_UNIT_ORIGIN_PATTERN?: string
}

export interface Block {
  index: number
  lang: string
  source: string
}

export interface BlockArtifact {
  block: number
  engine: EngineId
  type: 'image/svg+xml'
  body: string
  appearance: SvgAppearance
}

export interface BlockError {
  block: number
  engine: EngineId
  error: string
}

interface BlockTransformRequest {
  appearance: SvgAppearance
  metadata: { title: string; description: string }
  blocks: Block[]
}

class TransformError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message)
    this.name = 'TransformError'
  }
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(value, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  })
}

function errorResponse(error: unknown): Response {
  if (error instanceof TransformError) return json({ error: { code: error.code, message: error.message } }, error.status)
  console.error(JSON.stringify({ message: 'block transform error', error: error instanceof Error ? error.message : String(error) }))
  return json({ error: { code: 'internal_error', message: 'The transform could not be completed.' } }, 500)
}

export function engineForLang(lang: string): EngineId | undefined {
  return LANG_ALIASES.get(lang.trim().toLowerCase())
}

export function renderUnitUrl(engine: EngineId, pattern: string | undefined): string {
  const base = (pattern === undefined || pattern === '' ? DEFAULT_RENDER_UNIT_ORIGIN_PATTERN : pattern).replaceAll('{engine}', engine)
  return `${base.replace(/\/+$/, '')}/v1/svg`
}

async function bodyBytes(request: Request): Promise<Uint8Array> {
  const length = request.headers.get('content-length')
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw new TransformError(413, 'request_too_large', 'Transform request is too large.')
  if (request.body === null) throw new TransformError(400, 'invalid_request', 'A JSON request body is required.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const item = await reader.read()
    if (item.done) break
    total += item.value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel('request too large')
      throw new TransformError(413, 'request_too_large', 'Transform request is too large.')
    }
    chunks.push(item.value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}

function hexBytes(value: string): Uint8Array | undefined {
  if (value.length === 0 || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) return undefined
  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  return bytes
}

export async function signBody(secret: string, body: BufferSource): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, body))
  return `${SIGNATURE_PREFIX}${Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')}`
}

async function verifySignature(secret: string, body: Uint8Array, header: string | null, headerName: string): Promise<void> {
  const presented = header?.trim() ?? ''
  const provided = presented.toLowerCase().startsWith(SIGNATURE_PREFIX) ? hexBytes(presented.slice(SIGNATURE_PREFIX.length)) : undefined
  const expected = hexBytes((await signBody(secret, body)).slice(SIGNATURE_PREFIX.length))
  if (provided === undefined || expected === undefined || provided.byteLength !== expected.byteLength || !crypto.subtle.timingSafeEqual(provided, expected)) {
    throw new TransformError(401, 'invalid_signature', `${headerName} does not match the request body.`)
  }
}

function objectValue(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TransformError(400, 'invalid_request', `${name} must be an object.`)
  return value as Record<string, unknown>
}

function parseBlock(value: unknown, position: number): Block {
  const block = objectValue(value, `blocks[${position}]`)
  const index = block.index ?? position
  if (!Number.isInteger(index) || Number(index) < 0) throw new TransformError(400, 'invalid_request', `blocks[${position}].index must be a non-negative integer.`)
  if (typeof block.lang !== 'string') throw new TransformError(400, 'invalid_request', `blocks[${position}].lang must be a string.`)
  if (typeof block.source !== 'string') throw new TransformError(400, 'invalid_request', `blocks[${position}].source must be a string.`)
  if (block.source.length > MAX_BLOCK_SOURCE_LENGTH) throw new TransformError(413, 'block_too_large', `blocks[${position}].source is larger than ${MAX_BLOCK_SOURCE_LENGTH} characters.`)
  return { index: Number(index), lang: block.lang, source: block.source }
}

function parseTransformRequest(bytes: Uint8Array): BlockTransformRequest {
  let input: unknown
  try { input = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)) } catch {
    throw new TransformError(400, 'invalid_json', 'Transform request is not valid JSON.')
  }
  const body = objectValue(input, 'request')
  if ('event' in body) throw new TransformError(400, 'unexpected_field', 'The transform request must not include the source event; send source and blocks only.')
  if (body.source !== undefined) objectValue(body.source, 'source')
  if (!Array.isArray(body.blocks)) throw new TransformError(400, 'invalid_request', 'blocks must be an array.')
  if (body.blocks.length > MAX_BLOCKS) throw new TransformError(413, 'too_many_blocks', `blocks cannot contain more than ${MAX_BLOCKS} entries.`)
  const appearance = body.appearance ?? DEFAULT_APPEARANCE
  if (typeof appearance !== 'string' || !(APPEARANCES as readonly string[]).includes(appearance)) {
    throw new TransformError(400, 'invalid_appearance', `appearance must be one of ${APPEARANCES.join(', ')}.`)
  }
  return {
    appearance: appearance as SvgAppearance,
    metadata: { title: '', description: '' },
    blocks: body.blocks.map(parseBlock),
  }
}

async function failureDetail(response: Response): Promise<string> {
  let text = ''
  try { text = (await response.text()).slice(0, 4_096) } catch { return '' }
  try {
    const payload = JSON.parse(text) as { error?: { message?: unknown } }
    if (typeof payload?.error?.message === 'string') return payload.error.message
  } catch { /* plain text failure body */ }
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_ERROR_DETAIL_LENGTH)
}

function chooseAppearance(canonical: string, requested: SvgAppearance): SvgAppearance {
  if (requested === 'raw') return 'raw'
  return (supportedAppearances(canonical) as readonly string[]).includes(requested) ? requested : 'raw'
}

async function renderBlock(block: Block, engine: EngineId, request: BlockTransformRequest, env: BlockTransformEnv): Promise<BlockArtifact | BlockError> {
  try {
    const response = await fetch(renderUnitUrl(engine, env.RENDER_UNIT_ORIGIN_PATTERN), {
      method: 'POST',
      headers: { accept: 'image/svg+xml', 'content-type': 'application/json' },
      body: JSON.stringify({
        source: block.source,
        format: 'svg',
        options: {},
        metadata: request.metadata,
        presentation: { background: '', padding: 0, frame: false },
      }),
      signal: AbortSignal.timeout(RENDER_TIMEOUT_MS),
    })
    if (!response.ok) {
      const detail = await failureDetail(response)
      return { block: block.index, engine, error: `renderer answered ${response.status}${detail === '' ? '' : `: ${detail}`}` }
    }
    const canonical = await response.text()
    const appearance = chooseAppearance(canonical, request.appearance)
    return { block: block.index, engine, type: 'image/svg+xml', body: materializeSvg(canonical, appearance), appearance }
  } catch (error) {
    if (error instanceof SvgNormalizationError) return { block: block.index, engine, error: `renderer output rejected: ${error.message}` }
    if (error instanceof Error && error.name === 'TimeoutError') return { block: block.index, engine, error: `renderer timed out after ${RENDER_TIMEOUT_MS / 1_000} seconds` }
    return { block: block.index, engine, error: `renderer unreachable: ${error instanceof Error ? error.message : String(error)}` }
  }
}

async function renderAll(request: BlockTransformRequest, env: BlockTransformEnv): Promise<Array<BlockArtifact | BlockError>> {
  const jobs = request.blocks.flatMap(block => {
    const engine = engineForLang(block.lang)
    return engine === undefined ? [] : [{ block, engine }]
  })
  const results = new Array<BlockArtifact | BlockError>(jobs.length)
  let next = 0
  const worker = async (): Promise<void> => {
    while (next < jobs.length) {
      const position = next
      next += 1
      const job = jobs[position]
      results[position] = await renderBlock(job.block, job.engine, request, env)
    }
  }
  await Promise.all(Array.from({ length: Math.min(RENDER_CONCURRENCY, jobs.length) }, worker))
  return results
}

export async function blockTransform(request: Request, env: BlockTransformEnv, legacy = false): Promise<Response> {
  try {
    if (request.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'Use POST for the block transform endpoint.' } }, 405, { allow: 'POST' })
    const secretName = legacy ? 'TINY_TRANSFORM_SECRET' : 'BLOCK_TRANSFORM_SECRET'
    const secret = legacy ? (env.TINY_TRANSFORM_SECRET ?? env.BLOCK_TRANSFORM_SECRET) : env.BLOCK_TRANSFORM_SECRET
    if (typeof secret !== 'string' || secret === '') return json({ error: { code: 'transform_unavailable', message: `${secretName} is not configured.` } }, 503)
    const bytes = await bodyBytes(request)
    const signatureHeader = legacy ? 'X-Tiny-Signature' : 'X-Transform-Signature'
    await verifySignature(secret, bytes, request.headers.get(legacy ? 'x-tiny-signature' : 'x-transform-signature'), signatureHeader)
    const results = await renderAll(parseTransformRequest(bytes), env)
    return json({
      artifacts: results.filter((result): result is BlockArtifact => 'body' in result),
      errors: results.filter((result): result is BlockError => 'error' in result),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
