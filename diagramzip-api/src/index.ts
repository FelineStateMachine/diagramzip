import type {
  AliasInput,
  AliasRecord,
  AliasResponse,
  Diagram,
  LockedAliasInput,
  LockedAliasResponse,
  OpenAliasInput,
  OpenAliasResponse,
} from './model'
import { capabilityMatches, contentId, isAliasId, randomAliasId, writeCapabilityHash } from './crypto'
import {
  canonicalJson,
  normalizeAliasInput,
  normalizeEncryptedBlob,
  normalizeOpenAliasInput,
  readJsonBody,
  RequestError,
} from './validation'

const API_PREFIX = '/api/v1'
const encoder = new TextEncoder()
const aliasPathPattern = /^\/api\/v1\/aliases\/([A-Za-z0-9_-]{16})\/?$/
const renderPathPattern = /^\/api\/v1\/aliases\/([A-Za-z0-9_-]{16})\/renders\/(svg|png)\/?$/
const MAX_RENDER_BYTES = 12 * 1024 * 1024
const rendererUnitPattern = /^[a-z][a-z0-9-]{0,31}$/
const rendererBuildPattern = /^[A-Za-z0-9][A-Za-z0-9._@+-]{0,127}$/

interface RendererIdentity {
  unit: string
  build: string
  pipeline: string[]
}

interface RenderHead extends RendererIdentity {
  objectKey: string
}

function responseHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  headers.set('Cache-Control', 'no-store')
  headers.set('Content-Security-Policy', "default-src 'none'")
  headers.set('X-Content-Type-Options', 'nosniff')
  return headers
}

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = responseHeaders(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return Response.json(value, { ...init, headers })
}

function errorResponse(error: RequestError): Response {
  const headers = error.status === 401 ? { 'WWW-Authenticate': 'Bearer' } : undefined
  return json({ error: { code: error.code, message: error.message } }, { status: error.status, headers })
}

function parseRevision(request: Request): number {
  const match = request.headers.get('If-Match')?.match(/^"([1-9][0-9]*)"$/)
  if (!match?.[1]) {
    throw new RequestError(428, 'revision_required', 'If-Match must contain the current quoted revision.')
  }
  const revision = Number(match[1])
  if (!Number.isSafeInteger(revision)) {
    throw new RequestError(400, 'invalid_revision', 'The supplied revision is invalid.')
  }
  return revision
}

function openResponse(
  aliasId: string,
  contentIdValue: string,
  renderId: string,
  revision: number,
  metadata: OpenAliasInput['metadata'],
  diagram: Diagram,
  createdAt: number,
  updatedAt: number,
): OpenAliasResponse {
  return {
    aliasId,
    contentId: contentIdValue,
    renderId,
    revision,
    mode: 'open',
    metadata,
    diagram,
    createdAt,
    updatedAt,
  }
}

function lockedResponse(
  aliasId: string,
  contentIdValue: string,
  renderId: string,
  revision: number,
  input: LockedAliasInput,
  createdAt: number,
  updatedAt: number,
): LockedAliasResponse {
  return {
    aliasId,
    contentId: contentIdValue,
    renderId,
    revision,
    mode: 'locked',
    encryptedContent: input.encryptedContent,
    encryptedMetadata: input.encryptedMetadata,
    keyEnvelope: input.keyEnvelope,
    createdAt,
    updatedAt,
  }
}

function aliasResponse(
  aliasId: string,
  contentIdValue: string,
  renderId: string,
  revision: number,
  input: AliasInput,
  createdAt: number,
  updatedAt: number,
): AliasResponse {
  return input.mode === 'open'
    ? openResponse(aliasId, contentIdValue, renderId, revision, input.metadata, input.diagram, createdAt, updatedAt)
    : lockedResponse(aliasId, contentIdValue, renderId, revision, input, createdAt, updatedAt)
}

async function renderIdFor(input: AliasInput): Promise<string> {
  const identity = input.mode === 'open'
    ? { mode: input.mode, diagram: input.diagram, metadata: input.metadata }
    : {
        mode: input.mode,
        encryptedContent: input.encryptedContent,
        encryptedMetadata: input.encryptedMetadata,
      }
  return (await contentId(encoder.encode(canonicalJson(identity)))).id
}

