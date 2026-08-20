# Third-party renderer sources

The Worker vendors source from these exact Apache-2.0-licensed upstream
repositories. The commit is the source-of-truth revision used in `src/`;
the package version is included where the upstream project publishes one.

- [Kroki BlockDiag fork](https://github.com/yuzutech/blockdiag/tree/f0d23ca664462d09f19d7b8e706a5a024b7d5f4d)
  v3.4.2, commit `f0d23ca664462d09f19d7b8e706a5a024b7d5f4d`
- [SeqDiag](https://github.com/blockdiag/seqdiag/tree/9ffd7bf4e65f2508f3f7a2041f77564bc44deafa)
  3.0.0, commit `9ffd7bf4e65f2508f3f7a2041f77564bc44deafa`
- [ActDiag](https://github.com/blockdiag/actdiag/tree/f74203528d6ae3ba43898f93505e01d153677062)
  3.0.0, commit `f74203528d6ae3ba43898f93505e01d153677062`
- [NwDiag](https://github.com/blockdiag/nwdiag/tree/04bbb4581e90ea891fe826be6c82f4aaee522f26)
  3.0.0, commit `04bbb4581e90ea891fe826be6c82f4aaee522f26`; this source also
  supplies PacketDiag and RackDiag.

The complete Apache-2.0 texts are retained in `vendor-licenses/`:
`blockdiag-LICENSE`, `seqdiag-LICENSE`, `actdiag-LICENSE`, and
`nwdiag-LICENSE`. The static registry in `src/upstream_runtime.py` is a
diagram.zip adapter: it replaces metadata entry-point discovery with the
vendored SVG drawer, all vendored node renderers, PacketDiag's renderer, and
the three built-in plugins (`attributes`, `autoclass`, `autolane`).

## Runtime dependencies

`uv.lock` pins the Pyodide-packaged runtime dependencies:

- [Pillow](https://github.com/python-pillow/Pillow), 11.3.0 — HPND-style
  Pillow license; used for text measurement and image primitives.
- [funcparserlib](https://github.com/vlasov-volnov/funcparserlib), 1.0.1 —
  BSD-3-Clause.
- [webcolors](https://github.com/ubernostrum/webcolors), 25.10.0 —
  BSD-3-Clause.
- [defusedxml](https://github.com/tiran/defusedxml), 0.7.1 — Python
  Software Foundation License; used for defensive SVG parsing.

The lock file contains the resolved URLs and hashes. Development-only
packages (`pytest`, `workers-py`, and the Workers runtime SDK) are not part of
the renderer's application dependency list.

## Bundled font

`src/assets/DejaVuSerif.ttf` is from the [DejaVu Fonts project](https://dejavu-fonts.github.io/).
Its Debian copyright/permission text is retained as
`vendor-licenses/dejavu-COPYRIGHT`. The file is distributed under the
Bitstream Vera terms for the original glyphs, with DejaVu changes in the
public domain; the font is used only to make Worker text metrics deterministic.

The Worker also bundles the resolved dependencies from `uv.lock`; package
metadata and license files are carried into the generated `python_modules`
deployment directory by Pywrangler. Re-run `uv lock` deliberately when
updating dependencies and review the resulting hashes and license changes.
