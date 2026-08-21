# Pikchr edge-Wasm provenance

- Upstream: https://pikchr.org/home
- Source endpoint: `https://pikchr.org/home/raw/85e65b968651b342c46e6334f4772b45d6cbb4317c5cbaa95d207779a50c6709`
- Pinned source revision: `85e65b968651b342c46e6334f4772b45d6cbb4317c5cbaa95d207779a50c6709`
- Build: Docker image `emscripten/emsdk@sha256:f174124ff798a3ead1abef247d9a849c270b642d552fea500a42565ff210f765`, `emcc -O3 --no-entry -sEXPORTED_FUNCTIONS=_pikchr,_free,_malloc -sEXPORTED_RUNTIME_METHODS=ccall,getValue,UTF8ToString -sENVIRONMENT=web -sMODULARIZE -sEXPORT_ES6=1 -sEXPORT_NAME=initPikchrModule -sFILESYSTEM=0 -o pikchr.js pikchr.c -lm`
- The adapter supplies Wrangler's statically imported `CompiledWasm` module through Emscripten's `instantiateWasm` hook; the Worker does not fetch runtime code or assets.
- Pikchr is Zero-Clause BSD; the repository license is recorded in `licenses/pikchr-license.txt`.
