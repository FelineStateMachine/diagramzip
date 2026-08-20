import { isKnownDiagramType } from './diagram-types.js'
import { normalizeMetadata, normalizePresentation } from './state.js'

export const PASSWORD_KDF_ITERATIONS = 600_000
export const MIN_PASSWORD_LENGTH = 8

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const CONTENT_AAD = encoder.encode('diagram.zip:content:v1')
const METADATA_AAD = encoder.encode('diagram.zip:metadata:v1')
const BUNDLE_KEY_AAD = encoder.encode('diagram.zip:bundle-key:v1')

function renderAad(format) {
  if (format !== 'svg' && format !== 'png') throw new Error('Invalid render format.')
  return encoder.encode(`diagram.zip:render:${format}:v1`)
}

function toBase64Url(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Invalid encrypted diagram.')
  }
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  if (toBase64Url(bytes) !== value) throw new Error('Invalid encrypted diagram.')
  return bytes
}

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length))
}

async function importAesKey(rawKey, usages) {
  if (!(rawKey instanceof Uint8Array) || rawKey.byteLength !== 32) {
    throw new Error('Invalid diagram key.')
  }
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, usages)
}

async function derivePasswordKey(password, { iterations, salt }) {
  if (typeof password !== 'string') throw new Error('Password is required.')
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations,
      salt,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function encryptBytes(bytes, key, additionalData) {
  const iv = randomBytes(12)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData, tagLength: 128 },
    key,
    bytes,
  )
  return {
    v: 1,
    alg: 'A256GCM',
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(new Uint8Array(ciphertext)),
  }
}

async function decryptBytes(blob, key, additionalData) {
  if (!blob || blob.v !== 1 || blob.alg !== 'A256GCM') throw new Error('Invalid encrypted diagram.')
  const iv = fromBase64Url(blob.iv)
  if (iv.byteLength !== 12) throw new Error('Invalid encrypted diagram.')
  const ciphertext = fromBase64Url(blob.ciphertext)
  if (ciphertext.byteLength < 16) throw new Error('Invalid encrypted diagram.')
  return new Uint8Array(await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData, tagLength: 128 },
    key,
    ciphertext,
  ))
}

async function encryptJson(value, key, additionalData) {
  return encryptBytes(encoder.encode(JSON.stringify(value)), key, additionalData)
}

async function decryptJson(blob, key, additionalData) {
  return JSON.parse(decoder.decode(await decryptBytes(blob, key, additionalData)))
}

function normalizedState(diagram, metadata) {
  if (!diagram || typeof diagram !== 'object'
    || !isKnownDiagramType(diagram.type)
    || typeof diagram.source !== 'string'
    || !diagram.options || typeof diagram.options !== 'object' || Array.isArray(diagram.options)) {
    throw new Error('Invalid encrypted diagram.')
  }
  return {
    type: diagram.type,
    source: diagram.source,
    options: diagram.options,
    presentation: normalizePresentation(diagram.presentation),
    meta: normalizeMetadata(metadata),
  }
}

export async function wrapBundleKey(bundleKey, password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
  const salt = randomBytes(16)
  const kdf = {
    name: 'PBKDF2',
    hash: 'SHA-256',
    iterations: PASSWORD_KDF_ITERATIONS,
    salt: toBase64Url(salt),
  }
  const passwordKey = await derivePasswordKey(password, { iterations: kdf.iterations, salt })
  return {
    v: 1,
    kdf,
    wrap: await encryptBytes(bundleKey, passwordKey, BUNDLE_KEY_AAD),
  }
}

export async function unwrapBundleKey(keyEnvelope, password) {
  if (!keyEnvelope || keyEnvelope.v !== 1
    || keyEnvelope.kdf?.name !== 'PBKDF2'
    || keyEnvelope.kdf.hash !== 'SHA-256'
    || !Number.isInteger(keyEnvelope.kdf.iterations)
    || keyEnvelope.kdf.iterations < 100_000
    || keyEnvelope.kdf.iterations > 5_000_000) {
    throw new Error('Invalid encrypted diagram.')
  }
  const salt = fromBase64Url(keyEnvelope.kdf.salt)
  if (salt.byteLength !== 16) throw new Error('Invalid encrypted diagram.')
  const passwordKey = await derivePasswordKey(password, {
    iterations: keyEnvelope.kdf.iterations,
    salt,
  })
  const bundleKey = await decryptBytes(keyEnvelope.wrap, passwordKey, BUNDLE_KEY_AAD)
  if (bundleKey.byteLength !== 32) throw new Error('Invalid encrypted diagram.')
  return bundleKey
}

export async function encryptLockedState(state, bundleKey, keyEnvelope) {
  const normalized = normalizedState({
    type: state.type,
    source: state.source,
    options: state.options ?? {},
    presentation: state.presentation,
  }, state.meta)
  const key = await importAesKey(bundleKey, ['encrypt'])
  const encryptedContent = await encryptJson({
    type: normalized.type,
    source: normalized.source,
    options: normalized.options,
    presentation: normalized.presentation,
  }, key, CONTENT_AAD)
  const encryptedMetadata = await encryptJson(normalized.meta, key, METADATA_AAD)
  return { mode: 'locked', encryptedContent, encryptedMetadata, keyEnvelope }
}

export async function createLockedState(state, password) {
  const bundleKey = randomBytes(32)
  const keyEnvelope = await wrapBundleKey(bundleKey, password)
  return {
    bundleKey,
    payload: await encryptLockedState(state, bundleKey, keyEnvelope),
  }
}

export async function unlockLockedAlias(alias, password) {
  if (!alias || alias.mode !== 'locked') throw new Error('Invalid encrypted diagram.')
  try {
    const bundleKey = await unwrapBundleKey(alias.keyEnvelope, password)
    const key = await importAesKey(bundleKey, ['decrypt'])
    const [diagram, metadata] = await Promise.all([
      decryptJson(alias.encryptedContent, key, CONTENT_AAD),
      decryptJson(alias.encryptedMetadata, key, METADATA_AAD),
    ])
    return { bundleKey, state: normalizedState(diagram, metadata) }
  } catch {
    throw new Error('Wrong password or damaged diagram.')
  }
}

export async function encryptLockedRender(blob, bundleKey, format) {
  if (!(blob instanceof Blob)) throw new Error('Invalid rendered image.')
  const key = await importAesKey(bundleKey, ['encrypt'])
  return encryptBytes(new Uint8Array(await blob.arrayBuffer()), key, renderAad(format))
}

export async function decryptLockedRender(encryptedRender, bundleKey, format) {
  const key = await importAesKey(bundleKey, ['decrypt'])
  const mediaType = format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : null
  if (!mediaType) throw new Error('Invalid render format.')
  return new Blob([await decryptBytes(encryptedRender, key, renderAad(format))], { type: mediaType })
}
