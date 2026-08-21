# Third-party notices

DiagramZip contains and adapts third-party software. This file records project-level provenance; component-specific notices and complete license texts live beside the relevant source or under `licenses/`.

## Kroki renderer foundation

The initial renderer foundation was imported from [Kroki](https://github.com/yuzutech/kroki) v0.32.1, commit `99f285a0d50c3882e20dc449b63c5358aa889b83`, under the MIT License.

Copyright (c) 2020-present Kroki and its contributors.

Retained foundation code may continue to use `io.kroki`, `KROKI_*`, `@kroki/*`, or Kroki-compatible HTTP names where changing them would break compatibility or obscure upstream provenance. Those identifiers do not identify the DiagramZip product, repository, or hosted service.

## Renderer and vendored dependencies

- License texts for top-level renderer dependencies are in `licenses/`.
- Python units include their own `THIRD_PARTY_NOTICES.md` and `vendor-licenses/` directories where required.
- JavaScript dependency licenses are recorded by the relevant lockfiles and upstream packages.
- Generated type declarations retain their embedded upstream license notices.

This notice is not a substitute for the component license files. Distributors should include all applicable notices for the components they ship.
