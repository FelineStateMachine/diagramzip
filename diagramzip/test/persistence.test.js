import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aliasIdFromPath,
  editAliasUrl,
  generateWriteCapability,
  PersistenceClient,
  PersistenceError,
  readAliasUrl,
  stableRenderUrl,
  writeCapabilityFromHash,
} from '../src/persistence.js'

const aliasId = 'AbCdEfGhIjKlMnOp'
const writeCapability = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const state = {
  type: 'd2',
  source: 'a -> b',
  options: {},
  meta: { title: 'A to B', description: '' },
  presentation: { background: '', padding: 0, frame: false },
}
const encryptedBlob = {
  v: 1,
  alg: 'A256GCM',
  iv: 'AAAAAAAAAAAAAAAA',
  ciphertext: 'AAAAAAAAAAAAAAAAAAAAAA',
}
const lockedPayload = {
  mode: 'locked',
  encryptedContent: encryptedBlob,
  encryptedMetadata: { ...encryptedBlob, iv: 'BBBBBBBBBBBBBBBB' },
  keyEnvelope: {
    v: 1,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 600_000,
      salt: 'AAAAAAAAAAAAAAAAAAAAAA',
    },
    wrap: { ...encryptedBlob, iv: 'CCCCCCCCCCCCCCCC' },
  },
}

function response(overrides = {}) {
  return {
    aliasId,
    contentId: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    renderId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    revision: 1,
    mode: 'open',
    metadata: state.meta,
    diagram: {
      type: state.type,
      source: state.source,
      options: state.options,
      presentation: state.presentation,
    },
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

test('builds short read and capability-bearing edit links', () => {
  assert.equal(aliasIdFromPath(`/d/${aliasId}`), aliasId)
  assert.equal(aliasIdFromPath('/'), null)
  assert.equal(readAliasUrl('https://diagram.zip', aliasId), `https://diagram.zip/d/${aliasId}`)
  assert.equal(editAliasUrl('https://diagram.zip', aliasId, writeCapability), `https://diagram.zip/d/${aliasId}#w=${writeCapability}`)
  assert.equal(stableRenderUrl('https://diagram.zip', aliasId), `https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg`)
  assert.equal(writeCapabilityFromHash(`#w=${writeCapability}`), writeCapability)
})

test('generates a 256-bit Base64URL write capability', () => {
  const first = generateWriteCapability()
  const second = generateWriteCapability()
  assert.match(first, /^[A-Za-z0-9_-]{43}$/)
  assert.notEqual(first, second)
})

test('creates an alias without putting the capability in the body', async () => {
  let captured
  const client = new PersistenceClient({
    origin: 'https://diagram.zip',
    fetchImpl: async (url, init) => {
      captured = { url: url.toString(), init }
      return Response.json(response(), { status: 201 })
    },
  })
  const result = await client.createAlias(state)
  assert.equal(captured.url, 'https://diagram.zip/api/v1/aliases')
  assert.match(captured.init.headers.Authorization, /^Bearer [A-Za-z0-9_-]{43}$/)
  assert.equal(captured.init.body.includes(captured.init.headers.Authorization.slice(7)), false)
  assert.equal(result.state.source, state.source)
  assert.match(result.writeCapability, /^[A-Za-z0-9_-]{43}$/)
})

test('updates an alias with a quoted revision and capability', async () => {
  let captured
  const client = new PersistenceClient({
    fetchImpl: async (url, init) => {
      captured = { url: url.toString(), init }
      return Response.json(response({ revision: 2 }))
    },
  })
  const result = await client.updateAlias(aliasId, state, 1, writeCapability)
  assert.equal(captured.url, `http://localhost/api/v1/aliases/${aliasId}`)
  assert.equal(captured.init.headers.Authorization, `Bearer ${writeCapability}`)
  assert.equal(captured.init.headers['If-Match'], '"1"')
  assert.equal(result.revision, 2)
})

test('creates a locked alias without plaintext diagram fields', async () => {
  let captured
  const client = new PersistenceClient({
    fetchImpl: async (url, init) => {
      captured = { url: url.toString(), init }
      return Response.json(response({
        ...lockedPayload,
        diagram: undefined,
        metadata: undefined,
      }), { status: 201 })
    },
  })
  const result = await client.createLockedAlias(lockedPayload)
  const body = JSON.parse(captured.init.body)
  assert.equal(body.mode, 'locked')
  assert.equal('diagram' in body, false)
  assert.equal('metadata' in body, false)
  assert.deepEqual(result.encryptedContent, lockedPayload.encryptedContent)
  assert.match(result.writeCapability, /^[A-Za-z0-9_-]{43}$/)
})

test('updates a locked alias with revision and capability headers', async () => {
  let captured
  const client = new PersistenceClient({
    fetchImpl: async (url, init) => {
      captured = { url: url.toString(), init }
      return Response.json(response({
        ...lockedPayload,
        diagram: undefined,
        metadata: undefined,
        revision: 2,
      }))
    },
  })
  const result = await client.updateLockedAlias(aliasId, lockedPayload, 1, writeCapability)
  assert.equal(captured.init.headers.Authorization, `Bearer ${writeCapability}`)
  assert.equal(captured.init.headers['If-Match'], '"1"')
  assert.equal(result.mode, 'locked')
  assert.equal(result.revision, 2)
})

test('uploads an open content-addressed render', async () => {
  let captured
  const client = new PersistenceClient({
    fetchImpl: async (url, init) => {
      captured = { url: url.toString(), init }
      return new Response(null, { status: 204 })
    },
  })
  const svg = new Blob(['<svg/>'], { type: 'image/svg+xml' })
  await client.uploadRender({
    aliasId,
    renderId: writeCapability,
    revision: 2,
    writeCapability,
    format: 'svg',
    mode: 'open',
    render: svg,
  })
  assert.equal(captured.url, `http://localhost/api/v1/aliases/${aliasId}/renders/svg`)
  assert.equal(captured.init.headers['If-Match'], '"2"')
  assert.equal(captured.init.headers['X-Render-Id'], writeCapability)
  assert.equal(captured.init.headers['Content-Type'], 'image/svg+xml')
  assert.equal(captured.init.body, svg)
})

test('uploads and retrieves an opaque locked render', async () => {
  const requests = []
  const client = new PersistenceClient({
    fetchImpl: async (url, init) => {
      requests.push({ url: url.toString(), init })
      if (init?.method === 'PUT') return new Response(null, { status: 204 })
      return Response.json(encryptedBlob)
    },
  })
  await client.uploadRender({
    aliasId,
    renderId: writeCapability,
    revision: 1,
    writeCapability,
    format: 'png',
    mode: 'locked',
    render: encryptedBlob,
  })
  assert.equal(requests[0].init.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(requests[0].init.body), encryptedBlob)
  assert.deepEqual(await client.getEncryptedRender(aliasId, 'png'), encryptedBlob)
  assert.equal(requests[1].url, `http://localhost/api/v1/aliases/${aliasId}/renders/png?encrypted=1`)
})

test('surfaces structured persistence errors', async () => {
  const client = new PersistenceClient({
    fetchImpl: async () => Response.json({
      error: { code: 'revision_conflict', message: 'The alias changed.' },
    }, { status: 412 }),
  })
  await assert.rejects(
    client.updateAlias(aliasId, state, 1, writeCapability),
    error => error instanceof PersistenceError && error.status === 412 && error.code === 'revision_conflict',
  )
})
