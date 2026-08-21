# GoAT WebAssembly build

This is a narrow host wrapper around upstream `github.com/blampe/goat` v0.5.1.
The upstream parser, ASCII/UTF-8 geometry, SVG writer, and embedded CSS remain
the source of truth. TinyGo is used only to produce a Workers-compatible
`wasm-unknown` module; the browser-facing adapter owns request validation and
copies the returned SVG from linear memory. It calls `beginRender` before
allocating source/options; the wrapper retains those buffers through the
render call so TinyGo's garbage collector cannot invalidate host-owned
pointers.

Build from Docker with the pinned TinyGo image in `provenance.md`:

```sh
docker run --rm -e GOFLAGS='-buildvcs=false -mod=vendor' \
  -v "$PWD:/src" -w /src/renderers/edge/goat-wasm \
  tinygo/tinygo:0.39.0 \
  tinygo build -scheduler=none -target wasm-unknown \
    -o goat.wasm .
```
