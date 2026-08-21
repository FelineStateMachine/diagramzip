import { RequestError } from './validation'

const aliasPattern = /^[A-Za-z0-9_-]{16}$/
const capabilityPattern = /^[A-Za-z0-9_-]{43}$/

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

export function isAliasId(value: string): boolean {
  return aliasPattern.test(value)
}

export function randomAliasId(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(12)))
}

export async function sha256(bytes: ArrayBuffer | ArrayBufferView): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
}

export async function contentId(bytes: Uint8Array): Promise<{ id: string; digest: Uint8Array }> {
  const digest = await sha256(bytes)
  return { id: base64Url(digest), digest }
}

export async function writeCapabilityHash(request: Request): Promise<Uint8Array> {
  const authorization = request.headers.get('Authorization')
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)
  if (!match?.[1] || !capabilityPattern.test(match[1])) {
    throw new RequestError(401, 'write_capability_required', 'A valid write capability is required.')
  }
  let capability: Uint8Array
  try {
    capability = decodeBase64Url(match[1])
  } catch {
    throw new RequestError(401, 'write_capability_required', 'A valid write capability is required.')
  }
  if (capability.byteLength !== 32 || base64Url(capability) !== match[1]) {
    throw new RequestError(401, 'write_capability_required', 'A valid write capability is required.')
  }
  return sha256(capability)
}

export function capabilityMatches(provided: Uint8Array, stored: ArrayBuffer): boolean {
  const expected = new Uint8Array(stored)
  return expected.byteLength === 32 && crypto.subtle.timingSafeEqual(provided, expected)
}
