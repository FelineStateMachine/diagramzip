const EXAMPLE_NAMES = {
  plantuml: 'Tandem task sync',
  mermaid: 'Shared task flow',
  graphviz: 'Tandem collaboration graph',
  d2: 'Connection styles',
  c4plantuml: 'Tandem system context',
  blockdiag: 'Tandem block flow',
  seqdiag: 'Tandem task sequence',
  actdiag: 'Tandem delivery activities',
  nwdiag: 'Network layout',
  packetdiag: 'TCP packet structure',
  rackdiag: 'Rack layout',
  bpmn: 'Agent-assisted review',
  bytefield: 'Byte field layout',
  dbml: 'Database schema',
  diagramsnet: 'Venn diagram',
  ditaa: 'Tandem ASCII architecture',
  erd: 'Data model',
  excalidraw: 'Venn sketch',
  goat: 'Component shapes',
  nomnoml: 'Pirate class diagram',
  pikchr: 'Cardinal points',
  structurizr: 'Tandem landscape',
  svgbob: 'Cloud network',
  symbolator: 'Hardware component',
  tikz: 'Periodic table',
  umlet: 'UML example',
  vega: 'Bar chart',
  vegalite: 'Discretizing scale',
  wavedrom: 'Timing diagram',
  wireviz: 'Wiring harness',
}

export function namedExample(type) {
  return {
    meta: {
      title: EXAMPLE_NAMES[type] ?? 'Diagram example',
      description: '',
    },
    presentation: {
      background: '',
      padding: 0,
      frame: false,
      appearance: 'raw',
    },
  }
}

export function exampleStateForTheme(state, theme) {
  if (!['light', 'dark'].includes(theme)) throw new Error('Example theme must be light or dark.')
  return {
    ...state,
    presentation: {
      ...state.presentation,
      background: '',
      padding: 0,
      frame: false,
      appearance: `${theme}-transparent`,
    },
  }
}

export function refreshMatchingExampleMetadata(state, exampleState) {
  if (state?.source !== exampleState?.source || state?.meta?.title?.trim()) return state

  return {
    ...state,
    meta: {
      ...state.meta,
      title: exampleState.meta.title,
    },
  }
}
