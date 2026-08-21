# Contributing

## Before you start

- Open an issue for changes that affect a public API, persistence format, renderer contract, or deployment topology.
- Keep renderer-specific dependencies inside the relevant unit.
- Preserve third-party attribution and update the nearest notice file when vendoring or replacing code.

## Development workflow

1. Create a branch from `main`.
2. Install dependencies in the workspace or service you are changing.
3. Make a focused change and add or update tests.
4. Run the narrow test suite first, then the relevant build and type checks.
5. Update `CHANGELOG.md` for user-visible changes.

Commit messages should describe the behavior changed. Pull requests should explain the motivation, implementation, testing completed, and any deployment or migration requirements.

## Generated files

Do not edit generated documentation, Cloudflare type declarations, or build output by hand. Use the owning package's generation command and commit generated artifacts only when that package already tracks them.
