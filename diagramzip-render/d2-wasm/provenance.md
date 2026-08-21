# D2 edge-Wasm provenance

- Engine: D2 parser/compiler/SVG renderer `v0.7.1`
- Artifact: `d2-custom.wasm`
- SHA-256: `5ab7315998cf4316d17dbb095c3b4eea4fad46e48554b5d76146437f1dba3344`
- Build inputs: [`source/worker.go`](source/worker.go), [`source/main.go`](source/main.go), [`source/go.mod`](source/go.mod), and [`source/go.sum`](source/go.sum)
- Build command: `GOOS=js GOARCH=wasm go build -trimpath -buildvcs=false -ldflags='-s -w' -o ../d2-custom.wasm .`
- Build toolchain: Go `go1.26.6`; use `npm run build:d2-wasm` from `diagramzip-render`.
- D2 dependency: peeled module `oss.terrastruct.com/d2@v0.7.1` (module is deprecated upstream in favor of `github.com/d2lang/d2`; the lockfile remains authoritative for this artifact).
- Layout: deterministic pure-Go grid with straight-line edge routing; Dagre and ELK are intentionally not invoked.
- Host shim: Go standard `wasm_exec.js` from the build Go toolchain.

The D2 source and renderer are MPL-2.0. The generated artifact remains subject to the upstream D2 license and notices.
