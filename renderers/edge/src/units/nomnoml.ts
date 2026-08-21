import { nomnomlAdapter } from '../adapters/nomnoml'
import { createRendererUnit } from '../runtime/unit'

export default createRendererUnit({
  id: 'nomnoml',
  kind: 'render',
  adapter: nomnomlAdapter,
  knownLosses: ['Only SVG is in the rendering contract.'],
})
