import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createLockedState,
  decryptLockedRender,
  encryptLockedRender,
  encryptLockedState,
  unlockLockedAlias,
  unwrapBundleKey,
  wrapBundleKey,
} from '../src/encryption.js'

const state = {
  type: 'd2',
  source: 'a -> b',
  options: { theme: 200 },
  meta: { title: 'Private map', description: 'Secret topology.' },
  presentation: { background: '#ffffff', padding: 16, frame: true },
}

test('encrypts and unlocks a diagram with no plaintext in the payload', async () => {
  const { bundleKey, payload } = await createLockedState(state, 'correct horse battery staple')
  assert.equal(payload.mode, 'locked')
  assert.equal(JSON.stringify(payload).includes(state.source), false)
  assert.equal(JSON.stringify(payload).includes(state.meta.title), false)

  const unlocked = await unlockLockedAlias(payload, 'correct horse battery staple')
  assert.deepEqual(unlocked.state, state)
  assert.deepEqual(unlocked.bundleKey, bundleKey)
})

test('rejects the wrong password', async () => {
  const { payload } = await createLockedState(state, 'correct horse battery staple')
  await assert.rejects(unlockLockedAlias(payload, 'incorrect password'), /Wrong password/)
})

test('uses fresh IVs when encrypting the same state', async () => {
  const { bundleKey, payload } = await createLockedState(state, 'correct horse battery staple')
  const next = await encryptLockedState(state, bundleKey, payload.keyEnvelope)
  assert.notEqual(next.encryptedContent.iv, payload.encryptedContent.iv)
  assert.notEqual(next.encryptedMetadata.iv, payload.encryptedMetadata.iv)
})

test('changes a password by rewrapping only the bundle key', async () => {
  const { bundleKey, payload } = await createLockedState(state, 'correct horse battery staple')
  const encryptedContent = structuredClone(payload.encryptedContent)
  const encryptedMetadata = structuredClone(payload.encryptedMetadata)
  const keyEnvelope = await wrapBundleKey(bundleKey, 'a completely different password')
  await assert.rejects(unwrapBundleKey(keyEnvelope, 'correct horse battery staple'))
  assert.deepEqual(await unwrapBundleKey(keyEnvelope, 'a completely different password'), bundleKey)
  assert.deepEqual(payload.encryptedContent, encryptedContent)
  assert.deepEqual(payload.encryptedMetadata, encryptedMetadata)
})

test('encrypts a cached image with the same diagram bundle key', async () => {
  const { bundleKey } = await createLockedState(state, 'correct horse battery staple')
  const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], { type: 'image/svg+xml' })
  const encrypted = await encryptLockedRender(svg, bundleKey, 'svg')
  assert.equal(JSON.stringify(encrypted).includes('<svg'), false)
  const decrypted = await decryptLockedRender(encrypted, bundleKey, 'svg')
  assert.equal(decrypted.type, 'image/svg+xml')
  assert.equal(await decrypted.text(), await svg.text())
})
