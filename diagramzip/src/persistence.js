import { normalizeMetadata, normalizePresentation } from './state.js'
import { APPEARANCES } from './client-svg.js'

export const API_PREFIX = '/api/v1'
export const ALIAS_ID_PATTERN = /^[A-Za-z0-9_-]{16}$/
export const WRITE_CAPABILITY_PATTERN = /^[A-Za-z0-9_-]{43}$/

function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function generateWriteCapability() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
}

export function aliasIdFromPath(pathname) {
  const match = pathname.match(/^\/d\/([A-Za-z0-9_-]{16})\/?$/)
  return match?.[1] ?? null
}

export function readAliasUrl(origin, aliasId) {
  if (!ALIAS_ID_PATTERN.test(aliasId)) throw new Error('Invalid diagram alias.')
  return new URL(`/d/${aliasId}`, origin).toString()
}

export function editAliasUrl(origin, aliasId, writeCapability) {
  if (!WRITE_CAPABILITY_PATTERN.test(writeCapability)) throw new Error('Invalid write capability.')
  const url = new URL(readAliasUrl(origin, aliasId))
  url.hash = `w=${writeCapability}`
  return url.toString()
}

export function stableRenderUrl(origin, aliasId, format = 'svg', appearance = 'raw') {
  if (!ALIAS_ID_PATTERN.test(aliasId)) throw new Error('Invalid diagram alias.')
  if (format !== 'svg' && format !== 'png') throw new Error('Invalid render format.')
  if (!APPEARANCES.includes(appearance)) throw new Error('Invalid SVG appearance.')
  if (format !== 'svg' && appearance !== 'raw') throw new Error('SVG appearances require SVG format.')
  const url = new URL(`${API_PREFIX}/aliases/${aliasId}/renders/${format}`, origin)
  if (appearance !== 'raw') url.searchParams.set('appearance', appearance)
  return url.toString()
}

