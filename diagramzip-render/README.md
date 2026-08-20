# diagramzip-render

Cloudflare Worker rendering gateway for diagram.zip. The editor sends one
bounded JSON request to `/render/v1/svg`; the gateway selects an edge adapter or
the existing Fly compatibility origin, sanitizes and decorates the SVG, and
returns a uniform response.

The catalog deliberately contains all 30 diagram types. An engine does not
disappear while its replacement is incomplete: it remains routed to the origin
and its known migration loss is exposed by `/render/v1/catalog`.

```sh
npm install
npm run cf-typegen
npm run check
npm test
npm run deploy:dry
npm run dev -- --port 8788
npm run smoke
```

The smoke command sends one existing repository fixture for every engine and
checks only structural SVG coverage. It does not perform pixel comparisons.

## Current runtime split

| Runtime | Engines |
| --- | --- |
| Worker JavaScript | Bytefield, Nomnoml, Vega, Vega-Lite, WaveDrom |
| Compatibility origin | The remaining 25 engines |

DBML remains on the origin because its published package mixes module formats.
GraphViz remains on the origin because the published Viz.js wrapper performs
runtime WebAssembly instantiation; the Worker target needs a direct precompiled
module adapter.

All returned SVG passes through the same sanitizer. Scripts, event handlers,
external resources, and active embedded HTML are removed. Mermaid's
`foreignObject` labels retain only a narrow formatting allowlist, with links and
resource-loading elements stripped. Any observed engine-specific loss belongs
in the catalog.
