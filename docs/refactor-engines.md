# Renderer extraction for diagram.zip

## Status

The repository assigns a final renderer path to all 30 catalog engines. The application does not contain a Fly.io render fallback. The catalog Worker does not contain a render proxy.

Production completion requires these final checks:

1. Deploy the UMLet Worker.
2. Deploy the TikZ client unit.
3. Deploy the catalog Worker without the render route.
4. Deploy the application and documentation.
5. Run the 30-engine production smoke test.

Pixel comparison is not a completion gate. Structural coverage is the completion gate. Each known loss must be visible in the catalog.

## Product requirements

- The product does not require an account.
- Each diagram type remains available.
- Each engine has one selected renderer path.
- A renderer failure must not select another renderer.
- A client renderer must run in a script-only sandbox.
- An HTTP renderer must accept only its assigned engine hostname.
- A render result must use the standard SVG viewer contract.
- A renderer must not add engine-specific application UI.
- A renderer must not load remote or filesystem resources unless the unit contract permits them.
- A saved render must record the unit, build, and pipeline.

## Runtime selection

Use the closest maintained implementation in this order:

1. Use the official browser implementation.
2. Use a JavaScript or TypeScript library in a Worker.
3. Use the maintained Python library in a Python Worker.
4. Use a precompiled WebAssembly module in a Worker.
5. Translate a bounded source language into a migrated engine.

Do not keep a compatibility service after an engine has a final path.

## Final topology

```text
diagram.zip application
  |- client renderer frame at {engine}.render.diagram.zip
  |- HTTP renderer at {engine}.render.diagram.zip/v1/svg
  |- persistence Worker at diagram.zip/api/v1/*
  `- catalog Worker at diagram.zip/render/v1/{health|catalog}
