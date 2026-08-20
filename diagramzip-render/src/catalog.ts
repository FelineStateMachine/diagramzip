import { ENGINE_IDS, type EngineId, type EngineRuntime } from './types'

export interface EngineCatalogEntry {
  id: EngineId
  targetRuntime: EngineRuntime
  activeRuntime: EngineRuntime
  version: string
  fallback: 'origin' | null
  knownLosses: readonly string[]
}

const targetRuntime: Record<EngineId, EngineRuntime> = {
  plantuml: 'client',
  mermaid: 'client',
  graphviz: 'edge-wasm',
  d2: 'edge-wasm',
  c4plantuml: 'client',
  blockdiag: 'edge-python',
  seqdiag: 'edge-python',
  actdiag: 'edge-python',
  nwdiag: 'edge-python',
  packetdiag: 'edge-python',
  rackdiag: 'edge-python',
  bpmn: 'client',
  bytefield: 'edge-js',
  dbml: 'edge-js',
  diagramsnet: 'client',
  ditaa: 'origin',
  erd: 'edge-js',
  excalidraw: 'client',
  goat: 'edge-wasm',
  nomnoml: 'edge-js',
  pikchr: 'edge-wasm',
  structurizr: 'edge-js',
  svgbob: 'edge-wasm',
  symbolator: 'origin',
  tikz: 'origin',
  umlet: 'client',
  vega: 'edge-js',
  vegalite: 'edge-js',
  wavedrom: 'edge-js',
  wireviz: 'origin',
}

const activeRuntime: Partial<Record<EngineId, EngineRuntime>> = {
  bytefield: 'edge-js',
  nomnoml: 'edge-js',
  vega: 'edge-js',
  vegalite: 'edge-js',
  wavedrom: 'edge-js',
}

const versions: Partial<Record<EngineId, string>> = {
  bytefield: 'bytefield-svg@1.11.0',
  nomnoml: 'nomnoml@1.7.0',
  vega: 'vega@6.3.1',
  vegalite: 'vega-lite@6.4.3',
  wavedrom: 'wavedrom@3.6.2',
}

const losses: Partial<Record<EngineId, readonly string[]>> = {
  graphviz: [
    'The published Viz.js wrapper performs runtime WebAssembly instantiation, which Workers prohibit; GraphViz remains on the origin until a precompiled module adapter is built.',
    'External links and resources are rejected during SVG sanitization.',
  ],
  bytefield: ['Only SVG is in the v2 rendering contract.'],
  dbml: ['The upstream package mixes ESM files into a CommonJS package and remains on the origin until it can be safely repackaged.'],
  nomnoml: ['Only SVG is in the v2 rendering contract.'],
  vega: ['URL-backed data and images are rejected; data must be embedded as values.', 'Only SVG is in the v2 rendering contract.'],
  vegalite: ['URL-backed data and images are rejected; data must be embedded as values.', 'Only SVG is in the v2 rendering contract.'],
  wavedrom: ['Only the six bundled Kroki skins are accepted.', 'Only SVG is in the v2 rendering contract.'],
}

export const ENGINE_CATALOG: readonly EngineCatalogEntry[] = ENGINE_IDS.map(id => ({
  id,
  targetRuntime: targetRuntime[id],
  activeRuntime: activeRuntime[id] ?? 'origin',
  version: versions[id] ?? 'compatibility-origin',
  fallback: activeRuntime[id] ? 'origin' : null,
  knownLosses: losses[id] ?? [],
}))

export const ENGINE_CATALOG_BY_ID = new Map(ENGINE_CATALOG.map(entry => [entry.id, entry]))
