import { wavedromAdapter } from '../adapters/wavedrom'
import { createRendererUnit } from '../runtime/unit'

export default createRendererUnit({
  id: 'wavedrom',
  kind: 'render',
  adapter: wavedromAdapter,
  knownLosses: ['Only the six bundled Kroki skins are accepted.', 'Only SVG is in the rendering contract.'],
})