```

The catalog Worker does not render diagrams. `POST /render/v1/svg` returns `404`.

Each engine has a public renderer hostname. Engines can share one Worker deployment when they have the same dependencies and failure boundary. The request body does not select an engine.

## Engine inventory

| Engine | Runtime | Unit or pipeline |
| --- | --- | --- |
| PlantUML | Worker WebAssembly | `plantuml-family` |
| Mermaid | Client | `mermaid` |
| GraphViz | Worker WebAssembly | `graphviz-family` |
| D2 | Worker WebAssembly | `d2` with the bounded grid layout |
| C4 PlantUML | Worker WebAssembly | `plantuml-family` through the C4 lowerer |
| BlockDiag | Worker Python | `blockdiag-family` |
| SeqDiag | Worker Python | `blockdiag-family` |
| ActDiag | Worker Python | `blockdiag-family` |
| NwDiag | Worker Python | `blockdiag-family` |
| PacketDiag | Worker Python | `blockdiag-family` |
| RackDiag | Worker Python | `blockdiag-family` |
| BPMN | Client | `bpmn` |
| Bytefield | Worker JavaScript | `bytefield` |
| DBML | Worker WebAssembly | `graphviz-family,dbml,graphviz` |
| diagrams.net | Client | `diagramsnet` |
| Ditaa | Worker WebAssembly | `svgbob-family,svgbob` |
| ERD | Worker WebAssembly | `graphviz-family,erd,graphviz` |
| Excalidraw | Client | `excalidraw` |
| GoAT | Worker WebAssembly | `goat` |
| Nomnoml | Worker JavaScript | `nomnoml` |
| Pikchr | Worker WebAssembly | `pikchr` |
| Structurizr | Worker JavaScript and WebAssembly | `structurizr,plantuml-family,plantuml` |
| Svgbob | Worker WebAssembly | `svgbob-family` |
| Symbolator | Worker Python | `symbolator` |
| TikZ | Client | `tikz` with the bundled TikZJax runtime |
| UMLet | Worker JavaScript | `umlet` UXF-to-SVG translator |
| Vega | Worker JavaScript | `vega-family` |
| Vega-Lite | Worker JavaScript | `vega-family,vega` |
| WaveDrom | Worker JavaScript | `wavedrom` |
| WireViz | Worker Python and WebAssembly | `wireviz,graphviz-family,graphviz` |

## Dependency groups

The BlockDiag family shares Python, Pillow, fonts, plugins, and renderer registration. It uses one Worker deployment and six hostnames.

The GraphViz family shares one precompiled GraphViz module. GraphViz, DBML, and ERD use the same deployment. WireViz calls this deployment through a service binding.

The PlantUML family shares one PlantUML runtime. C4 PlantUML lowers a bounded C4 macro set into PlantUML.

The Svgbob family shares one precompiled Svgbob module. Ditaa lowers bounded ASCII input into Svgbob input.

The Vega family shares the Vega runtime. Vega-Lite compiles into Vega.

Other engines use separate units because they do not share a runtime or failure boundary.

## HTTP unit contract

An HTTP unit provides these routes:

- `GET /v1/health`
- `GET /v1/capabilities`
- `POST /v1/svg`

The POST body has this form:

```ts
interface UnitRenderRequest {
  source: string;
  format: "svg";
  options: Record<string, string>;
  metadata: {
    title: string;
    description: string;
  };
  presentation: {
    background: string;
    padding: number;
    frame: boolean;
  };
}
```

The body does not contain an engine field. The hostname selects the engine.

The response contains these identity headers:

- `X-Diagram-Engine`
- `X-Diagram-Unit`
- `X-Diagram-Pipeline`
- `X-Diagram-Renderer`
- `X-Renderer-Build`

## Client unit contract

A client unit provides the health route, the capabilities route, and `index.html`. The frame uses the `diagram.zip:renderer:v1` message protocol.

The application sets `sandbox="allow-scripts"`. It does not set `allow-same-origin`. The frame is hidden and cannot navigate the application. The frame returns an SVG result through `postMessage`.

The standard diagram.zip viewer displays the returned SVG. A client unit does not provide editor controls or a separate viewer.

## Presentation and SVG policy

Base rendering and presentation are separate stages:

```text
validate -> render base SVG -> sanitize -> decorate -> sanitize -> respond
```

The presentation stage can add a title, description, canvas background, padding, and frame. It must not replace renderer colors.

The sanitizer removes scripts, event handlers, active embedded HTML, and external resources. A unit must reject unsafe source features before rendering when the underlying engine can load resources.

## Coverage policy

The migration uses structural checks. Each engine must meet these requirements:

- The final route or frame is available.
- The repository fixture returns SVG or a valid client capability response.
- The SVG has usable dimensions.
- The response identifies the expected unit and pipeline.
- The output does not contain prohibited active content.
- A documented renderer feature is not silently removed.

The migration does not require pixel equality with the Docker image. Docker remains available for bounded reference checks. Java reference checks must run in Docker.

## Known loss policy

Each loss belongs to one engine catalog entry. The unit capabilities response must return the same loss list.

Examples include these losses:

- D2 uses the bounded grid layout. Dagre and ELK are not available in the Worker.
- Ditaa uses a bounded translation into Svgbob. Some Ditaa shapes and styles are not retained.
- UMLet uses browser-independent text metrics. Unknown custom Java elements become labeled generic boxes.
- TikZ uses the bundled TikZJax package set. It does not use a complete TeX Live installation.
- GraphViz rejects external image and filesystem options.
- PlantUML rejects remote includes, filesystem includes, and arbitrary theme directives.
- Symbolator uses deterministic SVG text estimates instead of Cairo and Pango.

A loss must not trigger a request to Fly.io. A loss must not select a different engine without an explicit translation pipeline.

## UMLet boundary

UMLet accepts UXF and returns ordinary SVG. It does not load UMLetino or a UMLet user interface.

The repository fixture uses these custom elements:

- `com.umlet.element.custom.State`
- `com.umlet.element.custom.InitialState`
- `com.umlet.element.custom.FinalState`
- `com.umlet.element.custom.HistoryState`
- `com.umlet.element.custom.ThreeWayRelation`

The translator handles all five elements directly. An unknown custom Java class becomes a labeled generic box. The translator does not execute custom Java code.

## TikZ boundary

TikZ runs in a dedicated client unit. The unit bundles the official TikZJax assets. The unit accepts source through the standard client protocol and returns ordinary SVG.

The unit does not add a TikZ editor or viewer. The diagram.zip viewer displays the result.

## Fly.io removal boundary

The main Fly.io application can continue to serve the diagram.zip web application during a separate hosting migration. It is not a renderer dependency.

The renderer extraction is complete only when all of these statements are true:

- The application has no `/render/v1/svg` request path.
- The catalog Worker has no `POST /render/v1/svg` implementation.
- The repository has no origin adapter.
- The repository has no compatibility unit.
- The renderer catalog has no `origin` runtime.
- All 30 engines pass the production route audit.

## Deployment and rollback

Deploy each final unit before the application cutover. Then deploy the catalog Worker, application, and documentation.

Rollback uses a prior version of the same final unit. Rollback does not restore the Fly.io render fallback.

## Completion checks

Run these checks before completion:

1. Run all renderer tests.
2. Run all application tests.
3. Run all documentation tests and the production build.
4. Run Wrangler dry-runs for every Worker unit.
5. Run build and protocol checks for every client unit.
6. Search the application and renderer code for origin and compatibility paths.
7. Deploy the final units.
8. Run the 30-engine production smoke test.
9. Confirm that `POST https://diagram.zip/render/v1/svg` returns `404`.
10. Confirm that the documentation examples use direct units or client frames.
