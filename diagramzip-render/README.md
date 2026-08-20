# diagramzip-render

Cloudflare Worker rendering plane for diagram.zip. Every catalog engine owns
`https://{engine}.render.diagram.zip`. The hostname selects the engine; the
editor never sends an engine selector. Engines that ship as one dependency or
runtime share a Worker deployment while retaining distinct hostnames. The older
`/render/v1/svg` gateway remains only as a migration fallback.

The catalog deliberately contains all 30 diagram types. An engine does not
disappear while its replacement is incomplete: its small compatibility unit
proxies only the corresponding Fly endpoint. Known migration loss is exposed
by the unit's `/v1/capabilities` response and the gateway catalog.

```sh
npm install
npm run cf-typegen
npm run check
npm test
npm run deploy:dry
npm run deploy:compatibility-units
npm run dev -- --port 8788
npm run smoke
```

The smoke command sends one existing repository fixture for every engine and
checks only structural SVG coverage. It does not perform pixel comparisons.

## Unit contract

Server-rendered units expose `GET /v1/health`, `GET /v1/capabilities`, and
`POST /v1/svg`. The POST body contains source, options, metadata, and
presentation, but never an engine field. Responses identify the dependency unit,
build, and pipeline with `X-Diagram-Unit`, `X-Renderer-Build`, and
`X-Diagram-Pipeline`.

Browser-rendered units expose the same health and capability routes plus one
sandboxed frame. The frame accepts only its own engine over the versioned
postMessage protocol. Mermaid, BPMN, and Excalidraw have separate packages,
bundles, CSPs, deployments, and subdomains.

A unit may expose multiple catalog hostnames when those engines share the same
dependency stack. BlockDiag, SeqDiag, ActDiag, NwDiag, PacketDiag, and RackDiag
share `blockdiag-family`; PlantUML and C4 PlantUML share `plantuml-family`;
Vega and Vega-Lite share `vega-family`. Requests are still selected only by a
dedicated hostname, so a caller cannot choose an unrelated engine in the body.

A unit may translate into another renderer. Translation is declared as an
ordered pipeline whose first stage is the deployable unit. Vega-Lite therefore
reports `vega-family,vega`; `X-Diagram-Engine` still reports `vegalite`.

## Current runtime split

| Runtime | Engines |
| --- | --- |
| Worker JavaScript | Bytefield, Nomnoml, Vega family (Vega and Vega-Lite → Vega), WaveDrom |
| Sandboxed browser unit | Mermaid, BPMN, Excalidraw |
| Compatibility unit | 16 dependency units covering the remaining 22 engines |

Compatibility units are the replacement seam, not the final runtime. DBML
currently proxies because its published package mixes module formats. GraphViz
currently proxies because the published Viz.js wrapper performs runtime
WebAssembly instantiation; its unit still needs a direct precompiled module
adapter.

All returned SVG passes through the same sanitizer. Scripts, event handlers,
external resources, and active embedded HTML are removed. Mermaid's
`foreignObject` labels retain only a narrow formatting allowlist, with links and
resource-loading elements stripped. Any observed engine-specific loss belongs
in the catalog.
