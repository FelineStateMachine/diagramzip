import {
  SvgNormalizationError,
  canonicalizeSvg as canonicalizeSharedSvg,
  sanitizeAndDecorateSvg as normalizeSharedSvg,
} from '../../../../shared/svg/index.js'
import { RenderError } from './errors'
import type { EngineId, RenderMetadata, RenderPresentation } from './types'

export function sanitizeAndDecorateSvg(
  source: string,
  metadata: RenderMetadata,
  presentation: RenderPresentation,
  engine: EngineId,
  rendererVersion = '',
): string {
  try {
    return normalizeSharedSvg(source, metadata, presentation, engine, rendererVersion)
  } catch (error) {
    if (error instanceof SvgNormalizationError) {
      throw new RenderError(error.status, error.code, error.message)
    }
    throw error
  }
}

export function canonicalizeSvg(
  source: string,
  metadata: RenderMetadata,
  engine: EngineId,
  rendererVersion = '',
): string {
  try {
    return canonicalizeSharedSvg(source, metadata, engine, rendererVersion)
  } catch (error) {
    if (error instanceof SvgNormalizationError) {
      throw new RenderError(error.status, error.code, error.message)
    }
    throw error
  }
}
