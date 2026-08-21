---
name: hdl-component-diagram
description: Use when the user needs a hardware-design view of HDL entities, modules, interfaces, ports, parameters, clocks, resets, and hierarchy.
---

# HDL component diagram

## Select it when

Choose this skill to explain a Verilog/SystemVerilog module hierarchy or VHDL entity/architecture boundary and its interfaces. Use it for design review, onboarding, integration planning, and clock/reset documentation. Do not use it as a substitute for RTL, a timing report, a gate-level netlist, or an electrical schematic.

## Story and modeling

Decide whether the story is hierarchy, interface contract, or clock/reset flow. Show module/entity names, instance boundaries, port direction, width, protocol role, clock domain, reset polarity/synchrony, parameters/generics, and meaningful buses. Distinguish combinational/data paths from clocks, resets, interrupts, and sidebands. Keep implementation detail out unless it answers the review question; link to source paths and generated netlist reports when available.

The picture is an explanatory abstraction. It is not proof that RTL elaborates, synthesizes, meets timing, or matches a pin constraint. Never infer signal widths or clock domains from line styling alone.

## Styling and customization

Use nested containers for hierarchy, consistent port-side placement, and labeled bus widths. Give clocks and resets a clearly documented visual treatment, but provide labels so color is not the only encoding. Use one visual grammar for module interfaces and another for external pins or board connections. Highlight only the path under review and put protocol details in notes or a companion table.

## Renderer routing

Preserve a renderer explicitly requested by the user. Prefer `symbolator` when VHDL or Verilog declarations should produce a component symbol with ports, groups, and widths. Use `plantuml`, `d2`, or `graphviz` for module hierarchy and dependencies, or `diagramsnet` when manual port placement is essential. Symbolator parses a useful declaration subset; diagram.zip does not validate complete Verilog, SystemVerilog, VHDL, SVA, CDC constraints, or synthesis output.

## Review

Check that every shown port has direction and width where relevant, interfaces are not confused with instances, clock/reset domains are explicit, and omitted signals are called out. Verify names against elaborated RTL or a netlist. Check fan-out, bidirectional buses, clock crossings, and reset release assumptions. Mark the source revision and whether the view is pre- or post-elaboration.

## References

- [IEEE 1800-2023 SystemVerilog](https://standards.ieee.org/standard/1800-2023.html) — language standard; diagram.zip does not parse or validate the full language.
- [IEEE 1076-2019 VHDL](https://standards.ieee.org/standard/1076-2019.html) — VHDL language standard; entity/architecture terminology here follows it at a high level.
- [IEEE 1801-2024 UPF](https://standards.ieee.org/standard/1801-2024.html) — power intent can affect hardware views but is not represented automatically.

## Integration opportunities

Standards-compliant HDL-aware authoring would require parser/elaborator integration, width and direction checks, clock-domain analysis, source links, and optional synthesis/netlist import. Current renderers only provide depiction.
