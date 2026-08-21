---
name: matrix-diagram
description: Use when the user needs to compare two dimensions, expose a portfolio or prioritization space, or show a many-to-many relationship in a grid or quadrant.
---

# Matrix diagram

## What / why

A matrix places items against two or more declared dimensions. It tells the story “how does each item compare across these axes?” Use it for prioritization, responsibility, compatibility, or traceability; choose a graph when relationships themselves are the focus.

## How to model

- Name each axis, direction, unit, and scale before placing items.
- Define whether cells mean intersection, score, responsibility, presence, or absence.
- Use a consistent measure and show missing/unknown values explicitly.
- Keep quadrant thresholds visible; do not let position imply precision the data does not have.
- For a responsibility matrix, define roles and accountabilities rather than generic marks.

## Styling and customization

Use a quiet grid, strong headers, ample cell padding, and a colorblind-safe palette. Add values or labels so meaning does not depend on color or position. For a quadrant, annotate thresholds; for traceability, use symbols with a legend and accessible text.

## Renderer choices

Preserve user choice. diagrams.net and custom SVG are best for precise grids; Mermaid, D2, and Graphviz can approximate matrices with tables/subgraphs, and Vega/Vega-Lite suit data-driven matrices or heatmaps. diagram.zip has no dedicated semantic matrix or quadrant type, so renderer styling cannot substitute for axis definitions.

## Review

Check units, axis direction, ordering, thresholds, empty cells, legend, and accessibility. Verify rankings are not inferred from an arbitrary sort. If it is a heatmap, inspect the color scale and provide numeric values.

## Prior art and gaps

See [references/prior-art.md](references/prior-art.md). There is no single matrix interchange standard in diagram.zip; a data-driven matrix/heatmap integration could add schema validation and accessible tabular alternatives.
