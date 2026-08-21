import { RenderError } from '../runtime/errors'
import type { RendererAdapter } from '../runtime/types'
import { edgeResult } from './types'
import { render as renderSvgbob } from '../../artifacts/svgbob/svgbob_wasm.js'

const VERSION = 'svgbob@0.7.6/edge-wasm-1'
const MAX_SOURCE_BYTES = 256 * 1024
const MAX_OPTION_BYTES = 256
const DEFAULTS = {
  background: 'white',
  fillColor: 'black',
  fontFamily: 'Iosevka Fixed, monospace',
  fontSize: 14,
  scale: 1,
  strokeWidth: 2,
} as const

const STRING_OPTIONS = new Set(['background', 'fill-color', 'font-family'])
const OPTION_STRIP = /[-"$/@*&=;:!\\]/g

function optionString(options: Record<string, string>, name: string, fallback: string): string {
  const value = options[name]
  if (value === undefined) return fallback
  const sanitized = value.replace(OPTION_STRIP, '')
  if (sanitized.length === 0) throw new RenderError(400, 'invalid_options', `Svgbob option '${name}' cannot be empty.`)
  if (new TextEncoder().encode(sanitized).byteLength > MAX_OPTION_BYTES) throw new RenderError(413, 'options_too_large', `Svgbob option '${name}' exceeds the 256 byte limit.`)
  return sanitized
}

function optionNumber(options: Record<string, string>, name: string, fallback: number, integer = false): number {
  const value = options[name]
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed)) || parsed <= 0 || parsed > 1000) {
    throw new RenderError(400, 'invalid_options', `Svgbob option '${name}' must be a finite positive number.`)
  }
  return parsed
}

function optionsFor(options: Record<string, string>): {
  background: string
  fillColor: string
  fontFamily: string
  fontSize: number
  scale: number
  strokeWidth: number
} {
  for (const name of Object.keys(options)) {
    if (!STRING_OPTIONS.has(name) && !['font-size', 'scale', 'stroke-width'].includes(name)) {
      throw new RenderError(400, 'unsupported_options', `Unsupported Svgbob option: ${name}.`)
    }
  }
  return {
    background: optionString(options, 'background', DEFAULTS.background),
    fillColor: optionString(options, 'fill-color', DEFAULTS.fillColor),
    fontFamily: optionString(options, 'font-family', DEFAULTS.fontFamily),
    fontSize: optionNumber(options, 'font-size', DEFAULTS.fontSize, true),
    scale: optionNumber(options, 'scale', DEFAULTS.scale),
    strokeWidth: optionNumber(options, 'stroke-width', DEFAULTS.strokeWidth),
  }
}

export const svgbobAdapter: RendererAdapter = {
  id: 'svgbob', runtime: 'edge-wasm', version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (new TextEncoder().encode(request.source).byteLength > MAX_SOURCE_BYTES) {
      throw new RenderError(413, 'source_too_large', 'Svgbob source exceeds the 256 KiB limit.')
    }
    const settings = optionsFor(request.options)
    if (signal.aborted) throw signal.reason
    try {
      const body = renderSvgbob(
        request.source,
        settings.background,
        settings.fillColor,
        settings.fontFamily,
        settings.fontSize,
        settings.scale,
        settings.strokeWidth,
      )
      if (!body.includes('<svg')) throw new RenderError(422, 'render_failed', 'Svgbob returned no SVG.')
      return edgeResult('svgbob', VERSION, body, 'edge-wasm')
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'Svgbob could not render this source.')
    }
  },
}
