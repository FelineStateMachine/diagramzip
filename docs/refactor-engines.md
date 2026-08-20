# Refactoring diagram engines for diagram.zip v2

## Status

This document proposes a TypeScript-first `diagram.zip` v2 targeting Cloudflare. “TypeScript-first” describes the application, control plane, shared contracts, and most renderers; it does not prohibit a purpose-built Python Worker when that lets us run a maintained upstream renderer directly. This is a migration plan, not a commitment to reproduce the current Kroki process topology at the edge.

The first target is SVG. PNG conversion can be added later as a shared SVG-to-PNG stage. PDF, JPEG, and renderer-specific binary formats are not part of the initial Cloudflare target.

The product constraints are:

- no account or login requirement;
- short, stable aliases identify diagrams without embedding their contents in the URL;
- possession of an unguessable write capability authorizes updates; locked diagrams add a browser-held password-derived key;
- D1 stores alias metadata and content/render pointers, while R2 stores immutable content-addressed source bundles and render blobs;
- static links work without opening the editor;
- diagram metadata and presentation settings survive in static SVGs;
- renderer-defined colors and styles remain intact;
- live editing should not wait on a server when an official browser renderer exists.

## Decision

Do not translate each existing sidecar into one Worker. The current containers describe deployment history, not the ideal responsibility boundaries for a browser-and-edge product.

For each diagram family, choose the closest maintained rendering path in this order:

1. Render in the browser with the official implementation.
2. Render in a Worker with a JavaScript/TypeScript library.
3. Run a compatible upstream library in its supported Worker language.
4. Render in a Worker with precompiled WebAssembly.
5. Port a small, well-defined upstream parser or renderer when the original runtime is unsuitable.
6. Use the existing origin renderer as a compatibility fallback.

Workers should own routing, decoding, request validation, SVG sanitization, presentation, caching, and the edge-native engines. The browser should own interactive rendering wherever practical. Fly.io or Cloudflare Containers should temporarily retain engines whose real responsibility is a native toolchain, a JVM, Graphviz composition that cannot yet move to WebAssembly, or TeX. Python alone is no longer a reason to require an origin now that Cloudflare has Python Workers, but each dependency still needs a compatibility and performance spike.

This gives v2 a coherent product even before every engine is Cloudflare-native: all engines can remain available through a runtime adapter, while the highest-value engines move off the origin incrementally.

## Separate the four product responsibilities

The current API shape makes one renderer endpoint serve several different jobs. V2 should distinguish them explicitly.

### Interactive preview

The editor needs fast, cancellable feedback. Prefer an official renderer running locally in a sandboxed browser frame. If the renderer is edge-native, call a Worker. Reach the origin only for engines that have no viable browser or Worker implementation.

### Persisted editable state

An alias such as `/d/7Mpk2q` resolves to immutable content and render objects. An open diagram's source and metadata are stored server-side; a locked diagram stores only browser-encrypted content, metadata, and renders. The read URL contains the alias only. An unguessable write capability remains in the URL fragment (and local storage on the editing device), so it is not sent while reading a diagram and there is no account dependency.

### Durable static SVG

An open alias exposes its saved, sanitized SVG at a stable route such as `/api/v1/aliases/{alias}/renders/svg`. The response resolves a D1 pointer to an immutable R2 blob and can be cached at the edge. Locked diagrams store an encrypted render blob; they can be opened and decrypted by the editor with the same password, but cannot be embedded because an image request cannot present that password. The share dialog states this restriction plainly.

### Transient source render

The transient gateway keeps the familiar engine/source rendering contract:

```text
/render/v1/svg
```

The editor POSTs a bounded JSON request containing the engine, source, options, metadata, and presentation. The rendering gateway renders locally when possible and forwards only the remaining engines to the compatibility origin. The result is transient until a successful alias save uploads the immutable content-addressed render blob.

## Proposed runtime topology

```text
browser
  |- client renderer adapters
  |- persistence Worker -> D1 aliases/pointers -> R2 immutable blobs
  `- /render/v1/svg gateway
       |- registry, validation, sanitization, presentation, Cache API
       |- edge-js adapters
       |- future service bindings -> render-wasm / render-python
       `- fetch -> consolidated compatibility origin
```

The internal Workers should use service bindings rather than public URLs. Grouping by runtime and failure boundary avoids both one-Worker-per-engine sprawl and a single bundle containing every dependency.

Suggested deployable units:

- `diagram-zip-web`: UI assets, alias flows, client-side encryption, and browser renderer adapters.
- `diagram-zip-persistence`: D1 alias metadata and R2 content-addressed source/render storage.
- `diagram-zip-render`: the shared 30-engine registry, Bytefield, Nomnoml, WaveDrom, Vega, and Vega-Lite, plus origin fallback.
- `diagram-zip-render-wasm`: GraphViz, D2, Pikchr, and Svgbob after compatibility spikes.
- `diagram-zip-render-python`: the upstream BlockDiag suite, isolated because Pyodide, Pillow, fonts, and the Python package graph have a different bundle and startup profile.
- `diagram-zip-render-origin`: the remaining native/JVM/TeX renderers, initially consolidated in one Fly app or equivalent container group.

