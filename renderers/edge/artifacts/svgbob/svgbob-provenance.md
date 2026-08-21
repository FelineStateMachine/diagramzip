# Svgbob edge-Wasm provenance

The vendored module is built from the upstream `svgbob` 0.7.6 release at
commit `04a9d85c4b1879051f205e9e434e058864c3d36f` (the tag points at this
commit). The wrapper source and locked dependency graph are in
`renderers/edge/toolchains/svgbob/`.

Builds use Docker image `rust:1.89-bookworm` pinned as
`rust@sha256:948f9b08a66e7fe01b03a98ef1c7568292e07ec2e4fe90d88c07bb14563c84ff`:

```sh
docker run --rm -v "$PWD/renderers/edge/toolchains/svgbob:/build" -w /build \
  rust@sha256:948f9b08a66e7fe01b03a98ef1c7568292e07ec2e4fe90d88c07bb14563c84ff \
  bash -c 'rustup target add wasm32-unknown-unknown && \
    cargo build --release --target wasm32-unknown-unknown && \
    cargo install wasm-bindgen-cli --version 0.2.127 --locked && \
    wasm-bindgen target/wasm32-unknown-unknown/release/svgbob_wasm.wasm \
      --target bundler --out-dir /build/pkg'
```

The checked-in artifacts under `renderers/edge/artifacts/svgbob/` are copied
from `/build/pkg`. `svgbob_wasm.js` replaces wasm-bindgen's bundler namespace
import with a default `CompiledWasm` import and one explicit
`WebAssembly.Instance`, then calls `__wbindgen_start` once. The wrapper calls
only Svgbob's pure `Settings` and `to_svg_with_settings` APIs: it performs no
filesystem, network, DOM, or runtime asset loading.

Artifact SHA-256 digests:

- `svgbob_wasm_bg.wasm`: `9fe54bd259a6c1d83dea684d48d6b90a07661d3d58ec57861fae363c9f4b45b2`
- `svgbob_wasm_bg.js`: `cab37989e62bd5f00d9ac3dc87d83d4e29c1a47efac1d21909d021efca2b9443`
- Worker import bridge `svgbob_wasm.js`: `d728d07acb9f24e867504dc6dd4e40a64603a67f6a075aaa1456502c87187c03`

Svgbob 0.7.6 is licensed under Apache-2.0. The upstream license and notices
are available at https://github.com/ivanceras/svgbob/tree/04a9d85c4b1879051f205e9e434e058864c3d36f.
