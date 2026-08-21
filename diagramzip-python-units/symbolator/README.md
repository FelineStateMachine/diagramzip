# Symbolator Python Worker

This unit preserves the useful Symbolator HDL component workflow while removing
the native desktop dependencies from the Kroki binary. It accepts Verilog /
SystemVerilog module declarations and VHDL entities/components, preserving
generics, grouped ports, directions, buses, clock markers, bubbles, titles,
scaling, and type labels.

The pinned Kroki Symbolator 1.2.2 package cannot be imported directly into a
Python Worker: its SVG backend imports `gi`, Cairo, and Pango for text metrics.
Those native bindings are not Pyodide packages. This unit is therefore a small
translation/rendering path with deterministic approximate text metrics. Font
metrics and exact layout may differ from the native renderer; that loss is
intentional and documented so coverage can move off the Java image.

The unit has no filesystem, subprocess, or network access. The hostname selects
the renderer; the request body cannot select an engine.

## Local checks

```sh
uv run pytest -q
uv run pywrangler sync
uv run pywrangler dev --port 8791
```

## Known losses

- Native Pango font shaping is replaced by conservative monospace-like width
  estimates. SVG text remains selectable and uses browser fonts.
- The native command's library-directory scanning and persisted array-type
  cache are intentionally unavailable; requests contain one HDL source.
- PNG/PDF/PS/EPS output is not supported by the Worker plane; SVG is supported.
