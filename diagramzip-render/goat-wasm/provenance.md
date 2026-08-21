# GoAT WebAssembly provenance

- Upstream: `github.com/blampe/goat` v0.5.1
- Upstream tag commit: `6d4db359c601eae6efa1fcd94601fa1793e114d5`
- Upstream license: MIT (see the upstream module license)
- Build image: `tinygo/tinygo:0.39.0`
- Build target: `wasm-unknown`, scheduler `none`
- Canonical artifact SHA-256: `dd6f235370b69eaabd4e1a19acc36b187ea5ff96e9cf5a99ece5e1b332f4e85f`

The module is intentionally compiled with TinyGo's `wasm-unknown` target and
the no-scheduler mode. A standard Go `GOOS=js GOARCH=wasm` binary imports the
`gojs` host module and requires `wasm_exec.js`, which is not a precompiled-Wasm
Worker boundary. The only semantic vendored adaptation is the iterator
boundary: the four goroutine/channel iterators in `svg/iter.go`
(`UpDownMinor`, `LeftRightMinor`, `DiagDown`, and `DiagUp`) return slices in
the same traversal order. Their existing `range` call sites use
`for _, value := range` in `ascii/a_drawable.go`, `ascii/a_line.go`,
`svg/abstractcanvas.go`, `utf8/u_drawable.go`, and `utf8/u_line.go`. The
vendored source tree is derived from the Go module checksum recorded in
`go.sum` with whitespace normalized; the complete repository fixture renders
byte-for-byte identically to the pinned Docker binary.
