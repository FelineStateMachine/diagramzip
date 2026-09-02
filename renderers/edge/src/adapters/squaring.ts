import type { RendererAdapter } from '../runtime/types'
import { RenderError } from '../runtime/errors'
import { parseSquaring } from '../languages/squaring'
import { buildSquaring } from '../languages/squaring-model'
import { renderSquaring } from '../languages/squaring-renderer'
import { edgeFailure, edgeResult } from './types'

const VERSION = 'diagramzip-squaring@3'

function validateOptions(options: Record<string, string>): void {
  for (const name of Object.keys(options)) {
    throw new RenderError(400, 'unsupported_options', `Unsupported squaring option: ${name}.`)
  }
}

export const squaringAdapter: RendererAdapter = {
  id: 'squaring',
  runtime: 'edge-js',
  version: VERSION,
  render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      validateOptions(request.options)
      const document = parseSquaring(request.source)
      return Promise.resolve(edgeResult('squaring', VERSION, renderSquaring(document, buildSquaring(document))))
    } catch (error) {
      return edgeFailure('squaring', error)
    }
  },
}