interface StoredContent {
  id: string
  key: string
  bytes: Uint8Array
  mode: AliasInput['mode']
  encoding: 'json' | 'json+a256gcm'
}

async function storeContent(env: Env, input: AliasInput): Promise<StoredContent> {
  const content = input.mode === 'open' ? input.diagram : input.encryptedContent
  const bytes = encoder.encode(canonicalJson(content))
  const { id, digest } = await contentId(bytes)
  const encoding = input.mode === 'open' ? 'json' : 'json+a256gcm'
  const extension = input.mode === 'open' ? 'json' : 'enc'
  const key = `contents/${input.mode}/${id}.${extension}`
  await env.CONTENT.put(key, bytes, {
    onlyIf: { etagDoesNotMatch: '*' },
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
    customMetadata: { contentId: id, mode: input.mode, encoding },
    sha256: digest,
  })
  return { id, key, bytes, mode: input.mode, encoding }
}

function insertContentStatement(env: Env, stored: StoredContent, now: number): D1PreparedStatement {
  return env.DB.prepare(`
    INSERT OR IGNORE INTO contents
      (content_id, mode, object_key, encoding, size_bytes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(stored.id, stored.mode, stored.key, stored.encoding, stored.bytes.byteLength, now)
}

function aliasColumns(input: AliasInput): {
  title: string | null
  description: string | null
  encryptedMetadata: string | null
  keyEnvelope: string | null
} {
  return input.mode === 'open'
    ? {
        title: input.metadata.title,
        description: input.metadata.description,
        encryptedMetadata: null,
        keyEnvelope: null,
      }
    : {
        title: null,
        description: null,
        encryptedMetadata: canonicalJson(input.encryptedMetadata),
        keyEnvelope: canonicalJson(input.keyEnvelope),
      }
}

async function createAlias(request: Request, env: Env): Promise<Response> {
  const writeHash = await writeCapabilityHash(request)
  const input = normalizeAliasInput(await readJsonBody(request))
  const stored = await storeContent(env, input)
  const renderId = await renderIdFor(input)
  const columns = aliasColumns(input)
  const now = Date.now()

  for (let attempt = 0; attempt < 4; attempt++) {
    const aliasId = randomAliasId()
    const results = await env.DB.batch([
      insertContentStatement(env, stored, now),
      env.DB.prepare(`
        INSERT OR IGNORE INTO aliases
          (alias_id, content_id, render_id, revision, mode, title, description, encrypted_metadata, key_envelope,
            write_key_hash, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        aliasId,
        stored.id,
        renderId,
        input.mode,
        columns.title,
        columns.description,
        columns.encryptedMetadata,
        columns.keyEnvelope,
        writeHash,
        now,
        now,
      ),
    ])
    if ((results[1]?.meta.changes ?? 0) === 1) {
      const location = `${API_PREFIX}/aliases/${aliasId}`
      return json(aliasResponse(aliasId, stored.id, renderId, 1, input, now, now), {
        status: 201,
        headers: { ETag: '"1"', Location: location },
      })
    }
  }
  throw new Error('Could not allocate an alias ID after four attempts.')
}

async function findAlias(env: Env, aliasId: string, primary = false): Promise<AliasRecord | null> {
  const database = primary ? env.DB.withSession('first-primary') : env.DB
  return database.prepare(`
    SELECT aliases.*, contents.object_key
    FROM aliases
    JOIN contents ON contents.content_id = aliases.content_id
    WHERE aliases.alias_id = ?
  `).bind(aliasId).first<AliasRecord>()
}

async function readAliasInput(env: Env, record: AliasRecord): Promise<AliasInput> {
  const object = await env.CONTENT.get(record.object_key)
  if (object === null) throw new Error(`Content object missing for alias ${record.alias_id}.`)
  if (record.mode === 'open') {
    return normalizeOpenAliasInput({
      mode: 'open',
      diagram: await object.json<unknown>(),
      metadata: { title: record.title ?? '', description: record.description ?? '' },
    })
  }
  if (!record.encrypted_metadata || !record.key_envelope) {
    throw new Error(`Locked alias metadata missing for alias ${record.alias_id}.`)
  }
  return normalizeAliasInput({
    mode: 'locked',
    encryptedContent: await object.json<unknown>(),
    encryptedMetadata: JSON.parse(record.encrypted_metadata) as unknown,
    keyEnvelope: JSON.parse(record.key_envelope) as unknown,
  })
}

