# D2 edge-Wasm provenance

- Engine: D2 parser/compiler/SVG renderer `v0.7.1`
- Artifact: `d2-custom.wasm`
- SHA-256: `e27e0144f30e26b9891e086b6370c24755426d64934d61f8334002b2b4a3c663`
- Build inputs: [`source/worker.go`](source/worker.go), [`source/main.go`](source/main.go), [`source/go.mod`](source/go.mod), [`source/go.sum`](source/go.sum), and the Worker-safe [`overlays/jsrunner`](overlays/jsrunner) source overlay.
- Build command: `GOOS=js GOARCH=wasm go build -trimpath -buildvcs=false -ldflags='-s -w' -o ../d2-custom.wasm .`
- Build toolchain: Go `go1.26.6`; use `npm run build:d2-wasm` from `renderers/edge`.
- D2 dependency: peeled module `oss.terrastruct.com/d2@v0.7.1` (module is deprecated upstream in favor of `github.com/d2lang/d2`; the lockfile remains authoritative for this artifact).
- Layout: D2's bundled Dagre renderer with its default top-to-bottom flow. ELK is not included.
- JavaScript runtime: Dagre executes inside the pure-Go Goja runtime. The build stages the pinned D2 module in a temporary directory and replaces only its runtime-selection files; the upstream Wasm host-eval runner is excluded because Workers prohibit dynamic code generation.
- Host shim: Go standard `wasm_exec.js` from the build Go toolchain.

The D2 source and renderer are MPL-2.0. The generated artifact remains subject to the upstream D2 license and notices.
