---
name: wiring-harness-diagram
description: Use when the user needs to document wires, cables, connectors, splices, branches, pin mappings, or harness manufacturing/service information.
---

# Wiring harness diagram

## Select it when

Choose this skill when the important story is physical connectivity: which connector cavity, splice, terminal, shield, or wire reaches which destination. Use it for vehicle, aerospace, industrial, and test harness documentation. Do not use it for only a logical network topology, a circuit schematic, or a software dependency graph.

## Story and modeling

Start with the reader's task: build, inspect, troubleshoot, or modify the harness. Model connector references and cavity numbers, wire identifiers, conductor size, color, shielding, splice points, branch points, destinations, and relevant units. Separate physical route or bundle membership from electrical net identity. Mark unknown, optional, spare, and not-fitted conductors explicitly; never imply that a crossing is a connection.

The diagram is a depiction, not automatically a manufacturing release. Preserve revision, source-of-truth identifiers, pin numbering conventions, and a legend. If a table is more reliable for a complete pin-to-pin netlist, pair the diagram with it.

## Styling and customization

Use a restrained color key for wire function or status, with line labels and a monochrome-safe alternative. Use heavier bundle lines and lighter individual conductors; show connectors as stable, labeled blocks and keep signal direction separate from physical routing. Avoid decorative colors that could be mistaken for conductor color codes. Add callouts for shield termination, splice details, bend/service loops, and cross-sheet references.

## Renderer routing

Preserve a renderer explicitly requested by the user. Prefer `wireviz` for connectors, cables, pins, wire colors, gauges, and connection mappings. Use `diagramsnet` for hand-positioned routes or assembly callouts, or `graphviz` and `d2` for relationship-first maps. Pair `nwdiag` only when logical network segments are a separate part of the story. WireViz models harness data, but diagram.zip does not validate terminal compatibility, bend radius, manufacturing rules, or external source-of-truth netlists.

## Review

Check every endpoint and cavity, connector orientation, branch/splice identity, wire label, shield/ground convention, crossing versus junction, and continuation reference. Check that the legend explains line weight, colors, and omissions, and that the output remains legible when printed in grayscale. State clearly when the result is illustrative rather than standards-compliant release data.

## References

- [SAE AS50881](https://www.sae.org/standards/content/as50881/) — aerospace and military wiring-system guidance; use the current licensed edition for release requirements, not this summary.
- [IEC 60617:2026 DB](https://webstore.iec.ch/en/publication/2723) — graphical symbols for diagrams; symbol availability and licensing may require integration work.
- [IEC 61082-1](https://webstore.iec.ch/en/publication/265) — rules for electrotechnical documentation; the renderer does not enforce its document conventions.
- [IPC/WHMA-A-620E](https://www.ipc.org/news-release/ipc-releases-ipcwhma-620e-requirements-and-acceptance-cable-and-wire-harness) — manufacturing and acceptance requirements; a rendered harness diagram does not establish conformity.

## Integration opportunities

diagram.zip can depict harness structure, but it does not currently provide a standards-aware connector/cavity library, netlist validation, wire-gauge rules, terminal compatibility checks, or IEC, SAE, or IPC/WHMA conformance export. Those would be separate integration opportunities.
