---
name: hierarchy-diagram
description: Use when the user needs a ranked, nested, or reporting structure such as a taxonomy, organization chart, tree, or work breakdown structure.
---

# Hierarchy diagram

## What / why

A hierarchy diagram shows parent-child levels. It tells the story “what contains, reports to, or decomposes into what?” Name the relationship because taxonomy, authority, and work decomposition are not interchangeable.

## How to model

- Declare the hierarchy kind and root before adding nodes.
- Give each node one parent unless multiple inheritance is explicitly intended.
- Keep siblings at the same abstraction level; avoid mixing roles, instances, and tasks.
- For a WBS, use verb-led deliverables and decompose until work is estimable; for an org chart, use roles and reporting lines; for a taxonomy, use concepts and “is-a” relationships.
- Show cross-links separately from the tree so they cannot be mistaken for parentage.

## Styling and customization

Use top-down or left-to-right levels, aligned siblings, consistent node sizes, and whitespace. Use color to distinguish categories or departments, not depth alone. For org charts, label role and optionally person separately; for WBS, show identifiers and status secondarily.

## Renderer choices

Preserve user choice. Mermaid flowcharts/mindmaps and Graphviz/DOT are good for generated trees; PlantUML can express deployment/component-style hierarchies; D2 and diagrams.net suit bespoke layouts. diagram.zip has no dedicated org-chart or WBS semantic renderer: use supported syntax and document relationship semantics in labels.

## Review

Verify one root (or explain a forest), consistent parent semantics, no accidental cycles, readable levels, and a legend for dashed or secondary links. Check that a WBS is deliverable-oriented rather than merely an org chart.

## Prior art and gaps

See [references/prior-art.md](references/prior-art.md). ArchiMate, SysML, and formal WBS interchange are not rendered as native diagram.zip semantic types; integration would require a parser/profile and conformance checks.
