import { nomnomlAdapter } from '../adapters/edge/nomnoml'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'nomnoml',
  kind: 'render',
  adapter: nomnomlAdapter,
  knownLosses: ['Only SVG is in the rendering contract.'],
})
