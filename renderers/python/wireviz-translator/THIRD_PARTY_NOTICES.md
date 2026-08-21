# Third-party notices

Pristine source from the `yuzutech/WireViz` v0.3.3 release tag (`837d5425e72aa002bbe9cc60604dfeffab86d29c`) is vendored under `src/wireviz/` and is licensed under GPL-3.0-only. See `vendor-licenses/WireViz-LICENSE`.

`src/render.py` imports and executes the vendored implementation in-process.
Accordingly, the deployable Worker unit rooted in this directory is distributed
as a GPL-3.0-only combined work. This scope statement does not apply the GPL to
separate DiagramZip services that communicate with this unit over HTTP or a
Cloudflare service binding.

The upstream source and current container report version 0.3.2; Kroki's Dockerfile and Java service currently label the binary 0.3.3. The edge build reports the actual WireViz runtime version and identifies the DOT translator build separately.

PyYAML is the only application runtime dependency. CPython tests resolve
PyYAML 6.0.3 in `uv.lock`; Pywrangler resolves the current Pyodide package,
PyYAML 6.0.2, in `pylock.toml`. PyYAML is MIT-licensed and its package metadata
and license are included in the generated deployment modules.
