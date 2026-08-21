import { renderSvg } from 'nomnoml'
import type { RendererAdapter } from '../../types'
import { edgeFailure, edgeResult } from './types'

const VERSION = 'nomnoml@1.7.0'

export const nomnomlAdapter: RendererAdapter = {
  id: 'nomnoml',
  runtime: 'edge-js',
  version: VERSION,
  render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      return Promise.resolve(edgeResult('nomnoml', VERSION, renderSvg(request.source)))
    } catch (error) {
      return edgeFailure('nomnoml', error)
    }
  },
}
