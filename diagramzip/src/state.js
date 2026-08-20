import { deflate, inflate } from 'pako'

export const HASH_VERSION = 'v1'
// Leave room below Cloudflare's 16 KB request URL ceiling.
export const MAX_IMAGE_URL_LENGTH = 15_000
export const DEFAULT_DIAGRAM_TYPE = 'plantuml'
export const DEFAULT_SOURCE = `@startuml
skinparam monochrome true
skinparam shadowing false

actor Alice
participant "Alice Agent" as AliceAgent
participant "Tandem App" as Tandem
participant "Bob Agent" as BobAgent
actor Bob

Alice -> AliceAgent: Describe a shared to-do app
AliceAgent -> Tandem: Draft the task flow
Bob -> BobAgent: Build and test the API
BobAgent -> Tandem: Ship task sync
Alice -> Tandem: Add "Buy paint"
Tandem -> Bob: Share the new task
Bob -> Tandem: Mark it done
Tandem --> Alice: Everyone is in sync
@enduml`

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64Url(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

export function encodeText(value) {
  return toBase64Url(deflate(encoder.encode(value), { level: 9 }))
}

export function decodeText(value) {
  return decoder.decode(inflate(fromBase64Url(value)))
}

export function encodeEditorHash({ type, source, options = {} }) {
  const payload = JSON.stringify({ source, options })
  return `#${HASH_VERSION}/${encodeURIComponent(type)}/${encodeText(payload)}`
}

export function decodeEditorHash(hash) {
  const [version, encodedType, payload] = hash.replace(/^#/, '').split('/')
  if (version !== HASH_VERSION || !encodedType || !payload) {
    throw new Error('Unsupported diagram.zip link.')
  }
  const state = JSON.parse(decodeText(payload))
  if (typeof state.source !== 'string' || typeof state.options !== 'object' || state.options === null || Array.isArray(state.options)) {
    throw new Error('Invalid diagram.zip link.')
  }
  return {
    type: decodeURIComponent(encodedType),
    source: state.source,
    options: state.options,
  }
}

export function imageUrl(origin, { type, source, options = {} }) {
  const url = new URL(`/${encodeURIComponent(type)}/svg/${encodeText(source)}`, origin)
  for (const [name, value] of Object.entries(options)) {
    url.searchParams.set(name, String(value))
  }
  return url.toString()
}
