import { d2Adapter } from '../adapters/edge/d2'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'd2',
  kind: 'render',
  adapter: d2Adapter,
  knownLosses: [
    'Only SVG is supported.',
    'The edge build uses official D2 v0.7.1 parser/compiler/SVG renderer with a deterministic grid layout and straight-line routing; Dagre and ELK layouts are unavailable.',
    'D2 syntax, labels, shapes, containers, steps/scenarios, and CSS edge animation are retained, but layout quality differs substantially from Dagre/ELK.',
    'The supported animation-interval option is bounded to 1–60000 milliseconds; animated edges and multi-board SVG output remain supported.',
  ],
})
