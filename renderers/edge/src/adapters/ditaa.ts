import { RenderError } from '../runtime/errors'
import type { RendererAdapter } from '../runtime/types'
import { render as renderSvgbob } from '../../artifacts/svgbob/svgbob_wasm.js'
import { edgeResult } from './types'

// Ditaa's maintained distribution is a native/Java application.  This adapter
// intentionally implements the portable part of the format: ASCII geometry,
// labels, and the common connector characters.  The resulting source is fed
// to the already edge-native svgbob renderer so there is no second runtime.
const VERSION = 'ditaa-ascii-via-svgbob@0.7.6/edge-wasm-1'
const MAX_SOURCE_BYTES = 256 * 1024
const MAX_OPTION_BYTES = 256
const COLOR = /^(?:#[0-9a-f]{3,8}|[a-z]+|transparent)$/i
const DITAA_TAG = /\{([a-z][a-z0-9_-]{0,15})\}/gi
const SHAPE_TAGS = new Set(['d', 's', 'io', 'tr', 'o', 'r', 'db', 'mo', 'cloud', 'document', 'storage', 'input', 'output'])
const OPTION_NAMES = new Set([
  'scale', 'tabs', 'background', 'transparent',
  'no-antialias', 'no-separation', 'round-corners', 'no-shadows',
])

export const DITAA_KNOWN_LOSSES = [
  'Ditaa shape tags ({d}, {s}, {io}, and related tags) are removed but their shapes are not translated.',
  'Ditaa color tags ({cXXX}) are removed; edge output uses the svgbob monochrome style.',
  'Ditaa shadows, rounded corners, anti-aliasing, and edge separation are not available in the svgbob pipeline.',
] as const

function optionNumber(options: Record<string, string>, name: string, fallback: number, maximum: number, integer = false): number {
  const value = options[name]
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > maximum || (integer && !Number.isInteger(parsed))) {
    throw new RenderError(400, 'invalid_options', `Ditaa option '${name}' must be a finite positive number.`)
  }
  return parsed
}

function optionColor(options: Record<string, string>): string {
  if (Object.hasOwn(options, 'transparent')) return 'transparent'
  const raw = options.background
  if (raw === undefined) return 'transparent'
  const value = /^[0-9a-f]{6}$/i.test(raw) ? `#${raw}` : raw
  if (!COLOR.test(value) || new TextEncoder().encode(value).byteLength > MAX_OPTION_BYTES) {
    throw new RenderError(400, 'invalid_options', "Ditaa option 'background' must be a CSS color or six hexadecimal digits.")
  }
  return value
}

function normalizeSource(source: string, options: Record<string, string>): string {
  const tabs = optionNumber(options, 'tabs', 8, 32, true)
  const expanded = source.replaceAll('\t', ' '.repeat(tabs))
  // Ditaa tags are drawing directives, not labels.  Dropping them retains the
  // readable label and prevents svgbob from treating braces as geometry.
  return expanded.replace(DITAA_TAG, (whole, name: string) => {
    const normalized = name.toLowerCase()
    // Keep brace-delimited label text that is not a known Ditaa directive.
    if (SHAPE_TAGS.has(normalized) || /^c(?:[a-z]{3}|[0-9a-f]{3,6})$/i.test(name)) return ''
    return whole
  })
}

export const ditaaAdapter: RendererAdapter = {
  id: 'ditaa', runtime: 'edge-wasm', version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (new TextEncoder().encode(request.source).byteLength > MAX_SOURCE_BYTES) {
      throw new RenderError(413, 'source_too_large', 'Ditaa source exceeds the 256 KiB limit.')
    }
    for (const name of Object.keys(request.options)) {
      if (!OPTION_NAMES.has(name)) throw new RenderError(400, 'unsupported_options', `Unsupported Ditaa option: ${name}.`)
    }
    const source = normalizeSource(request.source, request.options)
    const scale = optionNumber(request.options, 'scale', 1, 16)
    const background = optionColor(request.options)
    try {
      const body = renderSvgbob(source, background, '#000000', 'Iosevka Fixed, monospace', 14, scale, 2)
      if (!body.includes('<svg')) throw new RenderError(422, 'render_failed', 'Ditaa returned no SVG.')
      return edgeResult('ditaa', VERSION, body, 'edge-wasm')
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'Ditaa could not render this source.')
    }
  },
}
