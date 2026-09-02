---
id: style-squaring
slug: /style/types/squaring
title: Squaring
description: Style a Squaring diagram in diagram.zip.
sidebar_label: Squaring
---

# Style Squaring

Squaring tints each square by the voltage at its top edge, colors nodes from blue to red by voltage, and scales wire thickness by current. Compound blocks are outlined with a dashed line.

Start with the [general presentation settings](/style/presentation). Edit shared or raw presentation in Details, and keep renderer-specific styling in Source.

## Source controls

- Use `.view rectangle` for the dissection alone and `.view circuit` for the Smith diagram alone.
- Use `.view overlay` to draw the circuit on top of the squares, which shows how each segment collapses into a node.
- Use `.labels none` for large dissections where numbers would not fit.
- Choose a different battery wire in a network to obtain a different squaring from the same graph.
- Reorder the square list, not the geometry, to change a Bouwkamp dissection.
## Limitations

- Networks are arranged by search, so very large or non-planar networks are rejected instead of drawn.
- A wire whose two nodes settle at the same voltage carries no current and is rejected; choose another battery.
- Node positions in the Smith diagram follow the midpoints of the horizontal segments rather than a spring layout.

## Related pages

- [Create a Squaring diagram](/create/types/squaring)
- [General presentation settings](/style/presentation)
- [SVG normalization and version contracts](/style/svg-normalization)
- [Open Squaring in the editor](https://diagram.zip/?type=squaring)