export function writeCapabilityFromHash(hash) {
  const match = hash.match(/^#w=([A-Za-z0-9_-]{43})$/)
  return match?.[1] ?? null
}

export class PersistenceError extends Error {
  constructor(message, { status, code } = {}) {
    super(message)
    this.status = status
    this.code = code
  }
}

function openRequestPayload(state) {
  if (!state || typeof state !== 'object' || typeof state.type !== 'string' || typeof state.source !== 'string') {
    throw new Error('Invalid diagram state.')
  }
  return {
    mode: 'open',
    diagram: {
      type: state.type,
      source: state.source,
      options: state.options ?? {},
      presentation: normalizePresentation(state.presentation),
    },
    metadata: normalizeMetadata(state.meta),
  }
}

function normalizeResponse(value) {
  if (!value || typeof value !== 'object'
    || !ALIAS_ID_PATTERN.test(value.aliasId)
    || !WRITE_CAPABILITY_PATTERN.test(value.contentId)
    || !WRITE_CAPABILITY_PATTERN.test(value.renderId)
    || !Number.isSafeInteger(value.revision)
    || (value.mode !== 'open' && value.mode !== 'locked')) {
    throw new PersistenceError('The persistence service returned an invalid response.', {
      code: 'invalid_response',
    })
  }
  const common = {
    aliasId: value.aliasId,
    contentId: value.contentId,
    renderId: value.renderId,
    revision: value.revision,
    mode: value.mode,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
  if (value.mode === 'locked') {
    if (!value.encryptedContent || !value.encryptedMetadata || !value.keyEnvelope) {
      throw new PersistenceError('The persistence service returned an invalid locked diagram.', {
        code: 'invalid_response',
      })
    }
    return {
      ...common,
      encryptedContent: value.encryptedContent,
      encryptedMetadata: value.encryptedMetadata,
      keyEnvelope: value.keyEnvelope,
    }
  }
  if (!value.diagram || typeof value.diagram !== 'object') {
    throw new PersistenceError('The persistence service returned an invalid open diagram.', {
      code: 'invalid_response',
    })
  }
  return {
    ...common,
    state: {
      type: value.diagram.type,
      source: value.diagram.source,
      options: value.diagram.options ?? {},
      presentation: normalizePresentation(value.diagram.presentation),
      meta: normalizeMetadata(value.metadata),
    },
  }
}

export class PersistenceClient {
  constructor({
    fetchImpl = globalThis.fetch,
    origin = globalThis.location?.origin ?? 'http://localhost',
    apiPrefix = API_PREFIX,
  } = {}) {
    this.fetch = (...args) => fetchImpl(...args)
    this.origin = origin
    this.apiPrefix = apiPrefix.replace(/\/$/, '')
  }

  url(path = '') {
    return new URL(`${this.apiPrefix}/aliases${path}`, this.origin)
  }

  async request(url, init) {
    const response = await this.fetch(url, init)
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      throw new PersistenceError(body?.error?.message || `Persistence request failed with HTTP ${response.status}.`, {
        status: response.status,
        code: body?.error?.code,
      })
    }
    return normalizeResponse(body)
  }

  async errorFor(response) {
    const body = await response.json().catch(() => null)
    return new PersistenceError(body?.error?.message || `Persistence request failed with HTTP ${response.status}.`, {
      status: response.status,
      code: body?.error?.code,
    })
  }

  async createPayload(payload) {
    const writeCapability = generateWriteCapability()
    const alias = await this.request(this.url(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${writeCapability}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return { ...alias, writeCapability }
  }

  createAlias(state) {
    return this.createPayload(openRequestPayload(state))
  }

  createLockedAlias(payload) {
    if (payload?.mode !== 'locked') throw new Error('Invalid locked diagram payload.')
    return this.createPayload(payload)
  }

  getAlias(aliasId) {
    if (!ALIAS_ID_PATTERN.test(aliasId)) throw new Error('Invalid diagram alias.')
    return this.request(this.url(`/${aliasId}`), { headers: { Accept: 'application/json' } })
  }

  updatePayload(aliasId, payload, revision, writeCapability) {
    if (!ALIAS_ID_PATTERN.test(aliasId)) throw new Error('Invalid diagram alias.')
    if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Invalid alias revision.')
    if (!WRITE_CAPABILITY_PATTERN.test(writeCapability)) throw new Error('Invalid write capability.')
    return this.request(this.url(`/${aliasId}`), {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${writeCapability}`,
        'Content-Type': 'application/json',
        'If-Match': `"${revision}"`,
      },
      body: JSON.stringify(payload),
    })
  }

  updateAlias(aliasId, state, revision, writeCapability) {
    return this.updatePayload(aliasId, openRequestPayload(state), revision, writeCapability)
  }

  updateLockedAlias(aliasId, payload, revision, writeCapability) {
    if (payload?.mode !== 'locked') throw new Error('Invalid locked diagram payload.')
    return this.updatePayload(aliasId, payload, revision, writeCapability)
  }


  async uploadRender({ aliasId, renderId, revision, writeCapability, format, mode, render, renderer }) {
    if (!ALIAS_ID_PATTERN.test(aliasId)) throw new Error('Invalid diagram alias.')
    if (!WRITE_CAPABILITY_PATTERN.test(renderId)) throw new Error('Invalid render ID.')
    if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Invalid alias revision.')
    if (!WRITE_CAPABILITY_PATTERN.test(writeCapability)) throw new Error('Invalid write capability.')
    if (format !== 'svg' && format !== 'png') throw new Error('Invalid render format.')
    if (mode !== 'open' && mode !== 'locked') throw new Error('Invalid diagram mode.')
    if (!renderer || !/^[a-z][a-z0-9-]{0,31}$/.test(renderer.unit)
      || typeof renderer.build !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._@+-]{0,127}$/.test(renderer.build)
      || !Array.isArray(renderer.pipeline) || renderer.pipeline.length < 1
      || renderer.pipeline.some(value => !/^[a-z][a-z0-9-]{0,31}$/.test(value))) {
      throw new Error('Invalid renderer identity.')
    }
    const contentType = mode === 'locked'
      ? 'application/json'
      : format === 'svg' ? 'image/svg+xml' : 'image/png'
    const body = mode === 'locked' ? JSON.stringify(render) : render
    const response = await this.fetch(this.url(`/${aliasId}/renders/${format}`), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${writeCapability}`,
        'Content-Type': contentType,
        'If-Match': `"${revision}"`,
        'X-Render-Id': renderId,
        'X-Renderer-Unit': renderer.unit,
        'X-Renderer-Build': renderer.build,
        'X-Renderer-Pipeline': renderer.pipeline.join(','),
      },
      body,
    })
    if (!response.ok) throw await this.errorFor(response)
  }

  async getEncryptedRender(aliasId, format) {
    if (!ALIAS_ID_PATTERN.test(aliasId)) throw new Error('Invalid diagram alias.')
    if (format !== 'svg' && format !== 'png') throw new Error('Invalid render format.')
    const url = this.url(`/${aliasId}/renders/${format}`)
    url.searchParams.set('encrypted', '1')
    const response = await this.fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw await this.errorFor(response)
    return response.json()
  }
}
