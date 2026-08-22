# TikZJax edge artifact

This artifact is derived from @planktimerr/tikzjax@1.0.63, pinned to
upstream revision e4bb417fe574f58f6db611cefc6be4855ab9d345. The generated
tikz-core.js is the distributed run-tex.js with the threads worker export
replaced by a direct load/texify capture, the compressed core dump stream-
inflated directly into fresh Wasm memory, and arbitrary external TeX file
fallbacks removed. Asset reads use the Worker static-assets binding. The
compressed tex.wasm.gz fetch is unused by the edge
path; tex.wasm is statically compiled into the Worker with the CompiledWasm
rule. It is used only with the bundled tex_files/ package set.

The unmodified corresponding input is published at source/run-tex.js; the
mechanical extraction is reproducibly produced by
renderers/edge/scripts/build/tikz.mjs.

The TikZJax source is GPL-3.0-or-later; its TeX/TikZ components are covered
by LPPL-1.3c. The corresponding notices are included in licenses/.
