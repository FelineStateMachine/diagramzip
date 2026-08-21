# PlantUML direct-Worker vendor bundle

This directory vendors the exact browser artifacts used by the PlantUML-family
Worker unit.

- `plantuml.js`: `@plantuml/core@1.2026.6`, SHA-256
  `87b8c74c1b9520ee659f4d2c8de16ae19c9f21365856a53d0766a8fa602b24d8`.
  Package integrity, upstream commit, and license are recorded in
  `../licenses/plantuml-core-NOTICE`.
- `viz-global.cjs`: the official package's `viz-global.js` in its native UMD
  CommonJS form. It is patched only to replace Emscripten's dynamic
  `WebAssembly.instantiate` with a precompiled module bridge. It also replaces
  the Node-only `__filename` URL fallback with a fixed inert URL.
  SHA-256 after those two Worker-boundary changes:
  `f1aaf216e736c262e0ae4d7de12eb34bfe889d0d03f057129c55e168a85c9d44`.
- `viz.wasm`: the embedded Viz.js GraphViz module extracted from the official
  artifact's `data:application/octet-stream;base64` payload. SHA-256
  `d744ded85304aea4a4b00343b275b4a1cab4785af8177d364beaa78bed6e8dd4`.

The bundle proves sequence, class/component GraphViz, and lowered C4 context
rendering in real workerd. A small DOM adapter is present, and Wrangler
provides the Viz module as a precompiled Wasm import. The C4 adapter lowers the
bounded macro surface to ordinary PlantUML primitives and rejects unsupported
macros explicitly.

Use `../../config/local/plantuml-family.jsonc` for local multi-host workerd
tests.
Wrangler's local route emulation rewrites requests to the first configured
custom domain when the production config is used. Without the local config,
the C4 hostname would exercise the PlantUML descriptor.

The patched Viz bridge receives a `WebAssembly.Module` through
`globalThis.__DIAGRAMZIP_PLANTUML_VIZ_MODULE`; it must never compile bytes at
request time. Remote PlantUML includes are not supported by this unit.
