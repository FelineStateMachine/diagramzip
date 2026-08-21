import {
  SvgNormalizationError,
  sanitizeAndDecorateSvg as normalizeSharedSvg,
} from '../../diagramzip-svg/index.js'
import { RenderError } from './errors'
import type { EngineId, RenderMetadata, RenderPresentation } from './types'

export function sanitizeAndDecorateSvg(
  source: string,
  metadata: RenderMetadata,
  presentation: RenderPresentation,
  engine: EngineId,
): string {
  try {
    return normalizeSharedSvg(source, metadata, presentation, engine)
  } catch (error) {
    if (error instanceof SvgNormalizationError) {
      throw new RenderError(error.status, error.code, error.message)
    }
    throw error
  }
}
