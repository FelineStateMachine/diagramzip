# Changelog

All notable DiagramZip changes are documented in this file. The project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and the structure from [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Establish DiagramZip as an independent repository, package, and hosted project.

## [0.1.0] - 2026-08-20

### Added

- Browser editor with Monaco, live SVG preview, diagram examples, zoom, and minimap navigation.
- Accountless encrypted persistence backed by Cloudflare D1 and R2.
- Documentation site and machine-readable renderer and skill catalogs.
- Isolated JavaScript, Python, WebAssembly, and sandboxed-client renderer units for the complete catalog.
- Shared SVG sanitization, normalization, storage, and presentation contracts.

### Changed

- Replaced the inherited gateway and renderer-sidecar deployment with Cloudflare-hosted shell, API, catalog, and renderer units.
