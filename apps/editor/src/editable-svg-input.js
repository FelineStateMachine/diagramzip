import { importEditableSvg } from './editable-svg.js'

export const MAX_EDITABLE_SVG_INPUT_BYTES = 5 * 1024 * 1024

const encoder = new TextEncoder()
const SVG_CONTENT_TYPE = /^(?:image\/svg\+xml|application\/(?:xml|svg\+xml)|text\/xml)(?:\s*;|\s*$)/i

export class EditableSvgInputError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'EditableSvgInputError'
    this.code = code
  }
}

function fail(code, message) {
  throw new EditableSvgInputError(code, message)
}

function assertWithinLimit(bytes, label = 'Editable SVG') {
  if (bytes.byteLength > MAX_EDITABLE_SVG_INPUT_BYTES) {
    fail('input_too_large', `${label} is larger than 5 MiB.`)
  }
  return bytes
}

function decode(bytes) {
  return new TextDecoder().decode(assertWithinLimit(bytes))
}

async function bytesFromResponse(response) {
  const contentType = response.headers?.get?.('content-type') ?? ''
  if (contentType && !SVG_CONTENT_TYPE.test(contentType)) {
    fail('invalid_content_type', 'The URL did not return an SVG or XML document.')
  }

  if (response.body?.getReader) {
    const reader = response.body.getReader()
    const chunks = []
    let length = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = value instanceof Uint8Array ? value : new Uint8Array(value)
        length += chunk.byteLength
        if (length > MAX_EDITABLE_SVG_INPUT_BYTES) {
          await reader.cancel().catch(() => {})
          fail('input_too_large', 'The downloaded SVG is larger than 5 MiB.')
        }
        chunks.push(chunk)
      }
    } finally {
      reader.releaseLock?.()
    }
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    return bytes
  }

  if (typeof response.arrayBuffer === 'function') {
    return assertWithinLimit(new Uint8Array(await response.arrayBuffer()), 'The downloaded SVG')
  }
  if (typeof response.text === 'function') return encoder.encode(await response.text())
  fail('invalid_response', 'The URL response did not contain readable SVG data.')
}

export function importEditableSvgText(source) {
  if (typeof source !== 'string') fail('invalid_input', 'Editable SVG input must be text.')
  assertWithinLimit(encoder.encode(source))
  return importEditableSvg(source)
}

export async function importEditableSvgFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    fail('invalid_input', 'Editable SVG input must be a File or Blob.')
  }
  if (Number.isFinite(file.size) && file.size > MAX_EDITABLE_SVG_INPUT_BYTES) {
    fail('input_too_large', 'The selected SVG is larger than 5 MiB.')
  }
  return importEditableSvg(decode(new Uint8Array(await file.arrayBuffer())))
}

export async function importEditableSvgInput(input, { fetchImpl = globalThis.fetch } = {}) {
  if (typeof input !== 'string') return importEditableSvgFile(input)
  let url
  try {
    url = new URL(input)
  } catch {
    return importEditableSvgText(input)
  }
  if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
    fail('invalid_url', 'Editable SVG URLs must use HTTP(S) or data: URLs.')
  }
  if (typeof fetchImpl !== 'function') fail('fetch_unavailable', 'URL import is unavailable in this browser.')
  let response
  try {
    response = await fetchImpl(url.toString())
  } catch (error) {
    fail('fetch_failed', error instanceof Error ? error.message : 'Could not download the SVG.')
  }
  if (!response?.ok) fail('fetch_failed', `The SVG URL returned HTTP ${response?.status ?? 'an error'}.`)
  return importEditableSvg(decode(await bytesFromResponse(response)))
}

