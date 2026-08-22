export const RECENTS_KEY = 'diagram.zip:recents:v1'
export const LOCAL_DOCUMENT_PREFIX = 'diagram.zip:doc:v1:'
export const LEGACY_DRAFT_KEY = 'diagram.zip:draft:local:v2'
export const WRITE_CAPABILITY_PREFIX = 'diagram.zip:write:v1:'
export const MAX_RECENTS = 50

const LOCAL_ID = /^l_[0-9a-f]{8}$/

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function bodyKey(localId) {
  return `${LOCAL_DOCUMENT_PREFIX}${localId}`
}

function validState(value) {
  return isObject(value) && typeof value.type === 'string' && typeof value.source === 'string'
}

function normalizeBody(value) {
  if (!isObject(value) || !validState(value.state)) return null
  return {
    state: value.state,
    detailsSource: typeof value.detailsSource === 'string' ? value.detailsSource : null,
    fileSnapshot: value.fileSnapshot ?? null,
    drafts: isObject(value.drafts) ? value.drafts : {},
  }
}

function normalizeRecent(value) {
  if (!isObject(value) || typeof value.updatedAt !== 'number') return null
  if (value.kind === 'local' && LOCAL_ID.test(value.localId)) {
    return {
      kind: 'local', localId: value.localId, title: typeof value.title === 'string' ? value.title : '',
      type: typeof value.type === 'string' ? value.type : '', updatedAt: value.updatedAt,
      dirty: value.dirty !== false, bytes: Number.isFinite(value.bytes) ? Math.max(0, value.bytes) : 0,
    }
  }
  if (value.kind === 'alias' && typeof value.aliasId === 'string' && value.aliasId) {
    return {
      kind: 'alias', aliasId: value.aliasId, title: value.mode === 'locked' ? null : (typeof value.title === 'string' ? value.title : null),
      type: value.mode === 'locked' ? '' : (typeof value.type === 'string' ? value.type : ''), updatedAt: value.updatedAt,
      mode: value.mode === 'locked' ? 'locked' : 'open', bytes: 0,
    }
  }
  return null
}

function parseRecents(storage, maxRecents = MAX_RECENTS) {
  try {
    const raw = storage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const entries = Array.isArray(parsed) ? parsed : parsed?.v === 1 ? parsed.entries : null
    if (!Array.isArray(entries)) return []
    return entries.map(normalizeRecent).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, maxRecents)
  } catch {
    return []
  }
}

function createId(cryptoImpl) {
  const bytes = new Uint8Array(4)
  if (!cryptoImpl || typeof cryptoImpl.getRandomValues !== 'function') throw new Error('Secure randomness is unavailable.')
  cryptoImpl.getRandomValues(bytes)
  return `l_${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`
}

function isQuotaError(error) {
  return error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014
}

