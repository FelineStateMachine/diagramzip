import { bytefieldAdapter } from '../adapters/edge/bytefield'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'bytefield',
  kind: 'render',
  adapter: bytefieldAdapter,
  knownLosses: ['Only SVG is in the rendering contract.'],
})
