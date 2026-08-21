import type { Spec } from 'vega'
import { RenderError } from '../runtime/errors'
import type { RendererAdapter } from '../runtime/types'
import { containsUrl, parsedSpecification, renderVegaSpecification } from './vega-common'
import { edgeFailure, edgeResult } from './types'

const VERSION = 'vega@6.3.1'

export const vegaAdapter: RendererAdapter = {
  id: 'vega',
  runtime: 'edge-js',
  version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      const specification = parsedSpecification(request.source)
      if (containsUrl(specification)) {
        throw new RenderError(422, 'unsafe_include', 'URL-backed Vega data and images are disabled; embed data as values.')
      }
      return edgeResult('vega', VERSION, await renderVegaSpecification(specification as Spec))
    } catch (error) {
      return edgeFailure('vega', error)
    }
  },
}
