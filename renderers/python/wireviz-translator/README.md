# WireViz translation Worker

This unit vendors the pristine `yuzutech/WireViz` v0.3.3 release tag. The tag
uses commit `837d5425e72aa002bbe9cc60604dfeffab86d29c`. Its runtime version remains
0.3.2. The unit stops after the upstream parser and model produce GraphViz DOT.
It sends the DOT through the `GRAPHVIZ` service binding to the shared
GraphViz-Wasm Worker.

The Python `graphviz` package and external `dot` executable are intentionally absent. `src/graphviz.py` is the small DOT-builder interface required by WireViz.

The edge contract supports SVG only. Filesystem/remote images, `tweak.append`, and `tweak.override` are rejected. BOM and HTML sidecars are not part of the rendering contract.

Run the local and Pyodide packaging checks from this directory:

```sh
uv sync
uv run pytest -q
uv run pywrangler sync
uv run pywrangler deploy --dry-run
```

For an end-to-end local test, run the `graphviz-family` Wrangler dev server and
this Worker in separate terminals. Wrangler resolves the service binding by
Worker name and must report `env.GRAPHVIZ ... local [connected]`. Structural
coverage, not pixel equality, is the migration gate.

The request parser caps bodies at 1 MiB and sources at 512 KiB. It also limits
YAML nesting, expanded nodes, components, pins, wires, connections, and numeric
ranges. YAML anchors and merge templates remain supported within those bounds.
Recursive aliases are rejected before the upstream model runs.
