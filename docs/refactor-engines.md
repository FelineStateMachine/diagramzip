# Renderer extraction for diagram.zip

## Status

The repository assigns a final renderer path to all 30 catalog engines. The application does not contain a Fly.io render fallback. The catalog Worker does not contain a render proxy.

Production rollout requires these final checks:

1. Deploy the native BPMN, Excalidraw, and TikZ Workers.
2. Deploy the private Browser Run bridge and the Mermaid and diagrams.net public units.
3. Deploy the catalog Worker, application, and documentation.
4. Run the 30-engine production smoke test.

Pixel comparison is not a completion gate. Structural coverage is the completion gate. Each known loss must be visible in the catalog.

## Product requirements

- The product does not require an account.
- Each diagram type remains available.
- Each engine has one selected renderer path.
- A renderer failure must not select another renderer.
- A browser-only renderer must execute behind the private Browser Run service.
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
  |- HTTP renderer at {engine}.render.diagram.zip/v1/svg
  |- persistence Worker at diagram.zip/api/v1/*
  `- catalog Worker at diagram.zip/render/v1/{health|catalog}

Mermaid/diagrams.net HTTP unit
  `- private Browser Run service binding
       `- pinned renderer frame
```

The catalog Worker does not render diagrams. `POST /render/v1/svg` returns `404`.

Each engine has a public renderer hostname. Engines can share one Worker deployment when they have the same dependencies and failure boundary. The request body does not select an engine.

## Engine inventory

| Engine | Runtime | Unit or pipeline |
| --- | --- | --- |
| PlantUML | Worker WebAssembly | `plantuml-family` |
| Mermaid | Browser Run | `mermaid` through the private Browser Run bridge |
| GraphViz | Worker WebAssembly | `graphviz-family` |
| D2 | Worker WebAssembly | `d2` with the bounded grid layout |
| C4 PlantUML | Worker WebAssembly | `plantuml-family` through the C4 lowerer |
| BlockDiag | Worker Python | `blockdiag-family` |
| SeqDiag | Worker Python | `blockdiag-family` |
| ActDiag | Worker Python | `blockdiag-family` |
| NwDiag | Worker Python | `blockdiag-family` |
| PacketDiag | Worker Python | `blockdiag-family` |
| RackDiag | Worker Python | `blockdiag-family` |
| BPMN | Worker JavaScript | `bpmn` bounded BPMN DI-to-SVG renderer |
| Bytefield | Worker JavaScript | `bytefield` |
| DBML | Worker WebAssembly | `graphviz-family,dbml,graphviz` |
| diagrams.net | Browser Run | `diagramsnet` through the private Browser Run bridge |
| Ditaa | Worker WebAssembly | `svgbob-family,svgbob` |
| ERD | Worker WebAssembly | `graphviz-family,erd,graphviz` |
| Excalidraw | Worker JavaScript | `excalidraw` with a Worker DOM/canvas shim |
| GoAT | Worker WebAssembly | `goat` |
| Nomnoml | Worker JavaScript | `nomnoml` |
| Pikchr | Worker WebAssembly | `pikchr` |
| Structurizr | Worker JavaScript and WebAssembly | `structurizr,plantuml-family,plantuml` |
| Svgbob | Worker WebAssembly | `svgbob-family` |
| Symbolator | Worker Python | `symbolator` |
| TikZ | Worker WebAssembly | `tikz` with the bundled TikZJax TeX core |
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

## Browser Run contract

A browser-backed public unit provides the standard HTTP routes and calls the private Browser Run Worker through a service binding. The private service keeps a serialized Durable Object session for each engine and has no public route.

The Browser Run page loads the pinned engine frame and uses the `diagram.zip:renderer:v1` message protocol internally. The frame returns an SVG result to the private service; the public unit canonicalizes it before responding.

The application sees only the public HTTP contract. It does not create renderer iframes or execute renderer packages.

## Presentation and SVG policy

Base rendering and presentation are separate stages:

```text
validate -> render base SVG -> sanitize -> decorate -> sanitize -> respond
```

The presentation stage can add a title, description, canvas background, padding, and frame. It must not replace renderer colors.

The sanitizer removes scripts, event handlers, active embedded HTML, and external resources. A unit must reject unsafe source features before rendering when the underlying engine can load resources.

## Coverage policy

The migration uses structural checks. Each engine must meet these requirements:

- The final HTTP route is available.
- The repository fixture returns SVG.
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

TikZ runs in a dedicated WebAssembly Worker with the pinned TikZJax TeX/PGF package set. Wrangler imports the TeX module through its `CompiledWasm` rule. Each serialized request streams the compressed format dump directly into fresh Wasm memory.

The unit cannot load arbitrary packages or external files. Its deterministic extraction script, unmodified corresponding TikZJax source, provenance, and GPL/LPPL terms are stored with the artifact.

## Fly.io removal boundary

DiagramZip runs on Cloudflare and the repository contains no Fly.io application or renderer configuration. Fly.io is not a runtime, deployment, or fallback dependency.

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
5. Run build and protocol checks for the Browser Run bridge and both browser-backed units.
6. Search the application and renderer code for origin and compatibility paths.
7. Deploy the final units.
8. Run the 30-engine production smoke test.
9. Confirm that `POST https://diagram.zip/render/v1/svg` returns `404`.
10. Confirm that the application and documentation examples use direct HTTP units only.
