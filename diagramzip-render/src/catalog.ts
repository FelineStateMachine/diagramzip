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
  plantuml: 'edge-wasm',
  mermaid: 'client',
  graphviz: 'edge-wasm',
  d2: 'edge-wasm',
  c4plantuml: 'edge-wasm',
  blockdiag: 'edge-python',
  seqdiag: 'edge-python',
  actdiag: 'edge-python',
  nwdiag: 'edge-python',
  packetdiag: 'edge-python',
  rackdiag: 'edge-python',
  bpmn: 'client',
  bytefield: 'edge-js',
  dbml: 'edge-wasm',
  diagramsnet: 'client',
  ditaa: 'edge-wasm',
  erd: 'edge-wasm',
  excalidraw: 'client',
  goat: 'edge-wasm',
  nomnoml: 'edge-js',
  pikchr: 'edge-wasm',
  structurizr: 'edge-js',
  svgbob: 'edge-wasm',
  symbolator: 'edge-python',
  tikz: 'origin',
  umlet: 'client',
  vega: 'edge-js',
  vegalite: 'edge-js',
  wavedrom: 'edge-js',
  wireviz: 'edge-python',
}

const activeRuntime: Partial<Record<EngineId, EngineRuntime>> = {
  plantuml: 'edge-wasm',
  c4plantuml: 'edge-wasm',
  mermaid: 'client',
  bpmn: 'client',
  bytefield: 'edge-js',
  diagramsnet: 'client',
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
  dbml: 'edge-wasm',
  pikchr: 'edge-wasm',
  svgbob: 'edge-wasm',
  goat: 'edge-wasm',
  erd: 'edge-wasm',
  wireviz: 'edge-python',
  structurizr: 'edge-js',
  d2: 'edge-wasm',
  ditaa: 'edge-wasm',
  symbolator: 'edge-python',
}

const versions: Partial<Record<EngineId, string>> = {
  plantuml: 'plantuml@1.2026.6/edge-wasm-1',
  c4plantuml: 'c4plantuml@2.7.0-lowered+plantuml@1.2026.6/edge-wasm-1',
  mermaid: 'mermaid@11.17.0',
  bpmn: 'bpmn-js@18.25.1',
  diagramsnet: 'diagrams.net@29.6.1/client-unit-1',
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
  graphviz: 'graphviz@15.1.1/edge-wasm-2',
  dbml: 'dbml@1.0.31+graphviz@15.1.1/edge-wasm-2',
  pikchr: 'pikchr@85e65b9686/edge-wasm-1',
  svgbob: 'svgbob@0.7.6/edge-wasm-1',
  goat: 'goat@0.5.1/edge-wasm-1',
  erd: 'erd@0.2.1.0+graphviz@15.1.1/edge-wasm-1',
  wireviz: 'wireviz@0.3.2/python-translator-1',
  structurizr: 'structurizr@6.2.2+plantuml@1.2026.6/translation-1',
  d2: 'd2@0.7.1/custom-grid-1',
  ditaa: 'ditaa-ascii+svgbob@0.7.6/edge-wasm-1',
  symbolator: 'symbolator@1.2.2/python-translation-1',
}

const losses: Partial<Record<EngineId, readonly string[]>> = {
  plantuml: [
    'Only SVG is supported.',
    'Remote, filesystem, arbitrary standard-library includes, and source-level theme directives are disabled.',
    'The browser-derived renderer uses bounded approximate DOM text metrics, so layout may differ from the native PlantUML Docker image.',
  ],
  c4plantuml: [
    'Only SVG is supported.',
    'The supported C4-PlantUML core is lowered to ordinary PlantUML primitives; advanced macros, icon sprites, and custom style macros are rejected explicitly.',
    'People, systems, containers, components, boundaries, core relationships, technology labels, tags, and the default C4 palette are retained semantically, but output is not pixel-compatible with native C4-PlantUML 2.7.0.',
  ],
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
  goat: [
    'Only SVG is supported.',
    'Custom CSS files are not exposed; native light/dark color options and embedded default CSS are retained.',
    'Light and dark colors are limited to bounded named, hexadecimal, RGB(A), or HSL(A) values; CSS variables and resource-bearing values are rejected.',
    'The edge build uses TinyGo with a slice-based vendored iterator adaptation; geometry and source grammar remain upstream GoAT 0.5.1.',
  ],
  bytefield: ['Only SVG is in the v2 rendering contract.'],
  dbml: [
    'Only SVG is supported.',
    'DBML URLs are lowered to GraphViz HREFs, then external links are removed by SVG sanitization.',
    'The translated graph uses GraphViz 15.1.1 versus the compatibility DBML image Viz.js/GraphViz 2.47.0; output differences are possible.',
  ],
  diagramsnet: [
    'Rendering runs in the sandboxed official diagrams.net browser exporter; there is no server-side or Fly fallback.',
    'External resources are blocked; embedded data images remain supported.',
  ],
  excalidraw: [
    'External resources are blocked; image data must be embedded in the scene.',
    'Font subsetting is disabled by the sandbox policy, so exports embed the complete self-hosted font.',
  ],
  nomnoml: ['Only SVG is in the v2 rendering contract.'],
  symbolator: [
    'Only SVG is supported.',
    'Native Cairo/Pango font shaping is replaced by deterministic browser-font estimates, so layout and typography differ from Symbolator 1.2.2.',
    'Filesystem library scanning and persisted array-type caches are unavailable; each request contains one bounded HDL source.',
  ],
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
  structurizr: [
    'Only SVG is supported.',
    'Structurizr scripts, docs, plugins, filesystem access, and arbitrary remote themes are rejected.',
    'The bounded lowering preserves supported views, relationships, structural styles, and legends, but layout and typography may differ from native Structurizr export.',
  ],
  d2: [
    'Only SVG is supported.',
    'The edge build uses official D2 v0.7.1 parser/compiler/SVG renderer with a deterministic grid layout and straight-line routing; Dagre and ELK layouts are unavailable.',
    'D2 syntax, labels, shapes, containers, steps/scenarios, and CSS edge animation are retained, but layout quality differs substantially from Dagre/ELK.',
    'The supported animation-interval option is bounded to 1–60000 milliseconds; animated edges and multi-board SVG output remain supported.',
  ],
  ditaa: [
    'Only SVG is supported.',
    'Ditaa ASCII geometry, labels, and connectors are translated through the shared Svgbob 0.7.6 Worker dependency.',
    'Ditaa shape and color directives are removed; specialized shapes and per-shape colors are not retained.',
    'Shadows, rounded corners, anti-aliasing, and edge separation flags are accepted for compatibility but have no effect in the Svgbob pipeline.',
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
