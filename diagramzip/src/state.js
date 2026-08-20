import { deflate, inflate } from 'pako'

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

export function normalizeMetadata(meta = {}) {
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    throw new Error('Invalid diagram metadata.')
  }
  const title = meta.title ?? ''
  const description = meta.description ?? ''
  if (typeof title !== 'string' || typeof description !== 'string') {
    throw new Error('Invalid diagram metadata.')
  }
  return { title, description }
}

export function normalizePresentation(presentation = {}) {
  if (typeof presentation !== 'object' || presentation === null || Array.isArray(presentation)) {
    throw new Error('Invalid diagram presentation.')
  }
  const background = presentation.background ?? ''
  const padding = presentation.padding ?? 0
  const frame = presentation.frame ?? false
  if (typeof background !== 'string' || (background && !/^#[0-9a-f]{6}$/i.test(background))) {
    throw new Error('Invalid diagram presentation.')
  }
  if (!Number.isInteger(padding) || padding < 0 || padding > 256 || typeof frame !== 'boolean') {
    throw new Error('Invalid diagram presentation.')
  }
  return { background, padding, frame }
}

function hasMetadata(meta) {
  return Boolean(meta.title || meta.description)
}

function hasPresentation(presentation) {
  return Boolean(presentation.background || presentation.padding || presentation.frame)
}

export function imageUrl(origin, { type, source, options = {}, meta = {}, presentation = {} }) {
  const url = new URL(`/${encodeURIComponent(type)}/svg/${encodeText(source)}`, origin)
  for (const [name, value] of Object.entries(options)) {
    url.searchParams.set(name, String(value))
  }
  const normalizedMeta = normalizeMetadata(meta)
  const normalizedPresentation = normalizePresentation(presentation)
  if (hasMetadata(normalizedMeta) || hasPresentation(normalizedPresentation)) {
    const payload = {}
    if (hasMetadata(normalizedMeta)) payload.meta = normalizedMeta
    if (hasPresentation(normalizedPresentation)) payload.presentation = normalizedPresentation
    url.searchParams.set('dz', encodeText(JSON.stringify(payload)))
  }
  return url.toString()
}
