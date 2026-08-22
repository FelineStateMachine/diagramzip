import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocalDocuments, LEGACY_DRAFT_KEY, LOCAL_DOCUMENT_PREFIX, RECENTS_KEY, WRITE_CAPABILITY_PREFIX } from '../src/local-documents.js'

class MemoryStorage {
  constructor(limit = Infinity) { this.values = new Map(); this.limit = limit }
  get length() { return this.values.size }
  key(index) { return [...this.values.keys()][index] ?? null }
  getItem(key) { return this.values.get(key) ?? null }
  removeItem(key) { this.values.delete(key) }
  setItem(key, value) {
    if (this.failNext) { this.failNext = false; throw new DOMException('quota', 'QuotaExceededError') }
    const next = new Map(this.values); next.set(key, String(value))
    if ([...next.values()].reduce((n, item) => n + item.length, 0) > this.limit) throw new DOMException('quota', 'QuotaExceededError')
    this.values = next
  }
}
const cryptoStub = { getRandomValues(bytes) { bytes.set([0xde, 0xad, 0xbe, 0xef].slice(0, bytes.length)); return bytes } }
const doc = (title = 'Draft') => ({ state: { type: 'd2', source: 'x', meta: { title } }, detailsSource: '{}', fileSnapshot: null, drafts: { d2: 'x' }, dirty: false })

test('creates, validates, upserts, touches, loads, and deletes local bodies', () => {
  const storage = new MemoryStorage(); const docs = createLocalDocuments({ storage, cryptoImpl: cryptoStub, now: () => 10 })
  const id = docs.saveLocalDocument(doc())
  assert.equal(id, 'l_deadbeef')
  assert.deepEqual(docs.loadLocalDocument(id), { state: doc().state, detailsSource: '{}', fileSnapshot: null, drafts: { d2: 'x' } })
  assert.equal(storage.getItem(`${LOCAL_DOCUMENT_PREFIX}${id}`).includes('dirty'), false)
  assert.equal(docs.touchRecent({ localId: id }, { title: 'Renamed' }), true)
  assert.equal(docs.loadRecents()[0].title, 'Renamed')
  assert.equal(docs.deleteLocalDocument(id), true)
  assert.equal(docs.loadLocalDocument(id), null)
  assert.deepEqual(docs.loadRecents(), [])
})

test('keeps at most 50 recent entries, ordering by updated time, and aliases have no body', () => {
  const storage = new MemoryStorage(); let clock = 0; const docs = createLocalDocuments({ storage, cryptoImpl: cryptoStub, now: () => ++clock })
  for (let i = 0; i < 55; i++) docs.upsertRecent({ kind: 'alias', aliasId: `a${i}`, title: `A${i}`, type: 'd2', mode: 'open' })
  docs.upsertRecent({ kind: 'alias', aliasId: 'locked', title: 'secret', type: 'd2', mode: 'locked' })
  assert.equal(docs.loadRecents().length, 50)
  assert.equal(docs.loadRecents()[0].title, null)
  assert.equal(docs.loadRecents()[0].type, '')
  assert.equal(storage.getItem(`${LOCAL_DOCUMENT_PREFIX}locked`), null)
})

test('ignores malformed index and bodies, and clearRecents preserves write credentials', () => {
  const storage = new MemoryStorage(); storage.setItem(RECENTS_KEY, '{bad'); storage.setItem(`${WRITE_CAPABILITY_PREFIX}a`, 'credential')
  storage.setItem(`${LOCAL_DOCUMENT_PREFIX}l_ffffffff`, JSON.stringify(doc('orphan')))
  const docs = createLocalDocuments({ storage, cryptoImpl: cryptoStub })
  assert.deepEqual(docs.loadRecents(), [])
  assert.equal(docs.loadLocalDocument('l_00000000'), null)
  docs.upsertRecent({ kind: 'alias', aliasId: 'a', title: 'A', mode: 'open', type: 'd2' })
  assert.equal(docs.clearRecents(), true)
  assert.equal(storage.getItem(`${WRITE_CAPABILITY_PREFIX}a`), 'credential')
  assert.equal(storage.getItem(`${LOCAL_DOCUMENT_PREFIX}l_ffffffff`), null)
})

test('migrates the legacy draft once into a body and index entry', () => {
  const storage = new MemoryStorage(); storage.setItem(LEGACY_DRAFT_KEY, JSON.stringify(doc('Legacy')))
  const docs = createLocalDocuments({ storage, cryptoImpl: cryptoStub, now: () => 3 })
  assert.equal(docs.migrateLegacyDraft(), 'l_deadbeef')
  assert.equal(storage.getItem(LEGACY_DRAFT_KEY), null)
  assert.equal(docs.migrateLegacyDraft(), null)
})

test('on quota evicts the oldest clean document, excluding current, and retries once', () => {
  const storage = new MemoryStorage(700); let clock = 0; const docs = createLocalDocuments({ storage, cryptoImpl: cryptoStub, now: () => ++clock })
  const first = docs.saveLocalDocument({ ...doc('one'), dirty: true })
  storage.setItem(`${WRITE_CAPABILITY_PREFIX}keep`, 'credential')
  const second = docs.saveLocalDocument({ ...doc('two'), localId: 'l_00000002' })
  assert.ok(first && second)
  storage.failNext = true
  const result = docs.saveLocalDocument({ ...doc('three'), localId: 'l_00000003' }, { currentLocalId: second })
  assert.equal(result, null)
  assert.ok(docs.loadLocalDocument(first))
  assert.equal(storage.getItem(`${WRITE_CAPABILITY_PREFIX}keep`), 'credential')
})
