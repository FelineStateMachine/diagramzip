export type EngineRuntime = 'edge-js' | 'edge-wasm' | 'edge-python' | 'browser-run'

export const ENGINE_IDS = [
  'plantuml',
  'mermaid',
  'graphviz',
  'd2',
  'c4plantuml',
  'blockdiag',
  'seqdiag',
  'actdiag',
  'nwdiag',
  'packetdiag',
  'rackdiag',
  'squaring',
  'bpmn',
  'bytefield',
  'dbml',
  'diagramsnet',
  'ditaa',
  'erd',
  'excalidraw',
  'goat',
  'nomnoml',
  'pikchr',
  'structurizr',
  'svgbob',
  'symbolator',
  'tikz',
  'trn',
  'umlet',
  'vega',
  'vegalite',
  'wavedrom',
  'wireviz',
] as const

export type EngineId = typeof ENGINE_IDS[number]

export function isEngineId(value: string): value is EngineId {
  return (ENGINE_IDS as readonly string[]).includes(value)
}
