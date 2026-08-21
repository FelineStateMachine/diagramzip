# TikZ client renderer

This isolated client unit runs the self-hosted TikZJax browser build. The
iframe receives `diagram.zip:renderer:v1` messages and compiles source with the
bundled TeX WebAssembly engine. It extracts the generated SVG from dvi2html and
returns the SVG to the parent frame. It has no server-side or Fly fallback.

## Pinned upstream

- Package: `@planktimerr/tikzjax@1.0.63`
- Source: https://github.com/maker-jr/tikzjax
- Source revision: `e4bb417fe574f58f6db611cefc6be4855ab9d345`
- Original project: https://github.com/kisonecat/tikzjax
- Package tarball: `@planktimerr/tikzjax@1.0.63`
- npm integrity: `sha512-W46i6+CZKPJ4P/08bQ/iCp8Vy0tof8hCaXGWrMetZ5DJPpkERaiW0r0L3jmUpFB1SWhNvp/uKaXAAMmDET3BKw==`
- `tikzjax.js`: `b360666cfc2425180abc5d256c81ea686dee8fe8381ef9a73856cb28bdf3bead`
- `run-tex.js`: `81cdc50b15749e63b805561160136bacd97a7a978f0b70818a4d15551a0d0e15`
- `tex.wasm.gz`: `f8667f45e90039832df4f62550f10ff0c2f47781dbfdde9510f0ff3f360a61ba`
- `core.dump.gz`: `ae9f69dfe3837606240c5b9cb50f86aa0ee7463bbae4c26f2843b17eb155b91f`
- Complete asset-tree SHA-256: `92045ae366580b0fd119ea0ce4bca7d70f9cf58865d21cc92497b431492ae25e`

The source package declares GPL-3.0+. Its upstream TeX/TikZ components are
distributed under LPPL-1.3c. The applicable notices are vendored in
`vendor-licenses/`.

## Distributed source and licenses

The browser unit is a GPL-3.0-or-later distribution. Its build modifies the
pinned `tikzjax.js` asset to disable persistent browser storage, then executes
it with the DiagramZip frame adapter. `npm run build` therefore publishes:

- `/SOURCE.md` with the pinned upstream revision, tarball, integrity, and build description;
- `/source/tikzjax-1.0.63.js`, the exact unmodified input to the storage patch;
- `/source/build.mjs` and `/source/frame.js`, the build and adapter sources; and
- `/licenses/`, containing GPL-3.0, LPPL-1.3c, and the DiagramZip MIT terms.

These files are served beside the browser scripts so recipients can retrieve
the corresponding source and applicable terms from the same renderer origin.

## Security and limits

The unit uses a script-only iframe with no same-origin access. CSP permits only
self-hosted scripts/assets, same-origin asset fetches, and the WebAssembly
worker blob required by TikZJax. It blocks frames, forms, external images,
external connections, and non-self resources. Source is limited to 256 KiB,
SVG output to 4 MiB, and each render to 20 seconds. Rendering is serialized;
each TeX invocation receives a fresh WebAssembly memory and virtual filesystem.

The adapter removes scripts, `foreignObject`, event-handler attributes, and
non-local href/src attributes before returning SVG.

Each render owns an isolated DOM container. Timeout and completion handlers
are scoped to that container. A late TeX result cannot satisfy a later request.
Completed diagrams do not accumulate in the frame.

## Known losses

This is not full TeX Live. It supports the package/library files shipped in
the pinned `dist/tex_files` bundle. External `\\input`, package downloads,
shell escape, filesystem access, and external resources are unavailable.
Typography, layout, and SVG details may differ from the native `dvisvgm`
renderer. The repository periodic-table fixture has been validated in a real
browser and produces SVG through this protocol.