async function getAlias(request: Request, env: Env, aliasId: string): Promise<Response> {
  const record = await findAlias(env, aliasId)
  if (record === null) throw new RequestError(404, 'alias_not_found', 'Diagram alias not found.')
  const etag = `"${record.revision}"`
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: responseHeaders({ ETag: etag }) })
  }
  const input = await readAliasInput(env, record)
  return json(aliasResponse(
    record.alias_id,
    record.content_id,
    record.render_id,
    record.revision,
    input,
    record.created_at,
    record.updated_at,
  ), { headers: { ETag: etag } })
}

async function updateAlias(request: Request, env: Env, aliasId: string): Promise<Response> {
  const writeHash = await writeCapabilityHash(request)
  const expectedRevision = parseRevision(request)
  const record = await findAlias(env, aliasId, true)
  if (record === null) throw new RequestError(404, 'alias_not_found', 'Diagram alias not found.')
  if (!capabilityMatches(writeHash, record.write_key_hash)) {
    throw new RequestError(403, 'write_capability_rejected', 'The write capability is not valid for this alias.')
  }
  if (record.revision !== expectedRevision) {
    throw new RequestError(412, 'revision_conflict', 'The alias changed since it was loaded.')
  }
  const input = normalizeAliasInput(await readJsonBody(request))
  const stored = await storeContent(env, input)
  const renderId = await renderIdFor(input)
  const columns = aliasColumns(input)
  const now = Date.now()
  const results = await env.DB.batch([
    insertContentStatement(env, stored, now),
    env.DB.prepare(`
      UPDATE aliases
      SET content_id = ?, render_id = ?, mode = ?, title = ?, description = ?, encrypted_metadata = ?, key_envelope = ?,
        revision = revision + 1, updated_at = ?
      WHERE alias_id = ? AND revision = ? AND write_key_hash = ?
    `).bind(
      stored.id,
      renderId,
      input.mode,
      columns.title,
      columns.description,
      columns.encryptedMetadata,
      columns.keyEnvelope,
      now,
      aliasId,
      expectedRevision,
      writeHash,
    ),
  ])
  if ((results[1]?.meta.changes ?? 0) !== 1) {
    throw new RequestError(412, 'revision_conflict', 'The alias changed since it was loaded.')
  }

  const revision = expectedRevision + 1
  return json(aliasResponse(
    aliasId,
    stored.id,
    renderId,
    revision,
    input,
    record.created_at,
    now,
  ), { headers: { ETag: `"${revision}"` } })
}

