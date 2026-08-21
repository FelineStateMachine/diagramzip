import { compile, type TopLevelSpec } from 'vega-lite'
import { RenderError } from '../runtime/errors'
import type { RendererAdapter } from '../runtime/types'
import { containsUrl, parsedSpecification, renderVegaSpecification } from './vega-common'
import { edgeFailure, edgeResult } from './types'

const VERSION = 'vega-lite@6.4.3'

const viewKeys = ['mark', 'layer', 'facet', 'repeat', 'concat', 'hconcat', 'vconcat']

export const vegaliteAdapter: RendererAdapter = {
  id: 'vegalite',
  runtime: 'edge-js',
  version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      const input = parsedSpecification(request.source)
      if (!viewKeys.some(name => name in input)) {
        throw new RenderError(422, 'render_failed', 'Vega-Lite source has no top-level view specification.')
      }
      if (containsUrl(input)) {
        throw new RenderError(422, 'unsafe_include', 'URL-backed Vega data and images are disabled; embed data as values.')
      }
      return edgeResult('vegalite', VERSION, await renderVegaSpecification(compile(input as unknown as TopLevelSpec).spec))
    } catch (error) {
      return edgeFailure('vegalite', error)
    }
  },
}
