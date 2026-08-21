import { bytefieldAdapter } from '../adapters/bytefield'
import { createRendererUnit } from '../runtime/unit'

export default createRendererUnit({
  id: 'bytefield',
  kind: 'render',
  adapter: bytefieldAdapter,
  knownLosses: ['Only SVG is in the rendering contract.'],
})