function rendererIdentity(request: Request): RendererIdentity {
  const unit = request.headers.get('X-Renderer-Unit')?.trim() ?? ''
  const build = request.headers.get('X-Renderer-Build')?.trim() ?? ''
  const pipeline = (request.headers.get('X-Renderer-Pipeline') ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
  if (!rendererUnitPattern.test(unit)
    || !rendererBuildPattern.test(build)
    || pipeline.length < 1
    || pipeline.length > 8
    || pipeline[0] !== unit
    || pipeline.some(value => !rendererUnitPattern.test(value))) {
    throw new RequestError(400, 'invalid_renderer_identity', 'Renderer unit, build, and pipeline headers are required.')
  }
  return { unit, build, pipeline }
}

function renderObjectKey(record: AliasRecord, format: 'svg' | 'png', renderer: RendererIdentity): string {
  const extension = record.mode === 'locked' ? `${format}.enc` : format
  return `renders/${record.mode}/${renderer.unit}/${renderer.build}/${record.render_id}.${extension}`
}

function renderHeadKey(record: AliasRecord, format: 'svg' | 'png'): string {
  return `render-heads/${record.mode}/${record.render_id}.${format}.json`
}

function normalizeRenderHead(value: unknown, record: AliasRecord, format: 'svg' | 'png'): RenderHead {
  if (!value || typeof value !== 'object') throw new Error(`Invalid render head for ${record.render_id}.`)
  const candidate = value as Record<string, unknown>
  const identity = {
    unit: candidate.unit,
    build: candidate.build,
    pipeline: candidate.pipeline,
  }
  if (typeof identity.unit !== 'string'
    || typeof identity.build !== 'string'
    || !Array.isArray(identity.pipeline)
    || identity.pipeline.some(value => typeof value !== 'string')
    || !rendererUnitPattern.test(identity.unit)
    || !rendererBuildPattern.test(identity.build)
    || identity.pipeline.length < 1
    || identity.pipeline.length > 8
    || identity.pipeline[0] !== identity.unit
    || identity.pipeline.some(value => typeof value !== 'string' || !rendererUnitPattern.test(value))) {
    throw new Error(`Invalid render head for ${record.render_id}.`)
  }
  const expectedKey = renderObjectKey(record, format, identity as RendererIdentity)
  if (candidate.objectKey !== expectedKey) throw new Error(`Invalid render head for ${record.render_id}.`)
  return { ...(identity as RendererIdentity), objectKey: expectedKey }
}

async function readRenderBody(request: Request): Promise<Uint8Array> {
  const declaredLength = request.headers.get('Content-Length')
  if (declaredLength !== null) {
    if (!/^[0-9]+$/.test(declaredLength)) {
      throw new RequestError(400, 'invalid_render', 'Content-Length is invalid.')
    }
    if (Number(declaredLength) > MAX_RENDER_BYTES) {
      throw new RequestError(413, 'render_too_large', 'Rendered image is too large.')
    }
  }
  const contentEncoding = request.headers.get('Content-Encoding')?.trim().toLowerCase()
  if (contentEncoding && contentEncoding !== 'identity') {
    throw new RequestError(415, 'unsupported_content_encoding', 'Compressed render uploads are not supported.')
  }
  const reader = request.body?.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_RENDER_BYTES) {
        await reader.cancel('Rendered image is too large.')
        throw new RequestError(413, 'render_too_large', 'Rendered image is too large.')
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
  return bytes
}

async function authorizeRenderWrite(request: Request, env: Env, aliasId: string): Promise<AliasRecord> {
  const [writeHash, expectedRevision] = await Promise.all([
    writeCapabilityHash(request),
    Promise.resolve(parseRevision(request)),
  ])
  const record = await findAlias(env, aliasId, true)
  if (record === null) throw new RequestError(404, 'alias_not_found', 'Diagram alias not found.')
  if (!capabilityMatches(writeHash, record.write_key_hash)) {
    throw new RequestError(403, 'write_capability_rejected', 'The write capability is not valid for this alias.')
  }
  if (record.revision !== expectedRevision || request.headers.get('X-Render-Id') !== record.render_id) {
    throw new RequestError(412, 'revision_conflict', 'The alias changed before its render was stored.')
  }
  return record
}

async function putRender(
  request: Request,
  env: Env,
  aliasId: string,
  format: 'svg' | 'png',
): Promise<Response> {
  const record = await authorizeRenderWrite(request, env, aliasId)
  const renderer = rendererIdentity(request)
  const mediaType = format === 'svg' ? 'image/svg+xml' : 'image/png'
  const bytes = await readRenderBody(request)
  if (bytes.byteLength === 0) throw new RequestError(400, 'invalid_render', 'Rendered image is empty.')

  let storedBytes = bytes
  let contentType = mediaType
  if (record.mode === 'locked') {
    if (request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') {
      throw new RequestError(415, 'unsupported_media_type', 'Encrypted renders must use application/json.')
    }
    let body: unknown
    try {
      body = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)) as unknown
    } catch {
      throw new RequestError(400, 'invalid_render', 'Encrypted render is not valid JSON.')
    }
    storedBytes = encoder.encode(canonicalJson(normalizeEncryptedBlob(body, 'encryptedRender')))
    contentType = 'application/json; charset=utf-8'
  } else if (request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase() !== mediaType) {
    throw new RequestError(415, 'unsupported_media_type', `Render must use ${mediaType}.`)
  }

  const objectKey = renderObjectKey(record, format, renderer)
  await env.CONTENT.put(objectKey, storedBytes, {
    onlyIf: { etagDoesNotMatch: '*' },
    httpMetadata: { contentType },
    customMetadata: {
      contentId: record.content_id,
      renderId: record.render_id,
      mode: record.mode,
      format,
      rendererUnit: renderer.unit,
      rendererBuild: renderer.build,
      rendererPipeline: renderer.pipeline.join(','),
    },
  })
  const head: RenderHead = { ...renderer, objectKey }
  await env.CONTENT.put(renderHeadKey(record, format), canonicalJson(head), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
    customMetadata: { renderId: record.render_id, mode: record.mode, format },
  })
  return new Response(null, { status: 204, headers: responseHeaders() })
}

