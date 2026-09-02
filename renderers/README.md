# Renderer plane

This directory contains the complete Cloudflare renderer plane for diagram.zip.

| Path | Purpose |
| --- | --- |
| `catalog/` | Health and capability catalog service; it does not render diagrams |
| `browser-run/` | Private Browser Run service, per-engine Durable Object sessions, and pinned frames under `frames/` |
| `edge/` | JavaScript and WebAssembly renderer Workers |
| `python/` | Python renderer and translation Workers |
| `shared/` | Engine identities shared by the catalog and runtime units |
| `scripts/` | Cross-runtime deployment and smoke-test orchestration |

All 32 catalog engines have a final renderer path. No renderer uses the Fly.io application. No renderer can use an origin fallback.

Each engine has a hostname:

```text
https://{engine}.render.diagram.zip
```

The hostname selects the engine. A render request does not contain an engine selector.

The Worker in `catalog/` serves `diagram.zip/render/v1/*`. It provides health and catalog routes. It does not provide a render proxy.

## Validation

Run these commands from `renderers/`:

```sh
npm --prefix edge install
npm --prefix edge run generate:types
npm --prefix edge run check
npm --prefix edge test
npm --prefix edge run deploy:dry-run
```

Run `npm --prefix edge run smoke:renderers` after all units are deployed. This command checks one repository fixture or capability response for each catalog engine. It checks coverage and SVG structure. It does not compare pixels.

Run `npm --prefix edge run smoke:catalog` against a local catalog Worker. This command checks the health route, the 32-engine catalog, and the absence of the old render proxy.

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

## Browser Run contract

Mermaid and diagrams.net expose the same public HTTP unit contract as every other engine. Their public Workers validate the hostname-selected request and call the private `browser-run/` Worker through a service binding. The private Worker has no public route.

Browser Run keeps one serialized Durable Object session per engine, launches the pinned frame, and uses the `diagram.zip:renderer:v1` message protocol internally. Idle sessions close after 60 seconds. A failed browser render does not select another renderer.

The Browser Run engines are Mermaid and diagrams.net. BPMN and Excalidraw use JavaScript Workers; TikZ uses a WebAssembly Worker.

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
| Worker JavaScript | 11 | BPMN, Bytefield, Excalidraw, Nomnoml, Squaring, Structurizr, TRN, UMLet, Vega, Vega-Lite, WaveDrom |
| Worker Python | 8 | BlockDiag, SeqDiag, ActDiag, NwDiag, PacketDiag, RackDiag, Symbolator, WireViz |
| Worker WebAssembly | 11 | PlantUML, C4 PlantUML, GraphViz, DBML, ERD, D2, Ditaa, GoAT, Pikchr, Svgbob, TikZ |
| Browser Run | 2 | Mermaid, diagrams.net |

The total is 32 of 32 engines. The Fly.io Java rendering image is not part of this renderer plane.

## Output policy

Every renderer returns SVG through its public HTTP unit. The unit sanitizes and canonicalizes the result before it reaches the application, which applies presentation without rerunning the renderer.

Scripts, event handlers, active embedded HTML, and external resources are not allowed. Renderer-specific losses are listed in the catalog and in each unit's capabilities response.
