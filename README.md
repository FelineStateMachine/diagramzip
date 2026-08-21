# diagram.zip

[diagram.zip](https://diagram.zip) is a browser-first diagram editor with live SVG previews, local drafts, and encrypted, accountless sharing. The repository contains the editor, documentation, persistence API, renderer catalog, and the isolated renderer units behind the service.

## What is here

| Path | Purpose |
| --- | --- |
| `diagramzip/` | Browser editor and local development entry point |
| `diagramzip-api/` | Cloudflare Worker for encrypted, accountless persistence |
| `diagramzip-docs/` | Docusaurus site published at [docs.diagram.zip](https://docs.diagram.zip) |
| `diagramzip-render/` | Renderer catalog, shared contracts, and Worker-based renderer units |
| `diagramzip-client-units/` | Sandboxed browser renderers |
| `diagramzip-python-units/` | Python renderer and translation units |
| `diagramzip-shell/` | Cloudflare shell and routing layer |
| `diagramzip-svg/` | Shared SVG normalization and presentation logic |
| `skills/` | Diagram-specific agent skills and reference material |

Some top-level renderer directories retain foundation sources used to build the isolated units. The production application and renderer plane run on Cloudflare; there is no JVM gateway or shared rendering server.

## Development

The main workspace requires Node.js 24.

```sh
npm install
npm run dev:diagramzip
```

Useful checks:

```sh
npm run test:diagramzip
npm run build:diagramzip
npm run build:diagramzip-docs
npm --prefix diagramzip-render test
npm --prefix diagramzip-api test
```

Individual services have their own README and package scripts. Run deployment commands from the service directory whose `wrangler.jsonc` you intend to use.

## Architecture

The editor runs at `diagram.zip`. Rendering is split into isolated units selected by hostname at `{engine}.render.diagram.zip`; the renderer catalog documents the contract and capabilities for all supported engines. Five renderers run in sandboxed browser frames, while the remaining renderers run in JavaScript, Python, or WebAssembly Workers.

Saved diagrams use encrypted client-side content, mutable aliases in D1, and immutable content-addressed objects in R2. See [`diagramzip/PERSISTENCE.md`](diagramzip/PERSISTENCE.md) for the persistence and security contract.

## Project history and licensing

DiagramZip began with an import of the MIT-licensed Kroki v0.32.1 source tree and has since replaced the application, documentation, persistence, and renderer delivery architecture. The Git repository is maintained as an independent project; Kroki and other retained dependencies remain credited in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and the nested license files.

DiagramZip is distributed under the [MIT License](LICENSE). Some bundled renderers and vendored components use other licenses; review `licenses/`, nested `THIRD_PARTY_NOTICES.md` files, and vendor-license directories before redistribution.

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development workflow. Please report security issues according to [`SECURITY.md`](SECURITY.md), not through a public issue.
