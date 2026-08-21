# diagramzip-render

This directory contains the Cloudflare renderer plane for diagram.zip.

All 30 catalog engines have a final renderer path. No renderer uses the Fly.io application. No renderer can use an origin fallback.

Each engine has a hostname:

```text
https://{engine}.render.diagram.zip
```

The hostname selects the engine. A render request does not contain an engine selector.

The Worker at `diagram.zip/render/v1/*` is a catalog service. It provides health and catalog routes. It does not provide a render proxy.

## Validation

Run these commands from this directory:

```sh
npm install
npm run cf-typegen
npm run check
npm test
npm run deploy:dry
```

Run `npm run smoke:units` after all units are deployed. This command checks one repository fixture or capability response for each catalog engine. It checks coverage and SVG structure. It does not compare pixels.

Run `npm run smoke` against a local catalog Worker. This command checks the health route, the 30-engine catalog, and the absence of the old render proxy.

## HTTP unit contract

An HTTP renderer provides these routes:

- `GET /v1/health`
- `GET /v1/capabilities`
- `POST /v1/svg`

The POST body contains source, options, metadata, and presentation settings. It does not contain an engine field.

The response headers identify the unit, build, and pipeline:

- `X-Diagram-Unit`
- `X-Renderer-Build`
- `X-Diagram-Pipeline`

## Client unit contract

A client renderer provides the health route, the capabilities route, and a sandboxed frame. The frame uses the `diagram.zip:renderer:v1` message protocol. The frame accepts only its assigned engine.

The application loads each frame with `sandbox="allow-scripts"`. The frame does not receive same-origin access. A failed client render does not switch to an HTTP renderer.

The client engines are Mermaid, BPMN, Excalidraw, diagrams.net, and TikZ.

## Dependency groups

One Worker can serve several hostnames when the engines use the same dependency stack.

- `blockdiag-family` serves BlockDiag, SeqDiag, ActDiag, NwDiag, PacketDiag, and RackDiag.
- `graphviz-family` serves GraphViz, DBML, and ERD.
- `plantuml-family` serves PlantUML and C4 PlantUML.
- `svgbob-family` serves Svgbob and the Ditaa translation.
- `vega-family` serves Vega and Vega-Lite.

Some units translate source into another engine. The pipeline header lists each stage in order. WireViz translates to GraphViz. Structurizr translates to PlantUML. DBML and ERD translate to GraphViz. Ditaa translates to Svgbob.

## Runtime split

| Runtime | Count | Engines |
| --- | ---: | --- |
| Worker JavaScript | 7 | Bytefield, Nomnoml, Structurizr, UMLet, Vega, Vega-Lite, WaveDrom |
| Worker Python | 8 | BlockDiag, SeqDiag, ActDiag, NwDiag, PacketDiag, RackDiag, Symbolator, WireViz |
| Worker WebAssembly | 10 | PlantUML, C4 PlantUML, GraphViz, DBML, ERD, D2, Ditaa, GoAT, Pikchr, Svgbob |
| Sandboxed client | 5 | Mermaid, BPMN, Excalidraw, diagrams.net, TikZ |

The total is 30 of 30 engines. The Fly.io Java rendering image is not part of this renderer plane.

## Output policy

Every renderer returns SVG. Each HTTP unit sanitizes and decorates its output. Each client unit sanitizes its output before it sends the result to the application.

Scripts, event handlers, active embedded HTML, and external resources are not allowed. Renderer-specific losses are listed in the catalog and in each unit's capabilities response.
