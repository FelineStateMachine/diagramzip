import { plantumlFamilyAdapter } from '../adapters/edge/plantuml-family'
import { createRendererUnitGroup } from '../unit'

export default createRendererUnitGroup('plantuml-family', [
  {
    id: 'plantuml', kind: 'render', adapter: plantumlFamilyAdapter,
    knownLosses: [
      'This direct Worker supports SVG only.',
      'Remote, filesystem, arbitrary standard-library includes, and source-level theme directives are disabled.',
      'Browser DOM text metrics are approximated and may differ from the native PlantUML Docker image.',
      'PNG, PDF, TXT, UTXT, and BASE64 formats are not exposed.',
    ],
  },
  {
    id: 'c4plantuml', kind: 'render', adapter: { ...plantumlFamilyAdapter, id: 'c4plantuml' },
    knownLosses: [
      'This direct Worker supports SVG only.',
      'C4-PlantUML is lowered to ordinary PlantUML primitives; advanced macros, manual layout, icon sprites, and custom style macros are rejected explicitly.',
      'C4 tags are retained as PlantUML stereotypes and the default person/system palette is retained semantically, but output is not pixel-compatible with native C4-PlantUML 2.7.0.',
    ],
  },
])
