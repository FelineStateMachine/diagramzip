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
  erd: 'edge-wasm',
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
  wireviz: 'edge-python',
}

const activeRuntime: Partial<Record<EngineId, EngineRuntime>> = {
  mermaid: 'client',
  bpmn: 'client',
  bytefield: 'edge-js',
  excalidraw: 'client',
  nomnoml: 'edge-js',
  vega: 'edge-js',
  vegalite: 'edge-js',
  wavedrom: 'edge-js',
  blockdiag: 'edge-python',
  seqdiag: 'edge-python',
  actdiag: 'edge-python',
  nwdiag: 'edge-python',
  packetdiag: 'edge-python',
  rackdiag: 'edge-python',
  graphviz: 'edge-wasm',
  pikchr: 'edge-wasm',
  svgbob: 'edge-wasm',
  erd: 'edge-wasm',
  wireviz: 'edge-python',
}

const versions: Partial<Record<EngineId, string>> = {
  mermaid: 'mermaid@11.17.0',
  bpmn: 'bpmn-js@18.25.1',
  bytefield: 'bytefield-svg@1.11.0',
  excalidraw: '@excalidraw/excalidraw@0.18.1',
  nomnoml: 'nomnoml@1.7.0',
  vega: 'vega@6.3.1',
  vegalite: 'vega-lite@6.4.3',
  wavedrom: 'wavedrom@3.6.2',
  blockdiag: 'blockdiag@3.4.2/python-worker-1',
  seqdiag: 'seqdiag@3.0.0/python-worker-1',
  actdiag: 'actdiag@3.0.0/python-worker-1',
  nwdiag: 'nwdiag@3.0.0/python-worker-1',
  packetdiag: 'packetdiag@3.0.0/python-worker-1',
  rackdiag: 'rackdiag@3.0.0/python-worker-1',
  graphviz: 'graphviz@15.1.1/edge-wasm-1',
  pikchr: 'pikchr@85e65b9686/edge-wasm-1',
  svgbob: 'svgbob@0.7.6/edge-wasm-1',
  erd: 'erd@0.2.1.0+graphviz@15.1.1/edge-wasm-1',
  wireviz: 'wireviz@0.3.2/python-translator-1',
}

const losses: Partial<Record<EngineId, readonly string[]>> = {
  mermaid: ['External links and resource-loading elements are removed; XHTML labels retain only safe text formatting.'],
  bpmn: ['External links and resource-loading elements are removed from exported SVG.'],
  graphviz: [
    'Only SVG is in the rendering contract.',
    'Resource-loading attributes such as image, imagepath, shapefile, fontpath, and stylesheet are rejected because the edge unit has no filesystem or network asset loader.',
    'The edge build uses GraphViz 15.1.1 versus the compatibility image GraphViz 14.1.3; output differences are possible.',
    'The GraphViz scale option is not supported by the edge-Wasm adapter.',
  ],
  pikchr: [
    'Only SVG is supported.',
    'Pikchr image/resource loading and renderer options are not exposed in the edge unit.',
    'The edge build is compiled from the pinned Kroki Pikchr source revision 85e65b968651b342c46e6334f4772b45d6cbb4317c5cbaa95d207779a50c6709.',
  ],
  svgbob: [
    'Only SVG is supported.',
    'Kroki stroke-color is not exposed in the edge unit; the pure upstream library does not load external images or resources.',
    'The edge build is compiled from upstream svgbob 0.7.6 at pinned commit 04a9d85c4b1879051f205e9e434e058864c3d36f.',
  ],
  bytefield: ['Only SVG is in the v2 rendering contract.'],
  dbml: ['The upstream package mixes ESM files into a CommonJS package and remains on the origin until it can be safely repackaged.'],
  excalidraw: [
    'External resources are blocked; image data must be embedded in the scene.',
    'Font subsetting is disabled by the sandbox policy, so exports embed the complete self-hosted font.',
  ],
  nomnoml: ['Only SVG is in the v2 rendering contract.'],
  symbolator: ['External links are removed during SVG sanitization.'],
  vega: ['URL-backed data and images are rejected; data must be embedded as values.', 'Only SVG is in the v2 rendering contract.'],
  vegalite: ['URL-backed data and images are rejected; data must be embedded as values.', 'Only SVG is in the v2 rendering contract.'],
  wavedrom: ['Only the six bundled Kroki skins are accepted.', 'Only SVG is in the v2 rendering contract.'],
  blockdiag: ['Remote and filesystem-backed images are rejected.', 'Only SVG output is supported.'],
  seqdiag: ['Remote and filesystem-backed images are rejected.', 'Only SVG output is supported.'],
  actdiag: ['Remote and filesystem-backed images are rejected.', 'Only SVG output is supported.'],
  nwdiag: ['Remote and filesystem-backed images are rejected.', 'Only SVG output is supported.'],
  packetdiag: ['Remote and filesystem-backed images are rejected.', 'Only SVG output is supported.'],
  rackdiag: ['Remote and filesystem-backed images are rejected.', 'Only SVG output is supported.'],
  erd: [
    'Only the source language and Kroki rendering mode are supported; ERD CLI and filesystem configuration modes are not exposed.',
    'The translated graph uses GraphViz 15.1.1 versus the compatibility image GraphViz 14.1.3; output differences are possible.',
  ],
  wireviz: [
    'Only SVG is supported; BOM and HTML sidecars are not exposed.',
    'Filesystem and remote images are rejected.',
    'tweak.append and tweak.override are rejected.',
    'The upstream source reports WireViz 0.3.2; the Dockerfile release label is 0.3.3.',
    'The translated graph uses GraphViz 15.1.1 versus the compatibility image GraphViz 14.1.3; output differences are possible.',
  ],
}

export const ENGINE_CATALOG: readonly EngineCatalogEntry[] = ENGINE_IDS.map(id => ({
  id,
  targetRuntime: targetRuntime[id],
  activeRuntime: activeRuntime[id] ?? 'origin',
  version: versions[id] ?? 'compatibility-origin',
  fallback: null,
  knownLosses: losses[id] ?? [],
}))

export const ENGINE_CATALOG_BY_ID = new Map(ENGINE_CATALOG.map(entry => [entry.id, entry]))
