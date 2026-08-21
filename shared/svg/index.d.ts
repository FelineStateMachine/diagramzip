export const SVG_SCHEMA: '1'
export const NORMALIZER_BUILD: 'svg-normalizer-2'
export const MATERIALIZER_BUILD: 'svg-materializer-1'
export const PALETTE_BUILD: 'diagramzip-palette-1'
export const RAW_PROFILE: 'safe-raw-1'
export const APPEARANCES: readonly [
  'raw',
  'auto-transparent',
  'light-transparent',
  'dark-transparent',
  'auto-framed',
  'light-framed',
  'dark-framed',
]
export interface NormalizationCapability {
  readonly schema: string
  readonly normalizer: string
  readonly profile: string
  readonly palette: string
  readonly conformance: 'raw' | 'semantic' | 'adaptive' | 'presentation-only' | 'unsupported'
  readonly appearances: readonly string[]
  readonly limitations?: readonly string[]
}
export const RAW_NORMALIZATION: NormalizationCapability
export function normalizationFor(engine: string, rendererVersion?: string): NormalizationCapability

export class SvgNormalizationError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string)
}

export interface SvgMetadata {
  title: string
  description: string
}

export interface SvgPresentation {
  background: string
  padding: number
  frame: boolean
}

export function sanitizeAndDecorateSvg(
  source: string,
  metadata: SvgMetadata,
  presentation: SvgPresentation,
  engine: string,
  rendererVersion?: string,
): string

export function canonicalizeSvg(
  source: string,
  metadata: SvgMetadata,
  engine: string,
  rendererVersion?: string,
): string

export function materializePresentation(
  canonical: string,
  presentation: SvgPresentation,
): string

export type SvgAppearance = typeof APPEARANCES[number]
export function materializeSvg(canonical: string, appearance: SvgAppearance): string
