import { ditaaAdapter, DITAA_KNOWN_LOSSES } from '../adapters/ditaa'
import { svgbobAdapter } from '../adapters/svgbob'
import { createRendererUnitGroup } from '../runtime/unit'

export default createRendererUnitGroup('svgbob-family', [
  {
    id: 'svgbob', kind: 'render', adapter: svgbobAdapter,
    knownLosses: [
      'Only SVG is supported.',
      'Kroki stroke-color is not exposed in the edge unit; the pure upstream library does not load external images or resources.',
      'Compiled from upstream svgbob 0.7.6 at commit 04a9d85c4b1879051f205e9e434e058864c3d36f.',
    ],
  },
  {
    id: 'ditaa', kind: 'translate', adapter: ditaaAdapter, pipeline: ['svgbob'],
    knownLosses: ['Only SVG is supported.', ...DITAA_KNOWN_LOSSES],
  },
])
