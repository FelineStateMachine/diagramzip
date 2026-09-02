import { squaringAdapter } from '../adapters/squaring'
import { createRendererUnit } from '../runtime/unit'

export default createRendererUnit({
  id: 'squaring',
  kind: 'render',
  adapter: squaringAdapter,
  knownLosses: ['Networks are arranged by search, so very large or non-planar networks are rejected instead of drawn.'],
})
