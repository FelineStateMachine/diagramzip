# diagrams.net client renderer

This sandboxed client unit uses the headless export runtime from diagrams.net
29.6.1. The application code is Apache-2.0. Icon sets, stencil libraries, and
diagram templates retain the additional upstream asset terms reproduced in
`vendor/assets/img/LICENSE`, `vendor/assets/shapes/LICENSE`, and
`vendor/assets/stencils/LICENSE`.

## Pinned upstream

- Source: https://github.com/jgraph/drawio/tree/v29.6.1
- Source revision: `15f3c0fefb172bd98a2a380ee120a55ca690c85d`
- Export application: `vendor/assets/js/app.min.js`
- Export runtime: `vendor/assets/js/export.js`
- Export initialization: `vendor/assets/js/export-init.js`
- Precompiled shape runtime: `vendor/assets/js/shapes-14-6-5.min.js`

`scripts/check.mjs` pins the export entry artifacts by SHA-256. The vendored
tree intentionally retains dynamically loaded shape, stencil, image, and math
resources required to render existing diagrams.net documents. Editor-only UI
images and the unused mxGraph source distribution are excluded.

## Distributed notices

`npm run build` publishes `SOURCE.md`, the Apache-2.0 text, and the upstream
asset terms beside the client bundle. The asset terms restrict using the
included icon and stencil libraries as software assets in Atlassian products
or its marketplace ecosystem. They expressly exempt end-user diagram output.
