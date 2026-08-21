import { d2Adapter } from '../adapters/edge/d2'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'd2',
  kind: 'render',
  adapter: d2Adapter,
  knownLosses: [
    'Only SVG is supported.',
    'The edge build uses D2 v0.7.1 with its official bundled Dagre layout. ELK is unavailable.',
    'The supported animation-interval option is bounded to 1–60000 milliseconds; animated edges and multi-board SVG output remain supported.',
  ],
})
