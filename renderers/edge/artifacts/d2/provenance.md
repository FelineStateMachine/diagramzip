# D2 edge-Wasm provenance

- Engine: D2 parser/compiler/SVG renderer `v0.7.1`
- Artifact: `d2-custom.wasm`
- SHA-256: `e27e0144f30e26b9891e086b6370c24755426d64934d61f8334002b2b4a3c663`
- Build inputs: [`source/worker.go`](../../toolchains/d2/source/worker.go), [`source/main.go`](../../toolchains/d2/source/main.go), [`source/go.mod`](../../toolchains/d2/source/go.mod), [`source/go.sum`](../../toolchains/d2/source/go.sum), and the Worker-safe [`overlays/jsrunner`](../../toolchains/d2/overlays/jsrunner) source overlay.
- Build command: `npm run build:d2` from `renderers/edge`.
- Build toolchain: Go `go1.26.6`.
- D2 dependency: peeled module `oss.terrastruct.com/d2@v0.7.1` (module is deprecated upstream in favor of `github.com/d2lang/d2`; the lockfile remains authoritative for this artifact).
- Corresponding upstream source: https://github.com/terrastruct/d2/tree/v0.7.1
- Layout: D2's bundled Dagre renderer with its default top-to-bottom flow. ELK is not included.
- JavaScript runtime: Dagre executes inside the pure-Go Goja runtime. The build stages the pinned D2 module in a temporary directory and replaces only its runtime-selection files; the upstream Wasm host-eval runner is excluded because Workers prohibit dynamic code generation.
- Host shim: Go standard `wasm_exec.js` from the build Go toolchain.

The D2 source and renderer are MPL-2.0. The generated artifact remains subject to the upstream D2 license and notices. Recipients can obtain the covered upstream source from the exact link above; DiagramZip's Worker entry points, module lock, runtime overlay, and reproducible build command are retained under `renderers/edge/toolchains/d2/`.
