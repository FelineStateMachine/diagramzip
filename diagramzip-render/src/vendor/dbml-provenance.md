# DBML renderer provenance

The edge DBML adapter retains the parser, checker, and DOT renderer from
`@softwaretechnik/dbml-renderer` 1.0.31. The package is published as
CommonJS but its source/dependency graph includes mixed module formats, so the
Worker artifact is rebuilt explicitly with the repository's pinned esbuild:

```sh
npm ci
npm run build:dbml
```

The build bundles `src/vendor/dbml-entry.ts` as an ESM artifact after a
fail-closed build-time transform removes the unused SVG/Viz branch and the
upstream parser's `console.debug` of Zod errors. DBML requests call the
upstream `run(source, "dot")` path, then the shared GraphViz-Wasm runtime
renders SVG. No parser grammar was rewritten and no filesystem/network access
is available at runtime. Every rebuild must reproduce the expected DOT output
for the package's complete published example corpus before the script exits.

- Package: https://www.npmjs.com/package/@softwaretechnik/dbml-renderer/v/1.0.31
- Source: https://github.com/softwaretechnik-berlin/dbml-renderer
- npm tarball SHA-512: `ThoBDBc2/ODuCtvrHKLaZNHvBhSMdgTXae7z1hOgXn+i5Qdqp1tq5nK1rrkm7THfnAIXuZ3WxAeos1iRZSKeOw==`
- License: ISC (package metadata)
- Generated bundle SHA-256: `2d46e13b33834dd1174d947c2ada68b357ba29b5c94a07a217e22a00225bee35`

The original compatibility image used GraphViz 2.47.0. The edge family uses
GraphViz 15.1.1, so layout and SVG details can differ while DBML language
coverage remains provided by the upstream parser.
