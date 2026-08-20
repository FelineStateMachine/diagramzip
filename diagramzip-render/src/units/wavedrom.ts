import { wavedromAdapter } from '../adapters/edge/wavedrom'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'wavedrom',
  kind: 'render',
  adapter: wavedromAdapter,
  knownLosses: ['Only the six bundled Kroki skins are accepted.', 'Only SVG is in the rendering contract.'],
})
