---
name: circuit-diagram
description: Use when the user needs an electrical or electronic schematic showing components, nets, reference designators, power, signal flow, and test points.
---

# Circuit diagram

## Select it when

Choose this skill when the reader must understand or build an electrical circuit: signal paths, power rails, component relationships, or measurement points. Use it for conceptual schematics and documentation. Do not call a general block diagram a schematic, and do not imply PCB layout, simulation, safety approval, or manufacturing release without source data.

## Story and modeling

Choose the level first: functional block schematic, detailed circuit, or power/control subcircuit. Model standard symbols, reference designators, values/ratings, net names, pin numbers, polarity, power and ground, connectors, test points, and signal direction. Keep wires orthogonal where possible; show a junction only where a connection exists. Use net labels and hierarchical connectors to avoid unreadable wire crossings. Include units and a legend.

A rendered image is not necessarily an authoritative electrical document. It does not establish ERC correctness, component availability, creepage/clearance, safe ratings, SPICE behavior, or PCB connectivity unless those are validated by an integrated EDA source.

## Styling and customization

Prefer conventional symbol geometry and a consistent left-to-right signal flow. Use line weight and labels before color; if color marks power domains or warnings, provide a monochrome legend. Keep reference designators visible and values secondary. Use sheet boundaries, title blocks, revision, and source links for engineering audiences. Do not invent a symbol when the standard symbol is unavailable—label the custom graphic and explain it.

## Renderer routing

Preserve a renderer explicitly requested by the user. Use `diagramsnet` for manually positioned schematic-like drawings, `svgbob` for text-native circuit sketches, or `tikz` and `pikchr` for controlled custom geometry. Use `plantuml`, `d2`, or `graphviz` only for functional connectivity abstractions. The catalog does not expose a native SPICE/EDA schematic renderer or IEC symbol-validation pipeline. General renderers cannot guarantee electrical semantics, pin correctness, or standards-compliant symbol libraries.

## Review

Check every net endpoint, junction, pin number, polarity mark, power/ground symbol, reference designator, value, unit, and cross-sheet link. Confirm that crossings are unambiguous and that no hidden net is silently assumed. Review ratings, safety boundaries, and revision/source provenance with an electrical engineer. State whether the output is conceptual, review-ready, or a standards-controlled artifact.

## References

- [IEC 60617:2026 DB](https://webstore.iec.ch/en/publication/2723) — authoritative symbol database; licensing and symbol-library integration may be required.
- [IEC 61082-1](https://webstore.iec.ch/en/publication/265) — preparation of electrotechnical documents; the renderers do not enforce its conventions.
- [IEEE Std 315](https://standards.ieee.org/standard/315-1975.html) — graphic symbols for electrical/electronics diagrams; verify applicability and current organizational practice.

## Integration opportunities

Native IEC/IEEE symbol libraries, ERC/netlist checks, SPICE import, EDA interchange, title-block control, and design-rule validation are unsupported integration opportunities. Do not describe a general-renderer output as IEC/IEEE-compliant authoring.
