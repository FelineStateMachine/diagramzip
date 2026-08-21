import { pikchrAdapter } from '../adapters/pikchr'
import { createRendererUnit } from '../runtime/unit'

export default createRendererUnit({
  id: 'pikchr', kind: 'render', adapter: pikchrAdapter,
  knownLosses: [
    'Only SVG is supported.',
    'Pikchr image/resource loading and renderer options are not exposed in the edge unit.',
    'Compiled from the pinned Kroki Pikchr source revision 85e65b968651b342c46e6334f4772b45d6cbb4317c5cbaa95d207779a50c6709.',
  ],
})