Static assets should not be included in Worker script bundles. Before deploying, validate each bundle against the current Worker compressed-size, uncompressed-size, memory, CPU, and startup limits rather than relying on values copied into this design document.

## Engine inventory

### JavaScript already bundled behind executable wrappers

These engines already call JavaScript libraries. Their current process boundary is packaging, not an essential part of rendering:

| Catalog type | Existing library/path | V2 responsibility | Confidence |
| --- | --- | --- | --- |
| Bytefield | `bytefield-svg` in `bytefield/index.js` | Direct Worker library call | Medium; bundle and runtime compatibility spike |
| DBML | `@softwaretechnik/dbml-renderer` in `dbml/index.js` | Direct Worker library call | Medium; bundle and runtime compatibility spike |
| Nomnoml | `nomnoml.renderSvg()` in `nomnoml/index.js` | Direct Worker library call | High |
| WaveDrom | JSON5 + `wavedrom.renderAny()` + ONML serialization | Direct Worker library call | High |
| Vega | `vega.View(...).toSVG()` in the Deno executable | Worker library call with `vega-interpreter` | Medium-high |
| Vega-Lite | Compile to Vega, then the same SVG path | Worker library call with `vega-interpreter` | Medium-high |

Standard Vega expressions use dynamic function generation, which is not allowed in Workers. The Worker implementation must use `vega-interpreter` and must define a strict policy for URL-based data loading. SVG is the initial output; Canvas-backed PNG/PDF is a separate concern.

### TypeScript adapters around WebAssembly

| Catalog type | V2 renderer | Preview | Static SVG | Confidence and caveat |
| --- | --- | --- | --- | --- |
| GraphViz | `@viz-js/viz` | Browser or edge | Worker | High |
| D2 | Official D2 WebAssembly | Browser | Worker adapter | High in browser, medium at edge; the published browser package uses a Web Worker, so the edge path needs a direct precompiled-WASM adapter |
| Pikchr | Existing C/WebAssembly build | Browser or edge | Worker | High |
| Svgbob | Existing Rust/WebAssembly build | Browser or edge | Worker | Medium; parity-test fonts, layout, and SVG structure |
| GoAT | Go/WebAssembly feasibility spike | Browser if successful | Worker if successful | Experimental; retain origin until a maintainable adapter proves parity |

Cloudflare Workers require WebAssembly modules to be compiled ahead of time and imported with the bundle. Adapters must not depend on runtime compilation, browser worker threads, or shared-memory threading.

### Official client-side renderers

These engines should primarily stop being live-preview server responsibilities.

| Catalog type | Browser implementation | Static SVG plan | Caveat |
| --- | --- | --- | --- |
| Mermaid | Official `mermaid.render()` | Worker/browser-render service initially, then a compatible edge adapter if justified | Use the official renderer; alternative Mermaid-like renderers have syntax and visual differences |
| PlantUML | Official TeaVM/browser implementation using Viz.js | Origin initially | Bundle compatible standard-library assets; the browser implementation's worker/coroutine assumptions make edge use a separate project |
| C4-PlantUML | PlantUML browser path plus pinned C4 macros/includes | Origin initially | Pin and test the precise macro set rather than permitting arbitrary remote includes |
| BPMN | `bpmn-js`: import XML and export SVG | Frozen SVG or browser-render service | No backend renderer is required for normal preview/export |
| Excalidraw | Official `exportToSvg()` | Frozen SVG or browser-render service | Lazy-load fonts and assets; preserve Excalidraw semantics |
| diagrams.net | Official client export application/iframe | Existing origin fallback initially | Large asset surface and complex integration; isolate it from the core application bundle |
| UMLet | UMLetino/GWT web implementation | Origin initially | Requires an adapter and parity spike before removing the fallback |

Untrusted source must be rendered in a sandboxed iframe, not directly in the application document. The frame should receive source by `postMessage`, render with self-hosted immutable assets, block external requests in secure mode, serialize the result, and return it to the parent. The parent should sanitize the SVG and display it through a Blob-backed image rather than inserting raw renderer markup into the application DOM.

### Reuse the upstream ERD and BlockDiag implementations

ERD and the `*Diag` family should not remain origin responsibilities merely because their current implementations are Haskell or Python. The first choice should be to preserve and reuse upstream behavior, not to translate their languages into a merely similar renderer.

#### What Kroki currently does

Kroki does not contain a separate ERD or BlockDiag renderer:

