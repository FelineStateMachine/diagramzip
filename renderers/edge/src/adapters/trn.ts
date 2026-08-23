import type { RendererAdapter } from '../runtime/types'
import { RenderError } from '../runtime/errors'
import { parseTrn } from '../languages/trn'
import { renderTrn } from '../languages/trn-renderer'
import { edgeFailure, edgeResult } from './types'

const VERSION = 'diagramzip-trn@13'

function validateOptions(options: Record<string, string>): void {
  for (const name of Object.keys(options)) {
    throw new RenderError(400, 'unsupported_options', `Unsupported TRN option: ${name}.`)
  }
}

export const trnAdapter: RendererAdapter = {
  id: 'trn',
  runtime: 'edge-js',
  version: VERSION,
  render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      validateOptions(request.options)
      return Promise.resolve(edgeResult('trn', VERSION, renderTrn(parseTrn(request.source))))
    } catch (error) {
      return edgeFailure('trn', error)
    }
  },
}
