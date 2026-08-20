import { vegaAdapter } from '../adapters/edge/vega'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'vega',
  kind: 'render',
  adapter: vegaAdapter,
  knownLosses: ['URL-backed data and images are rejected; data must be embedded as values.', 'Only SVG is in the rendering contract.'],
})