- `Erd.java` invokes the upstream `erd` executable with `--fmt=<format>`.
- `Blockdiag.java` invokes one bundled executable with `--module=blockdiag|seqdiag|actdiag|nwdiag|packetdiag|rackdiag`.
- The server image takes ERD 0.2.3 from `ghcr.io/yuzutech/erd`.
- The server image downloads `yuzutech/blockdiag` 3.4.2, a maintained packaging/compatibility fork of the Apache-licensed BlockDiag core. Its release workflow installs the upstream SeqDiag, ActDiag, and NwDiag packages and compiles all six commands into one Nuitka binary.

The existing Java code is therefore a process adapter. V2 can remove the Java/subprocess/container boundary while retaining the upstream parsers, models, layout, and SVG behavior.

#### ERD: port the small upstream seam, keep GraphViz

[BurntSushi/erd](https://github.com/BurntSushi/erd) is Unlicense-licensed and already delegates visualization to GraphViz. The useful source seams are compact:

| Upstream module | Approximate size | Responsibility to preserve |
| --- | ---: | --- |
| `src/Text/Parsec/Erd/Parser.hs` | 162 lines | Entities, attributes, relations, directives, quoted identifiers, comments, and source errors |
| `src/Erd/ER.hs` | 201 lines | Domain model, option validation/defaults, PK/FK flags, and four cardinalities |
| `src/Erd/Parse.hs` | 88 lines | AST-to-model conversion, ordering, defaults, and relationship validation |
| `app/Main.hs` plus `src/Erd/Render.hs` | roughly 180 relevant lines | DOT graph construction, HTML-table entity labels, UML/IE cardinalities, and GraphViz attributes |

The v2 ERD path should therefore be:

```text
upstream-compatible `er` parser
  -> upstream-compatible ER model/defaults
  -> typed DOT builder
  -> GraphViz WASM
  -> sanitize/decorate SVG
```

This is a source-guided TypeScript port, not a new ERD design. Port the upstream tests and examples first. Use a typed DOT builder or strict escaping instead of concatenating user strings into DOT. Preserve the current Kroki contract: source directives are accepted, but arbitrary filesystem configuration is not exposed. Mermaid ER can remain an optional future presentation backend; it should not be the compatibility implementation.

#### BlockDiag family: run upstream Python in a Worker first

The BlockDiag organization publishes four Apache-2.0 projects:

- `blockdiag`, containing the shared parser, model, layout, shape renderers, and SVG backend;
- `seqdiag`;
- `actdiag`;
- `nwdiag`, which also contains `packetdiag` and `rackdiag`.

The packages already have the separation a Worker adapter needs:

```text
parser.py
  -> builder.py + elements.py
  -> metrics.py (layout and routing)
  -> drawer.py + node renderers
  -> imagedraw/svg.py
  -> SVG string
```

The production packages are not tiny—approximately 8.5K Python source lines for BlockDiag core, 1.7K for SeqDiag, 1.0K for ActDiag, and 3.0K for the NwDiag/PacketDiag/RackDiag package, excluding tests. Reimplementing that behavior in TypeScript before attempting direct reuse would create unnecessary compatibility risk.

A dedicated Python Worker is plausible:

- Python Workers run CPython through Pyodide and snapshot imported modules at deployment to reduce cold-start initialization.
- The BlockDiag-family packages, `funcparserlib`, and `webcolors` are pure Python.
- SVG output is produced directly; it does not require GraphViz or a subprocess.
- Pillow supplies font metrics, and Pillow is included in current Pyodide builds.
- ReportLab is optional and can be omitted because v2 is SVG-first.
- The Kroki-maintained BlockDiag fork already changed the SVG path to return a string when no output filename is supplied and already supports selecting the six modules from one entry point.

Research smoke check on 2026-08-20: the BlockDiag 3.4.2 fork and the source checkouts of SeqDiag, ActDiag, and NwDiag 3.0.0 were installed into a clean CPython 3.14 virtual environment without the Nuitka bundle. The repository's seven-line-to-medium examples were passed through each source-installed module in SVG mode:

| Module | Exit | Parsed SVG | Output size |
| --- | ---: | --- | ---: |
| BlockDiag | 0 | yes | 3,675 bytes |
| SeqDiag | 0 | yes | 4,013 bytes |
| ActDiag | 0 | yes | 3,427 bytes |
| NwDiag | 0 | yes | 5,260 bytes |
| PacketDiag | 0 | yes | 13,314 bytes |
| RackDiag | 0 | yes | 5,741 bytes |

This proves the source packages do not depend on Kroki's compiled bundle for SVG rendering. It does not prove Pyodide compatibility or acceptable Worker performance; those remain the purpose of the Cloudflare spike.

The Worker should import the library rather than emulate its command line. Add a narrow entry point such as:

```py
def render_svg(source: str, module: str, options: dict[str, object]) -> str:
    parsed = module.parser.parse_string(source)
    diagram = module.builder.ScreenNodeBuilder.build(parsed, options)
    drawer = module.drawer.DiagramDraw("SVG", diagram, filename=None, ...)
    drawer.draw()
    return drawer.save()
```

That sketch is illustrative; the adapter must construct the upstream option and font-map objects correctly rather than passing an arbitrary dictionary into APIs that do not accept it.

The Python Worker spike must settle these issues before this path is declared production-ready:

- Pin and vendor the BlockDiag 3.4.2 compatibility fork plus the 3.0.0 SeqDiag, ActDiag, and NwDiag-family sources. Do not resolve unpinned PyPI packages at runtime.
- Bundle the same known font used by the current service and verify Pillow can load it in Pyodide. Font metrics affect layout and are part of output compatibility.
- Replace dynamic package-entry-point discovery with a static allowlist of SVG drawers, node renderers, and the six known modules.
- Disable filesystem paths and remote image loading. Upstream can open URLs synchronously and cache temporary files; that is both incompatible with the Worker security model and outside diagram.zip's no-surprise network policy.
- Remove ReportLab, PNG, antialias, config-file, and CLI-only paths from the deployed package graph. Keep the upstream source behavior for SVG rather than carrying unused output stacks.
- Audit module-level caches and registries for isolate concurrency. Initialization can be shared; request-specific source, diagrams, files, and output cannot.
- Normalize parser failures into source-positioned diagram.zip errors and sanitize every returned SVG.
- Measure compressed bundle size, snapshot/startup time, warm CPU, peak memory, and cancellation behavior for every module.

Because Python Workers are still beta and PyEmscripten package support is evolving, keep the current origin binary as the rollout fallback. If the Python Worker misses the performance or compatibility bar, the next choice is a TypeScript port of the upstream parser/model/layout/SVG layers using their Apache-2.0 source and golden fixtures. Lowering to GraphViz, D2, Mermaid, or PlantUML is a later fallback because it changes the layout engine and increases visual drift.

#### Reuse decision

| Catalog type | Primary v2 target | Compatibility fallback | Later fallback if Python Workers fail |
| --- | --- | --- | --- |
| ERD | Upstream-guided TypeScript parser/model/DOT emitter + GraphViz WASM | Existing ERD executable | None needed unless upstream parity proves unexpectedly difficult |
| BlockDiag | Upstream Python package in `render-python` | Existing bundled executable | Port upstream layout/SVG implementation to TypeScript |
| SeqDiag | Upstream Python package in `render-python` | Existing bundled executable | Port upstream implementation; Mermaid lowering only if explicitly accepted as non-identical |
| ActDiag | Upstream Python package in `render-python` | Existing bundled executable | Port upstream implementation; alternative activity renderer only if explicitly accepted |
| NwDiag | Upstream Python package in `render-python` | Existing bundled executable | Port upstream implementation; D2/GraphViz lowering is secondary |
| PacketDiag | Upstream Python package in `render-python` | Existing bundled executable | Port its deterministic geometry to TypeScript |
| RackDiag | Upstream Python package in `render-python` | Existing bundled executable | Port its deterministic geometry to TypeScript |

Unsupported source features must fail clearly or use the compatibility origin; they must not be silently dropped. Preserve upstream licenses and notices in vendored packages and document the exact upstream commit and local patch set used to build each Worker.

### Structurizr: compile the DSL to PlantUML in TypeScript

Structurizr does not need a dedicated renderer in v2. Kroki already treats it as a compiler front end for PlantUML:

```text
Structurizr DSL
  -> StructurizrDslParser
  -> Workspace model and view selection
  -> bundled theme application
  -> StructurizrPlantUMLExporter
  -> PlantUML source for the diagram or legend
  -> the normal PlantUML renderer
```

The current adapter supports six view classes: system landscape, system context, container, component, dynamic, and deployment. It selects the first view by default or the view named by `view-key`, supports `output=diagram|legend`, applies a small allowlist of bundled Structurizr themes, and then hands the generated definition to the same PlantUML command used elsewhere. The dedicated Structurizr responsibility ends before graphics rendering begins.

The v2 replacement should preserve that boundary as a reusable TypeScript package:

```ts
interface StructurizrCompileOptions {
  viewKey?: string;
  output?: "diagram" | "legend";
  colorScheme?: "light" | "dark";
}

interface StructurizrCompileResult {
  plantuml: string;
  viewKey: string;
  viewType:
    | "system-landscape"
    | "system-context"
    | "container"
    | "component"
    | "dynamic"
    | "deployment";
  warnings: Array<{ message: string; line?: number; column?: number }>;
}

declare function compileStructurizr(
  source: string,
  options?: StructurizrCompileOptions,
): StructurizrCompileResult;
```

The package should be runtime-neutral and deterministic. Browser preview can run it in a Web Worker and pass the result to the PlantUML TeaVM renderer. A Cloudflare Worker can run the same compiler for static requests and pass the generated PlantUML to the shared PlantUML compatibility origin until the static PlantUML path itself moves off origin. This removes a Structurizr-specific JVM service even before PlantUML becomes fully edge-native.

#### Existing non-Java implementations are seeds, not replacements

There are useful community projects, but none should be adopted as the compatibility implementation without substantial work:

| Project | Useful part | Gap for diagram.zip |
| --- | --- | --- |
| [`structurizr-parser`](https://github.com/gerry-rohling/structurizr-parser) | MIT-licensed TypeScript lexer/parser/interpreter built with Chevrotain; already produces a Structurizr JSON-shaped workspace | Explicitly beta and incomplete; no PlantUML exporter and incomplete current DSL semantics |
| [`structurizr-typescript`](https://github.com/ChristianEder/structurizr-typescript) | TypeScript model classes and some view/style concepts | It is a code-first model API, not a Structurizr DSL parser; its documented exclusions include dynamic diagrams |
| [`tree-sitter-structurizr`](https://github.com/sinon/tree-sitter-structurizr) | Strong syntax grammar and editor-oriented symbol/reference analysis | Its own design explicitly avoids becoming an unofficial Structurizr runtime; useful for highlighting, not view execution |
| [`structurizr-rs`](https://github.com/Helms-AI/structurizr-rs) | Rust parser/model and a compact C4-PlantUML exporter that may supply tests or implementation ideas | Its exporter emits C4-PlantUML rather than Structurizr PlantUML, and its current parser is not compatible with the Kroki corpus |

Research spike on 2026-08-20:

- `structurizr-parser` 0.4.0 built to approximately 54 KB of ESM JavaScript and its own 13 tests passed.
- Running its lexer, parser, and interpreter against Kroki's seven Structurizr fixtures resulted in one complete pass (`bigbank.structurizr`). The basic current getting-started source, default theme placement, AWS deployment-node tags, documentation directive, and script fixture exposed unsupported or incompatible grammar paths.
- The current `structurizr-rs` parser accepted one of the seven fixtures in the same smoke check; its PlantUML exporter is a roughly 900-line C4-PlantUML emitter and is not output-compatible with Kroki's `StructurizrPlantUMLExporter`.
- The official Structurizr 6.2.2 source remains the conformance reference. Its Apache-2.0 Java implementation contains approximately 11.5K DSL lines, 14.3K core-model lines, and 2.4K lines in the PlantUML exporter package. Those totals include behavior diagram.zip does not need, but demonstrate that this is a semantic compiler rather than a small grammar substitution.

Use `structurizr-parser` as a forked lexer/CST starting point, not as an unmodified dependency. Upgrade its dependencies, remove build-only packages from the runtime graph, and replace or extend its interpreter against the official Structurizr JSON schema and Java tests. The official Apache-2.0 parser, model, and exporter are the behavioral specification; the existing TypeScript package is an implementation accelerator.

#### Port boundary

The first compatible package needs these layers:

1. A line-aware lexer and parser with Structurizr's optional positional arguments, case-insensitive keywords, comments, identifiers, nested blocks, and source-positioned errors.
2. A workspace model for people, software systems, containers, components, deployment nodes and instances, infrastructure nodes, relationships, groups, tags, properties, and the six supported view types.
3. Identifier/reference resolution, implied relationships, include/exclude view expressions, animation steps, automatic-layout properties, and view selection.
4. Element and relationship style cascading plus deterministic application of pinned, locally bundled themes.
5. A source-guided TypeScript port of `StructurizrPlantUMLExporter`, including titles, boundaries, groups, sequence/collaboration handling, icons, styles, links, automatic diagram legends, and PlantUML escaping.

Do not initially implement execution-oriented or storage-oriented features that do not fit diagram.zip: plugins, scripts, component finders, filesystem includes, workspace extension, documentation, ADR imports, or arbitrary network theme/icon loading. Reject these with precise diagnostics and use the compatibility origin only during the migration window. Built-in themes and any allowed standard-library assets should be pinned into the deployment so identical static links do not change as remote content changes.

#### Parity and rollout

Add a small Java fixture tool before writing the TypeScript exporter. For each source, view key, output mode, and color scheme, it should save the official intermediate PlantUML definition in addition to the final SVG. The TypeScript compiler then has two independent gates:

- normalized PlantUML parity for structure, styles, labels, and escaping;
- SVG or perceptual parity after both definitions pass through the same pinned PlantUML build.

Build the corpus from Kroki's current fixtures plus the upstream Structurizr DSL and exporter tests. Cover all six supported view types, nested identifiers, relationship expressions, deployment instances, groups, custom styles, every bundled theme, diagram and legend output, missing views, and rejected unsafe directives. Ship the TypeScript path behind an engine flag; fall back only for recognized unsupported syntax, never after an arbitrary compiler exception.

The resulting primary path is:

```text
Structurizr DSL
  -> @diagram-zip/structurizr (TypeScript)
  -> PlantUML definition
  -> browser PlantUML for live preview
  -> shared PlantUML static path for immutable SVG
```

This is substantial compatibility work, but it is bounded and removes Structurizr from the list of engines needing its own retained JVM origin.

### Residual compatibility origin

| Catalog type | Reason | Potential replacement |
| --- | --- | --- |
| Ditaa | Java/native ASCII-art recognition behavior | A compatible TypeScript ASCII renderer after a parity corpus exists |
| Symbolator | Python/native dependencies | Keep on origin until traffic justifies a rewrite |
| TikZ | Full TeX toolchain | Keep on origin; it is not a reasonable Worker port |
| WireViz | Python/YAML plus Graphviz composition | TypeScript parser and intermediate representation targeting GraphViz WebAssembly |
| GoAT | No proven maintained browser/Worker package | Go/WebAssembly spike; otherwise retain origin |

The origin is a compatibility bridge, not the target architecture for standardized diagram families. It should be consolidated for organization and operational efficiency. A separate public Fly app per renderer is not a product requirement. One application can contain grouped machines or services, with internal routing and enough isolation for the few engines that need it. Split an engine only when its resource profile, security boundary, release cadence, or failure mode warrants independent deployment.

## All 30 catalog types at a glance

| Type | Primary v2 path | Initial fallback |
| --- | --- | --- |
| PlantUML | Client | Origin |
| Mermaid | Client | Browser-render/origin |
| GraphViz | Edge WebAssembly | Origin |
| D2 | Client + edge WebAssembly adapter | Origin |
| C4-PlantUML | Client | Origin |
| BlockDiag | Upstream Python Worker | Existing bundled executable |
| SeqDiag | Upstream Python Worker | Existing bundled executable |
| ActDiag | Upstream Python Worker | Existing bundled executable |
| NwDiag | Upstream Python Worker | Existing bundled executable |
| PacketDiag | Upstream Python Worker | Existing bundled executable |
| RackDiag | Upstream Python Worker | Existing bundled executable |
| BPMN | Client | Browser-render/origin |
| Bytefield | Edge JavaScript | Origin |
| DBML | Edge JavaScript | Origin |
| diagrams.net | Client | Origin |
| Ditaa | Origin | Origin |
| ERD | Upstream-guided TypeScript port to GraphViz WASM | Existing ERD executable |
| Excalidraw | Client | Browser-render/origin |
| GoAT | WebAssembly spike | Origin |
| Nomnoml | Edge JavaScript | Origin |
| Pikchr | Edge WebAssembly | Origin |
| Structurizr | TypeScript DSL-to-PlantUML compiler; browser PlantUML preview | Existing Structurizr/PlantUML path |
| Svgbob | Edge WebAssembly | Origin |
| Symbolator | Origin | Origin |
| TikZ | Origin | Origin |
| UMLet | Client | Origin |
| Vega | Edge JavaScript with interpreter | Origin |
| Vega-Lite | Edge JavaScript with interpreter | Origin |
| WaveDrom | Edge JavaScript | Origin |
| WireViz | Origin; rewrite candidate | Origin |

The first coverage milestone puts all 30 catalog types behind one contract and keeps unsupported edge engines on the origin. Its first native cohort is Bytefield, Nomnoml, WaveDrom, Vega, and Vega-Lite. DBML remains on the origin because its published package mixes module formats; GraphViz remains there because the published Viz.js wrapper instantiates WebAssembly at runtime. D2, Pikchr, and Svgbob move only after direct precompiled-Wasm adapters are proven. Seven engines can later move interactive preview into the browser: Mermaid, PlantUML, C4-PlantUML, BPMN, Excalidraw, diagrams.net, and UMLet.

The upstream-reuse milestone then moves all six BlockDiag-family types into one Python Worker, moves ERD to an upstream-guided TypeScript/GraphViz implementation, and compiles Structurizr to PlantUML in TypeScript. At that point the target split is 17 edge-rendered types, eight client/pipeline-rendered types, and five types requiring a compatibility origin: Ditaa, GoAT, Symbolator, TikZ, and WireViz. A successful GoAT WebAssembly adapter reduces the origin set to four.

## Rendering contract

The application should depend on one adapter contract instead of process-specific clients:

```ts
type EngineRuntime = "edge-js" | "edge-wasm" | "edge-python" | "client" | "origin";

interface RenderRequest {
  engine: EngineId;
  source: string;
  format: "svg";
  options: Record<string, string>;
}

interface RenderResult {
  body: string | Uint8Array;
  contentType: "image/svg+xml";
  engineVersion: string;
}

interface RendererAdapter {
  id: EngineId;
  runtime: EngineRuntime;
  version: string;
  render(request: RenderRequest, signal: AbortSignal): Promise<RenderResult>;
}
```

Source-dialect compatibility is a separate interface from rendering:

```ts
interface SourceCompiler<TIntermediate, TTarget> {
  parse(source: string): TIntermediate;
  lower(intermediate: TIntermediate): TTarget;
}
```

Keeping these contracts separate lets ERD port its upstream parser and DOT mapping without coupling them to GraphViz execution. The BlockDiag Python path uses the upstream model directly and does not need this TypeScript compiler interface. Parser errors should retain offsets into the original source; backend errors should be translated into the diagram.zip error envelope.

Base rendering and presentation must remain separate:

```text
decode -> validate -> render base SVG -> sanitize -> decorate -> sanitize -> respond
```

The base render cache key should include engine, renderer version, source, render-affecting options, and output format. Title, description, background, padding, and framing can be applied after the base cache so presentation variants do not repeat expensive rendering.

Do not recolor the diagram to match the application theme. Presentation may set the canvas background and padding, but renderer output remains authoritative. Dark-mode support is a renderer-capability problem and remains a TODO until it can be implemented without generic SVG color rewriting.

## Caching and storage policy

Use the Worker Cache API for transient render responses. Cache entries are data-center-local, so the implementation tolerates misses and never relies on the cache for correctness. Keys include the full normalized render request and a renderer-build version; splitting base-render and presentation caches is a later optimization.

D1 is the durable alias/control plane. R2 stores immutable, content-addressed source bundles and saved SVG/PNG render blobs. Alias updates create new objects and atomically repoint metadata; they do not overwrite content-addressed data. R2 object names are hashes, while public aliases remain short random identifiers. Locked objects are encrypted in the browser before upload. KV is not authoritative alias storage because its eventual consistency is a poor fit for compare-and-swap updates.

Cache only successful, size-bounded, sanitized outputs. Normalize errors at the edge so implementation details, internal hostnames, commands, stack traces, and raw Kroki configuration messages never reach the user.

## Cancellation and concurrency

Every adapter receives an `AbortSignal`. The browser cancels the preceding render when source, engine, or options change. The web Worker propagates cancellation through service bindings and origin fetches. Adapters should check cancellation around expensive phases where the underlying library cannot be interrupted directly.

Worker modules may keep immutable initialized renderer state or a concurrency-safe initialization promise at module scope. They must not put request-specific mutable state in globals. CPU-heavy adapters need per-request limits and input-size limits even when the public URL itself is within bounds.

## Migration plan

### Phase 0: coverage plane and smoke matrix

- Register all 30 catalog engines behind one runtime-neutral request and response contract.
- Send one real repository fixture through every route and require successful, structurally valid, dimensioned SVG.
- Sanitize every output and reject prohibited active or external content.
- Record known feature loss per engine when encountered; do not make byte, pixel, or perceptual parity a gate for this push.
- Measure only hard platform feasibility constraints during migration: bundle size, startup failure, runtime incompatibility, timeouts, and resource-limit violations.
- Add focused regressions for failures observed in the product, including Pikchr image loading and Svgbob presentation padding.

### Phase 1: direct JavaScript engines

Move Nomnoml, WaveDrom, and Bytefield, then Vega and Vega-Lite using `vega-interpreter` and a no-network data policy. Keep DBML on the compatibility origin until its mixed-module package can be safely repackaged.

### Phase 2: WebAssembly engines

Move GraphViz and Pikchr, then Svgbob. Adapt D2's underlying WebAssembly directly for the edge instead of assuming its browser Web Worker wrapper will run in a Worker.

### Phase 3: upstream BlockDiag Python Worker

Build an SVG-only Python Worker from the pinned BlockDiag-family sources. Start with RackDiag and PacketDiag smoke tests, then run the complete BlockDiag, SeqDiag, ActDiag, and NwDiag fixture suites. Compare it to the current 3.4.2 bundle for output, errors, cold/warm latency, CPU, memory, and cancellation. Route only passing modules to the Worker; retain per-module origin fallback.

### Phase 4: upstream-guided ERD port

Port the upstream ERD grammar, model, defaults, validation, and DOT mapping to TypeScript. Import its tests and examples, compare generated DOT and SVG semantics with ERD 0.2.3, and render through the GraphViz WebAssembly adapter. Do not broaden the language during the compatibility phase.

### Phase 5: client-native preview

Move Mermaid first because of its likely usage and mature browser API. Follow with BPMN and Excalidraw, then PlantUML/C4, UMLet, and diagrams.net. Keep the gateway fallback available until browser preview and saved static render routes cover each engine reliably.

### Phase 6: consolidate the origin

Place the residual engines behind one private compatibility service with grouped machines. Preserve independent resource limits and subprocess isolation inside the service. Remove public engine-specific applications after traffic, health checks, and rollback behavior are proven.

### Phase 7: replace origin engines by value

Use production traffic and latency data to choose the remaining rewrites. WireViz is promising because GraphViz WebAssembly can absorb its layout responsibility. TikZ should remain containerized.

## Acceptance criteria

- Existing source and render-affecting options work across the compatibility corpus.
- Client-native engines make no renderer server call during normal live preview.
- A static link renders cold without loading the editor application.
- Title, description, background, padding, and framing survive in a saved SVG.
- Renderer-defined colors are not overwritten by application theming.
- Secure mode blocks scripts, event handlers, external resources, and arbitrary remote includes.
- Superseded renders are cancelled and do not replace newer output.
- Open diagrams persist source, metadata, and saved renders through D1 pointers and immutable R2 objects; locked diagrams persist only browser-encrypted equivalents.
- Cache keys include the renderer version and every render-affecting option.
- Errors use a stable product envelope and do not leak Kroki or infrastructure internals.
- Each Worker remains within current Cloudflare bundle, startup, memory, and CPU limits.
- Every engine has an explicit runtime and fallback; there is no silent substitution with a merely similar renderer.
- Vendored upstream renderer code records its exact version or commit, license, local patches, and imported upstream test corpus.
- The BlockDiag-family Worker either passes its module's compatibility and performance gate or remains routed to the existing binary; migration is not all-or-nothing.

## Open design questions

- Whether transient source renders promise renderer-version stability or always use the current renderer.
- Whether Browser Rendering is acceptable as a temporary static-export service for client-only engines, given its latency and cost relative to saved SVG blobs.
- What level of visual drift is acceptable when an official browser renderer and the current origin renderer use different versions or layout engines.
- Whether Python Workers have left beta and whether the pinned Pyodide/Pillow combination meets the measured BlockDiag cold-start, memory, and CPU budget at implementation time.

## Implementation status — 2026-08-20

The first coverage plane is implemented in `diagramzip-render`. Its catalog contains all 30 engines, five execute directly in the Worker, and 25 use the Fly compatibility origin. The repository smoke sends a real fixture through each entry and currently reports 30/30 structurally valid SVG results. The Worker also centralizes bounded JSON validation, error normalization, build-versioned Cache API entries, SVG sanitization, metadata, background, padding, and framing. Pixel comparison is intentionally deferred.

The first feasibility findings are already reflected in routing and the loss ledger: DBML's package cannot currently be imported cleanly in the Worker runtime, and Viz.js attempts runtime WebAssembly compilation. Both remain fully covered through the origin rather than blocking the migration. The current dry-run bundle is approximately 4.4 MB uncompressed and 0.85 MB compressed.

The SVG compatibility boundary preserves CDATA-backed text and embedded font styles used by Ditaa, Symbolator, diagrams.net, and TikZ. Mermaid retains a narrow allowlist of XHTML label formatting inside `foreignObject`, while scripts, event handlers, external links, and resource-loading elements remain blocked. When a user selects a canvas color, known full-size white renderer backdrops are removed before the chosen background is applied; internal white diagram shapes are left intact.

## Primary implementation references

- [Cloudflare Workers TypeScript](https://developers.cloudflare.com/workers/languages/typescript/)
- [Cloudflare Python Workers](https://developers.cloudflare.com/workers/languages/python/)
- [How Python Workers run and snapshot Pyodide](https://developers.cloudflare.com/workers/languages/python/how-python-workers-work/)
- [Packages supported in Python Workers](https://developers.cloudflare.com/workers/languages/python/packages/)
- [Packages included with Pyodide](https://pyodide.org/en/stable/usage/packages-in-pyodide.html)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [WebAssembly in Workers](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)
- [Cloudflare bindings and service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)
- [Mermaid browser usage](https://mermaid.js.org/config/usage.html)
- [Mermaid entity-relationship diagrams](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)
- [Mermaid sequence diagrams](https://mermaid.js.org/syntax/sequenceDiagram.html)
- [BurntSushi ERD](https://github.com/BurntSushi/erd)
- [BlockDiag](https://github.com/blockdiag/blockdiag)
- [SeqDiag](https://github.com/blockdiag/seqdiag)
- [ActDiag](https://github.com/blockdiag/actdiag)
- [NwDiag, PacketDiag, and RackDiag](https://github.com/blockdiag/nwdiag)
- [Kroki-maintained BlockDiag compatibility fork](https://github.com/yuzutech/blockdiag)
- [PlantUML browser API](https://plantuml.github.io/plantuml/javadoc/net/sourceforge/plantuml/teavm/browser/PlantUMLBrowser.html)
- [bpmn-js walkthrough](https://bpmn.io/toolkit/bpmn-js/walkthrough/)
- [Excalidraw](https://github.com/excalidraw/excalidraw)
- [diagrams.net](https://github.com/jgraph/drawio)
- [Viz.js](https://github.com/mdaines/viz-js)
- [D2 WebAssembly package](https://www.npmjs.com/package/@terrastruct/d2)
- [Pikchr WebAssembly build](https://fossil-scm.org/home/doc/pikchrshow-wasm/www/build.wiki)
- [Vega interpreter](https://www.npmjs.com/package/vega-interpreter)
- [Nomnoml](https://www.npmjs.com/package/nomnoml)
- [WaveDrom](https://www.npmjs.com/package/wavedrom)
