import renderBytefield from 'bytefield-svg'
import type { RendererAdapter } from '../../types'
import { edgeFailure, edgeResult } from './types'

const VERSION = 'bytefield-svg@1.11.0'

export const bytefieldAdapter: RendererAdapter = {
  id: 'bytefield',
  runtime: 'edge-js',
  version: VERSION,
  render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      return Promise.resolve(edgeResult('bytefield', VERSION, renderBytefield(request.source)))
    } catch (error) {
      return edgeFailure('bytefield', error)
    }
  },
}
