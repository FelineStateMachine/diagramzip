import { trnAdapter } from '../adapters/trn'
import { createRendererUnit } from '../runtime/unit'

export default createRendererUnit({
  id: 'trn',
  kind: 'render',
  adapter: trnAdapter,
  knownLosses: ['The source selects one layout; the SVG does not embed an interactive layout toggle.'],
})
