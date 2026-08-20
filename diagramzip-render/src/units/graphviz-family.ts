import { erdAdapter } from '../adapters/edge/erd'
import { graphvizAdapter } from '../adapters/edge/graphviz'
import { createRendererUnitGroup } from '../unit'

export default createRendererUnitGroup('graphviz-family', [
  {
    id: 'graphviz',
    kind: 'render',
    adapter: graphvizAdapter,
    pipeline: ['graphviz'],
    knownLosses: [
      'Only SVG is in the rendering contract.',
      'GraphViz resource-loading attributes are rejected because the edge unit has no file or network asset loader.',
      'The edge build uses GraphViz 15.1.1 versus the compatibility image GraphViz 14.1.3; output differences are possible.',
      'The GraphViz scale option is not supported by the edge-Wasm adapter.',
    ],
  },
  {
    id: 'erd',
    kind: 'translate',
    adapter: erdAdapter,
    pipeline: ['erd', 'graphviz'],
    knownLosses: [
      'Only the source language and default Kroki rendering mode are supported; ERD CLI/config-file modes are not exposed.',
      'The translated graph uses GraphViz 15.1.1 versus the compatibility image GraphViz 14.1.3; output differences are possible.',
    ],
  },
])
