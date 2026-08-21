# diagram.zip

[diagram.zip](https://diagram.zip) is a browser-first diagram editor with live SVG previews, local drafts, editable SVG files, and encrypted, accountless sharing. The repository contains the editor, documentation, persistence API, renderer catalog, and the isolated renderer units behind the service.

## What is here

| Path | Purpose |
| --- | --- |
| `apps/editor/` | Browser editor and local development entry point |
| `apps/docs/` | Docusaurus site published at [docs.diagram.zip](https://docs.diagram.zip) |
| `services/api/` | Cloudflare service for encrypted, accountless persistence |
| `services/shell/` | Cloudflare application shell and routing service |
| `renderers/catalog/` | Catalog service for renderer capabilities and health |
| `renderers/edge/` | JavaScript and WebAssembly renderer units |
| `renderers/client/` | Sandboxed browser renderers |
| `renderers/python/` | Python renderer and translation units |
| `renderers/shared/` | Contracts shared across renderer runtimes |
| `shared/svg/` | Shared SVG normalization and presentation logic |
| `examples/diagrams/` | Canonical diagram corpus shared by the editor and renderer tests |
| `skills/` | Diagram-specific agent skills and reference material |

Top-level directories describe architectural roles. The production application and renderer plane run on Cloudflare; there is no JVM gateway or shared rendering server.

## Development

The JavaScript workspace uses npm with Node.js 24.

```sh
npm install
npm run dev:editor
```

Useful checks:

```sh
npm run test:editor
npm run build:editor
npm run build:docs
npm run test:edge
npm run test:api
```

## Release

Production is released manually through one repository entry point:

```sh
./release.sh
```

The command requires a clean `main` worktree. Before asking for confirmation,
it installs every locked dependency set and runs all tests and builds. It also
verifies generated types and runtime license notices, then dry-runs every
JavaScript and static-asset Worker. It deploys the renderer plane in
service-binding order, applies D1 migrations, and deploys the API, editor shell,
and documentation. Public smoke tests complete the release. Run
`./release.sh --check` to execute the same local gate without authentication or
deployment.

Individual package deployment commands remain useful for development, but they
are not the production release procedure.

## Architecture

The editor runs at `diagram.zip`. Rendering is split into isolated units selected by hostname at `{engine}.render.diagram.zip`; the renderer catalog documents the contract and capabilities for all supported engines. Five renderers run in sandboxed browser frames, while the remaining renderers run in JavaScript, Python, or WebAssembly Workers.

Server persistence is opt-in. **Publish** creates an open alias, while
**Encrypt & Publish** creates an encrypted alias. Anonymous drafts can use
**Save as File** to download an editable enriched SVG without server state.
See [`apps/editor/PERSISTENCE.md`](apps/editor/PERSISTENCE.md) for the
persistence and security contract.

## Project history and licensing

DiagramZip began with an import of the MIT-licensed Kroki v0.32.1 source tree and has since replaced the application, documentation, persistence, and renderer delivery architecture. The Git repository is maintained as an independent project; Kroki and other retained dependencies remain credited in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and the nested license files.

Except where otherwise noted, original DiagramZip code is distributed under the [MIT License](LICENSE). This repository is a multi-license distribution: bundled renderers, WebAssembly artifacts, vendored source, fonts, and visual assets retain their respective licenses and terms. Review [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), `licenses/`, and the notices beside each renderer before redistribution.

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development workflow. Please report security issues according to [`SECURITY.md`](SECURITY.md), not through a public issue.
