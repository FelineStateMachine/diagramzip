---
name: component-diagram
description: Create a component-level view of software structure, interfaces, and dependencies when the audience needs implementation boundaries rather than deployment topology.
---

# Component diagram

## What and why

Use this skill to tell the story of how a software system is partitioned into replaceable or independently owned components, and how those components collaborate through explicit interfaces. It is a good fit for design reviews, ownership boundaries, integration planning, and explaining an existing codebase. It is not a class diagram, deployment map, or a full system landscape.

## Select or avoid

Select it when the question is “which implementation parts depend on which contracts?” Avoid it when the question is about people and systems (system context), runtime nodes (deployment), message order (sequence), or data ownership (ERD). Ask whether the component means a code/module boundary, a service boundary, or a logical subsystem; do not mix those levels without a boundary legend.

## Modeling method

1. Name the system boundary and audience.
2. Identify components at one consistent level. Give each a responsibility and owner.
3. Draw only meaningful dependencies; label each edge with the interface, protocol, or purpose.
4. Show provided/required interfaces when interface compatibility matters.
5. Add external dependencies only when they explain a decision. Mark inferred or undocumented relationships.

The primary story should be readable from components and labeled relationships alone. Use notes for risks, technology, or migration state—not as a substitute for missing structure.

## Styling and customization

Use containment to show system/subsystem boundaries, not decorative nesting. Keep component shapes consistent, use a restrained color for ownership or lifecycle, and reserve a second accent for external dependencies. Prefer orthogonal or gently routed connectors, short labels, and a left-to-right direction for dependency flow. Add a legend for every non-obvious color, stereotype, or line style. Preserve a user-selected renderer; otherwise prefer `structurizr` for a reusable C4 workspace, `c4plantuml` for a focused C4 component view, `plantuml` for UML component notation, `mermaid` for quick documentation, or `d2` for a polished sketch.

## Review checklist

- Is the abstraction level explicit and consistent?
- Does every important edge name a contract or purpose?
- Can ownership, externality, and lifecycle status be distinguished without guessing?
- Are cycles, high fan-in, and unstable boundaries visible?
- Is the diagram still legible when rendered in the requested format?

## Standards and prior art

See [C4 and UML profiles](references/c4-uml.md). C4 component diagrams and UML component diagrams overlap in intent but are not interchangeable notations. UML 2.5.1 is the formal standard; diagram.zip supports text renderers and C4 PlantUML, not a general UML model interchange pipeline. Full UML conformance, executable interface contracts, and SysML component semantics are integration opportunities rather than promises of this skill.
