# Third-party notices and component manifest

## License scope

Except where otherwise noted, original DiagramZip code is licensed under the
root [MIT License](LICENSE). This repository is a multi-license distribution:
third-party source, generated artifacts, fonts, and visual assets retain their
own licenses and terms. A license listed below applies to the identified
component or combined deployable unit; it does not automatically relicense an
independent service or the repository as a whole.

The component and path mapping below is the repository-level source of truth.
Nested notices provide versions, revisions, hashes, modifications, dependency
details, and complete legal texts. Lockfile presence alone is not treated as
evidence that a dependency is included in a shipped artifact.

## Project history

DiagramZip began with an import of [Kroki](https://github.com/yuzutech/kroki)
v0.32.1 at commit `99f285a0d50c3882e20dc449b63c5358aa889b83`,
under the MIT License.

Copyright (c) 2020-present Kroki and its contributors.

Retained foundation code may continue to use `io.kroki`, `KROKI_*`, `@kroki/*`,
or Kroki-compatible HTTP names where changing them would break compatibility
or obscure upstream provenance. Those identifiers do not identify the
DiagramZip product, repository, or hosted service.

## Application and service manifest

| Paths or deliverable | Material | License and scope | Detailed record |
| --- | --- | --- | --- |
| `apps/editor/`, `services/`, `renderers/catalog/`, `renderers/shared/`, `shared/` | Original DiagramZip application and service code | MIT | [LICENSE](LICENSE) |
| Editor browser bundle | Monaco Editor, pako, saxes, and emitted transitive runtime code | Permissive upstream licenses; the current build does not emit a consolidated artifact notice | `package-lock.json` is a dependency inventory, not a shipped-artifact manifest |
| `apps/docs/` | Docusaurus and documentation runtime dependencies | Permissive upstream licenses; the current build does not emit a consolidated artifact notice | `apps/docs/package-lock.json` is a dependency inventory, not a shipped-artifact manifest |
| Retained Kroki foundation | Source retained from the recorded Kroki import | MIT | This file and [LICENSE](LICENSE) |

## Renderer component manifest

| Renderer paths or deployable unit | Third-party material | License and effective boundary | Detailed record or full text |
| --- | --- | --- | --- |
| `renderers/client/mermaid/` | Mermaid 11.17.0 and its emitted browser dependencies | Mermaid is MIT; browser bundle is delivered to recipients | [Mermaid text](licenses/mermaid-license.txt), package lock |
| `renderers/client/diagramsnet/` | diagrams.net 29.6.1 export runtime, shapes, stencils, images, and math assets | Application code is Apache-2.0; visual assets retain the additional diagrams.net terms. The built client publishes both beside the bundle | [renderer notice](renderers/client/diagramsnet/README.md), nested `vendor/assets/*/LICENSE` files |
| `renderers/client/tikz/` | `@planktimerr/tikzjax` 1.0.63 plus TeX/TikZ assets | The deployable browser unit is GPL-3.0-or-later; bundled TeX/TikZ material is LPPL-1.3c. Corresponding source and terms are published on the renderer origin | [renderer notice](renderers/client/tikz/README.md), `vendor-licenses/` |
| `renderers/python/wireviz-translator/` | Vendored WireViz release source and PyYAML | The in-process combined Worker unit is GPL-3.0-only; PyYAML is MIT. Separate services reached over HTTP or a service binding are outside this Python program | [unit scope](renderers/python/wireviz-translator/README.md), [notices](renderers/python/wireviz-translator/THIRD_PARTY_NOTICES.md) |
| `renderers/python/blockdiag-family/` | Vendored BlockDiag, SeqDiag, ActDiag, NwDiag family; Pillow, funcparserlib, webcolors, defusedxml; DejaVu Serif | Apache-2.0 renderer sources with HPND, BSD-3-Clause, PSF, and Bitstream/public-domain dependency and font terms | [notices](renderers/python/blockdiag-family/THIRD_PARTY_NOTICES.md), `vendor-licenses/` |
| `renderers/python/symbolator/` | Symbolator is the compatibility target only | DiagramZip reimplementation is MIT; no upstream Cairo/Pango implementation is vendored | [notice](renderers/python/symbolator/THIRD_PARTY_NOTICES.md) |
| Bytefield Worker | `bytefield-svg` 1.11.0 | EPL-2.0 dependency inside the emitted Worker; EPL scope remains with the covered program/files | [EPL text](licenses/bytefield-license.txt), generated npm runtime notice |
| D2 Worker and `renderers/edge/artifacts/d2/` | D2 0.7.1 custom Wasm build and locked Go dependencies | D2 is MPL-2.0 file-level copyleft; other compiled modules retain their permissive licenses | [provenance](renderers/edge/artifacts/d2/provenance.md), `toolchains/d2/source/go.mod`, `go.sum` |
| GoAT Worker and `renderers/edge/artifacts/goat/` | GoAT 0.5.1, parse/v2, and TinyGo-produced Wasm | GoAT and parse/v2 are permissively licensed; vendored modifications retain those terms | [provenance](renderers/edge/artifacts/goat/provenance.md), nested vendor licenses |
| GraphViz family Worker | GraphViz 15.1.1, Viz.js, Expat, DBML renderer, Zod | GraphViz and Bytefield portions are EPL-2.0; Viz.js, Expat, and Zod are MIT; DBML renderer is ISC | [Viz notice](renderers/edge/artifacts/licenses/viz-js-NOTICE), [DBML notice](renderers/edge/artifacts/licenses/dbml-renderer-NOTICE), generated npm runtime notice |
| PlantUML family Worker | `@plantuml/core` 1.2026.6 with embedded GraphViz 14.1.1 | PlantUML core is MIT; the embedded GraphViz portion remains EPL-2.0 | [PlantUML notice](renderers/edge/artifacts/licenses/plantuml-core-NOTICE), generated npm runtime notice |
| Svgbob/Ditaa Worker and `renderers/edge/artifacts/svgbob/` | Svgbob 0.7.6 Wasm and its locked Rust dependency graph | Svgbob is Apache-2.0; compiled crates retain their recorded licenses. Ditaa syntax is translated without bundling Ditaa | [provenance](renderers/edge/artifacts/svgbob/svgbob-provenance.md), [Apache text](renderers/edge/artifacts/svgbob/svgbob-LICENSE.txt), `toolchains/svgbob/Cargo.lock` |
| Pikchr Worker and `renderers/edge/artifacts/pikchr/` | Pikchr Wasm | 0BSD | [provenance](renderers/edge/artifacts/pikchr/pikchr-provenance.md), [text](licenses/pikchr-license.txt) |
| Nomnoml Worker | Nomnoml and Graphre | MIT | [Nomnoml text](licenses/nomnoml-license.txt), generated npm runtime notice |
| Vega family Worker | Vega 6.3.1, Vega-Lite 6.4.3, D3 and emitted transitive runtime packages | BSD-3-Clause, ISC, MIT, and other permissive terms, scoped to their packages | [Vega](licenses/vega-license.txt), [Vega-Lite](licenses/vega-lite-license.txt), generated npm runtime notice |
| WaveDrom Worker | WaveDrom 3.6.2 and emitted runtime packages | MIT and other permissive package terms | [WaveDrom text](licenses/wavedrom-license.txt), generated npm runtime notice |
| UMLet, ERD, Structurizr, and C4 lowering code under `renderers/edge/src/` | Format-compatible DiagramZip implementations | Original implementation code is MIT unless a file says otherwise; no UMLet, ERD, Structurizr, or C4 reference implementation is vendored | [LICENSE](LICENSE) |
| Remaining edge adapters and runtime | Original DiagramZip orchestration and sanitization code | MIT; dependencies used by each emitted Worker are determined from its bundle, not the entire edge lockfile | [generated npm runtime notice](renderers/edge/artifacts/licenses/npm-runtime-NOTICE.md) |

## Reference-only license texts

Some files under `licenses/` record the license of a compatibility target even
though its implementation is not included. They are retained to make that
distinction explicit, not because their copyleft terms govern the DiagramZip
implementation:

- `licenses/ditaa-mini-license.txt`: Ditaa is a syntax-compatibility path that
  translates to Svgbob; no Ditaa Java/native runtime is bundled.
- `licenses/umlet-license.txt`: the UMLet renderer is an original TypeScript
  implementation and does not vendor UMLet GPL source.
- `licenses/erd-unlicense.txt`: the ERD parser/lowerer is an original
  TypeScript implementation; the text records the compatibility target.
- `licenses/excalidraw-license.txt`: the catalog references a separately
  deployed Excalidraw client renderer whose source is not present in this
  repository. Its deployment must retain its own source and notice record.

The Symbolator relationship is documented beside that Worker rather than in
the root license directory.

## Artifact-specific notice generation

`renderers/edge/artifacts/licenses/npm-runtime-NOTICE.md` is generated from
Wrangler deploy metafiles for every `renderers/edge/config/units/*.jsonc`
configuration. It includes locked versions, declared licenses, consuming
Worker units, and complete license/notice texts for npm packages present in
the emitted bundles. Dependencies used only by Wrangler, tests, type checking,
or local builds are deliberately excluded.

Regenerate and verify it from `renderers/edge/`:

```sh
npm run generate:licenses
npm run check:licenses
```

Python units maintain deployment-specific notices beside their source.
TikZ and diagrams.net publish source and license material directly in their
built static asset directories.

The editor and documentation builds do not yet generate bundle-derived legal
notices. Their lockfiles are useful inputs to a future artifact-specific check,
but they contain development and build dependencies as well as code that may
reach the deployed bundles. This manifest deliberately does not present those
lockfiles as complete redistribution notices.

## Redistribution

This manifest is not a substitute for the referenced legal texts. A
redistributor should include the root MIT license plus the notices, source
availability statements, and complete terms for every renderer or artifact it
actually ships. A redistributor that omits a renderer should omit neither the
license of material it still ships nor claim that a reference-only license
applies to unrelated DiagramZip code.
