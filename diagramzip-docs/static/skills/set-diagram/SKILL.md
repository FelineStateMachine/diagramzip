---
name: set-diagram
description: Use when the user needs to show membership, overlap, exclusion, union, intersection, or nested categories with sets.
---

# Set diagram

## What / why

A set diagram tells the story “which elements belong to which sets, and where do memberships overlap?” Use Venn diagrams for a small number of sets and Euler diagrams when only meaningful intersections should be shown. Choose a graph for typed relationships or a matrix for exhaustive pairwise comparison.

## How to model

- Define each set and the universe or scope; state whether circles are exhaustive.
- Put elements in regions only when membership is known; distinguish empty from unknown.
- Label intersections with the set operation or plain-language meaning.
- Keep set count small enough for legible regions; use an Euler representation for sparse overlaps.
- Do not use area or circle size to imply quantity unless it is quantitatively encoded and explained.

## Styling and customization

Use overlapping outlines with high-contrast labels, transparent fills, and patterns or labels in addition to color. Avoid excessive intersections. Provide an accessible list/table of memberships when important, and keep the universe boundary visible when it matters.

## Renderer choices

Preserve user choice. Mermaid, Graphviz, D2, PlantUML, and diagrams.net can approximate set diagrams with shapes and labels; diagrams.net or custom SVG is better for controlled overlap. diagram.zip has no dedicated Venn/Euler semantic renderer or overlap solver, so verify memberships manually and do not claim proportional geometry.

## Review

Check every region against membership data, confirm empty/unknown regions, make labels readable, and test grayscale/colorblind viewing. Ensure the chosen Venn layout can represent stated intersections; otherwise switch to Euler or a table.

## Prior art and gaps

See [references/prior-art.md](references/prior-art.md). A native set renderer would need membership input, Venn/Euler layout validation, and an accessible tabular fallback; this is an integration opportunity rather than current diagram.zip support.
