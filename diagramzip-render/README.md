# diagramzip-render

Cloudflare Worker rendering plane for diagram.zip. Every catalog engine owns
`https://{engine}.render.diagram.zip`. The hostname selects the engine; the
editor never sends an engine selector. Engines that ship as one dependency or
runtime share a Worker deployment while retaining distinct hostnames. The older
`/render/v1/svg` gateway remains only as a temporary migration path for engines
that have not yet moved; an extracted engine cannot fall back through it.

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
npm run deploy:worker-units
npm run deploy:python-units
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
share `blockdiag-family`; GraphViz and the ERD-to-DOT translator share
`graphviz-family`; PlantUML and C4 PlantUML share `plantuml-family`; Vega and
Vega-Lite share `vega-family`. Requests are still selected only by a dedicated
hostname, so a caller cannot choose an unrelated engine in the body.

A unit may translate into another renderer. Translation is declared as an
ordered pipeline whose first stage is the deployable unit. Vega-Lite therefore
reports `vega-family,vega`. WireViz preserves its upstream Python parser/model,
emits DOT, and reports `wireviz,graphviz-family,graphviz`; service binding keeps
the GraphViz dependency internal. `X-Diagram-Engine` still reports the selected
catalog engine.

## Current runtime split

| Runtime | Engines |
| --- | --- |
| Worker JavaScript | Bytefield, Nomnoml, Vega family (Vega and Vega-Lite → Vega), WaveDrom |
| Worker Python | BlockDiag family (BlockDiag, SeqDiag, ActDiag, NwDiag, PacketDiag, RackDiag); WireViz → DOT → GraphViz |
| Worker WebAssembly | GraphViz family (GraphViz and ERD → DOT → GraphViz); Pikchr; Svgbob |
| Sandboxed browser unit | Mermaid, BPMN, Excalidraw |
| Compatibility unit | 10 dependency units covering the remaining 11 engines |

The current split is 19/30 engines off Fly and 11/30 still dependent on it.
Compatibility units are extraction seams, not final runtimes or fallbacks for
an engine after cutover. DBML
currently proxies because its published package mixes module formats. GraphViz
uses a precompiled Worker module; ERD lowers its upstream-compatible source
language to DOT and reuses the same in-process GraphViz runtime. WireViz runs
its vendored upstream parser and DOT composer in a separate Python Worker, then
calls that same GraphViz deployment through a service binding. Pikchr compiles
the pinned upstream C source into a small, isolated precompiled Wasm unit.

All returned SVG passes through the same sanitizer. Scripts, event handlers,
external resources, and active embedded HTML are removed. Mermaid's
`foreignObject` labels retain only a narrow formatting allowlist, with links and
resource-loading elements stripped. Any observed engine-specific loss belongs
in the catalog.
