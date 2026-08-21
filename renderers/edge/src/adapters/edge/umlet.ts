import { RenderError } from '../../errors'
import type { RendererAdapter } from '../../types'
import { renderUmlet } from '../../umlet'
import { edgeResult } from './types'

const VERSION = 'diagramzip-umlet-svg@1'

export const umletAdapter: RendererAdapter = {
  id: 'umlet',
  runtime: 'edge-js',
  version: VERSION,
  render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      return Promise.resolve(edgeResult('umlet', VERSION, renderUmlet(request.source)))
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'The UMLet renderer could not render this source.')
    }
  },
}