export function createLocalDocuments({
  storage = globalThis.localStorage,
  cryptoImpl = globalThis.crypto,
  now = () => Date.now(),
  maxRecents = MAX_RECENTS,
} = {}) {
  if (!storage) throw new Error('Storage is unavailable.')

  const recents = () => parseRecents(storage, maxRecents)
  const writeRecents = entries => storage.setItem(RECENTS_KEY, JSON.stringify({ v: 1, entries: entries.slice(0, maxRecents) }))
  const evictOne = currentLocalId => {
    const entries = recents()
    const candidate = entries.filter(entry => entry.kind === 'local' && entry.localId !== currentLocalId && entry.dirty === false)
      .sort((a, b) => a.updatedAt - b.updatedAt)[0]
    if (!candidate) return false
    try { storage.removeItem(bodyKey(candidate.localId)) } catch { /* best effort */ }
    try {
      writeRecents(entries.filter(entry => !(entry.kind === 'local' && entry.localId === candidate.localId)))
      return true
    } catch {
      return false
    }
  }
  const withQuotaRetry = (operation, currentLocalId = null) => {
    try { operation(); return true } catch (error) {
      if (!isQuotaError(error)) return false
      if (!evictOne(currentLocalId)) return false
      try { operation(); return true } catch { return false }
    }
  }
  const saveIndexEntry = (entry, currentLocalId) => withQuotaRetry(() => writeRecents([entry, ...recents().filter(item => !(
    (entry.kind === 'local' && item.kind === 'local' && item.localId === entry.localId)
    || (entry.kind === 'alias' && item.kind === 'alias' && item.aliasId === entry.aliasId)
  ))]), currentLocalId)

  return {
    loadRecents: recents,
    upsertRecent(entry) {
      const normalized = normalizeRecent({ ...entry, updatedAt: entry.updatedAt ?? now() })
      if (!normalized) return false
      return saveIndexEntry(normalized, normalized.kind === 'local' ? normalized.localId : null)
    },
    touchRecent(identity, changes = {}) {
      const entries = recents()
      const found = entries.find(entry => identity.localId ? entry.kind === 'local' && entry.localId === identity.localId : entry.kind === 'alias' && entry.aliasId === identity.aliasId)
      if (!found) return false
      return saveIndexEntry(normalizeRecent({ ...found, ...changes, updatedAt: now() }), found.kind === 'local' ? found.localId : null)
    },
    saveLocalDocument(document, { localId = document.localId ?? createId(cryptoImpl), currentLocalId = localId } = {}) {
      if (!LOCAL_ID.test(localId)) throw new Error('Invalid local document ID.')
      const body = normalizeBody(document)
      if (!body) throw new Error('Invalid local document.')
      const serializedBody = JSON.stringify(body)
      const entry = normalizeRecent({
        kind: 'local',
        localId,
        title: document.title ?? body.state.meta?.title ?? '',
        type: body.state.type,
        dirty: document.dirty !== false,
        bytes: new TextEncoder().encode(serializedBody).byteLength,
        updatedAt: now(),
      })
      const ok = withQuotaRetry(() => storage.setItem(bodyKey(localId), serializedBody), currentLocalId)
      if (!ok) return null
      if (!saveIndexEntry(entry, currentLocalId)) return null
      return localId
    },
    loadLocalDocument(localId) {
      if (!LOCAL_ID.test(localId)) return null
      try { return normalizeBody(JSON.parse(storage.getItem(bodyKey(localId)) ?? 'null')) } catch { return null }
    },
    deleteLocalDocument(localId) {
      if (!LOCAL_ID.test(localId)) return false
      try { storage.removeItem(bodyKey(localId)) } catch { return false }
      try { writeRecents(recents().filter(entry => !(entry.kind === 'local' && entry.localId === localId))); return true } catch { return false }
    },
    removeRecent(identity) {
      const remaining = recents().filter(entry => identity.localId
        ? !(entry.kind === 'local' && entry.localId === identity.localId)
        : !(entry.kind === 'alias' && entry.aliasId === identity.aliasId))
      try { writeRecents(remaining); return true } catch { return false }
    },
    clearRecents() {
      const keys = new Set(recents().filter(entry => entry.kind === 'local').map(entry => bodyKey(entry.localId)))
      if (Number.isInteger(storage.length) && typeof storage.key === 'function') {
        for (let index = 0; index < storage.length; index++) {
          const key = storage.key(index)
          if (key?.startsWith(LOCAL_DOCUMENT_PREFIX)) keys.add(key)
        }
      }
      for (const key of keys) try { storage.removeItem(key) } catch { /* best effort */ }
      try { writeRecents([]); return true } catch { return false }
    },
    migrateLegacyDraft() {
      let raw
      try { raw = storage.getItem(LEGACY_DRAFT_KEY) } catch { return null }
      if (!raw) return null
      let draft
      try { draft = JSON.parse(raw) } catch { storage.removeItem(LEGACY_DRAFT_KEY); return null }
      const localId = this.saveLocalDocument(draft)
      if (!localId) return null
      storage.removeItem(LEGACY_DRAFT_KEY)
      return localId
    },
  }
}

export const localDocumentBodyKey = bodyKey