async function getRender(
  request: Request,
  env: Env,
  aliasId: string,
  format: 'svg' | 'png',
): Promise<Response> {
  const record = await findAlias(env, aliasId)
  if (record === null) throw new RequestError(404, 'alias_not_found', 'Diagram alias not found.')
  const encryptedRequest = new URL(request.url).searchParams.get('encrypted') === '1'
  if (record.mode === 'locked' && !encryptedRequest) {
    throw new RequestError(403, 'encrypted_diagram_not_embeddable', 'Password-locked diagrams cannot be embedded.')
  }
  if (record.mode === 'open' && encryptedRequest) {
    throw new RequestError(400, 'render_not_encrypted', 'This diagram render is not encrypted.')
  }
  const headObject = await env.CONTENT.get(renderHeadKey(record, format))
  if (headObject === null) throw new RequestError(404, 'render_not_found', 'Saved render not found.')
  const head = normalizeRenderHead(await headObject.json<unknown>(), record, format)
  const object = await env.CONTENT.get(head.objectKey)
  if (object === null) throw new RequestError(404, 'render_not_found', 'Saved render not found.')
  if (request.headers.get('If-None-Match') === object.httpEtag) {
    return new Response(null, { status: 304, headers: { ETag: object.httpEtag } })
  }
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Content-Security-Policy', "default-src 'none'; sandbox")
  headers.set('X-Renderer-Unit', head.unit)
  headers.set('X-Renderer-Build', head.build)
  headers.set('X-Renderer-Pipeline', head.pipeline.join(','))
  headers.set('Cache-Control', record.mode === 'open'
    ? 'public, max-age=60, stale-while-revalidate=300'
    : 'no-store')
  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  if (url.pathname === `${API_PREFIX}/health` && request.method === 'GET') {
    return json({ status: 'ok' })
  }
  if (url.pathname === `${API_PREFIX}/aliases` || url.pathname === `${API_PREFIX}/aliases/`) {
    if (request.method === 'POST') return createAlias(request, env)
    return json({ error: { code: 'method_not_allowed', message: 'Method not allowed.' } }, {
      status: 405,
      headers: { Allow: 'POST' },
    })
  }

  const aliasMatch = url.pathname.match(aliasPathPattern)
  if (aliasMatch?.[1] && isAliasId(aliasMatch[1])) {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const response = await getAlias(request, env, aliasMatch[1])
      return request.method === 'HEAD' ? new Response(null, response) : response
    }
    if (request.method === 'PUT') return updateAlias(request, env, aliasMatch[1])
    return json({ error: { code: 'method_not_allowed', message: 'Method not allowed.' } }, {
      status: 405,
      headers: { Allow: 'GET, HEAD, PUT' },
    })
  }
  const renderMatch = url.pathname.match(renderPathPattern)
  if (renderMatch?.[1] && isAliasId(renderMatch[1])) {
    const format = renderMatch[2] as 'svg' | 'png'
    if (request.method === 'GET' || request.method === 'HEAD') {
      return getRender(request, env, renderMatch[1], format)
    }
    if (request.method === 'PUT') return putRender(request, env, renderMatch[1], format)
    return json({ error: { code: 'method_not_allowed', message: 'Method not allowed.' } }, {
      status: 405,
      headers: { Allow: 'GET, HEAD, PUT' },
    })
  }
  throw new RequestError(404, 'not_found', 'Route not found.')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env)
    } catch (error) {
      if (error instanceof RequestError) return errorResponse(error)
      console.error(JSON.stringify({
        message: 'Unhandled diagramzip-api error',
        method: request.method,
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
      return errorResponse(new RequestError(500, 'internal_error', 'An internal error occurred.'))
    }
  },
} satisfies ExportedHandler<Env>
