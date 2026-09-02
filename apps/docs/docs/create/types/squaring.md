---
id: create-squaring
slug: /create/types/squaring
title: Squaring
description: Create a Squaring diagram in diagram.zip.
sidebar_label: Squaring
---

import DiagramExample from '@site/src/components/DiagramExample';

# Squaring

Squaring draws a squared rectangle, which is a rectangle tiled by squares, next to its Smith diagram. In that circuit every horizontal segment is a node and every square is a unit resistor whose current equals its side.

## Use this type

Use Squaring to explore squared rectangles and squared squares, or to check whether a dissection is simple and perfect. It can also build a squaring backwards from a planar network once you choose a battery edge.

## Source format

The source format is **Squaring text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Optionally begin with `.view rectangle`, `.view circuit`, `.view overlay`, or `.view both`; the default is `both`.
- Add `.labels none` to hide side lengths, voltages, and currents.
- Add `title` followed by text to name the diagram.
- For a known dissection, write `rectangle <width> x <height>` and then the square sides in Bouwkamp order; parentheses and commas are ignored.
- Bouwkamp order places each square at the leftmost point of the highest unfilled segment. Squares that share a top edge are listed left to right.
- For a network, write `battery <positive> <negative>` and then wires as `wire a b` or chains such as `a - b - c`.
- Every wire has resistance one; the renderer solves Kirchhoff and Ohm exactly, scales the voltages so all sides are whole numbers, and arranges the squares.
- The battery replaces one edge of the graph, so do not list that edge as a wire. A wire parallel to the battery becomes a full-height square.
- The network form needs a planar network in which the battery closes a face; polyhedral (3-connected planar) networks give a simple squaring.
- The caption reports the order, size, whether the squaring is simple (no smaller rectangle of squares) and perfect (no repeated side), and the battery.
- Compound blocks are outlined; node color runs from blue at the negative pole to red at the positive pole.
- Start comments with `#`.

### Example

```text
.view both
title Order 9 simple perfect squared rectangle

rectangle 33 x 32
squares (18 15) (7 8) (14 4) (10 1) (9)
```

<DiagramExample engine="squaring" label="Squaring" sourceUrl="/examples/squaring.json" />

## Origin

Squaring originates with [Brooks, Smith, Stone, and Tutte](https://doi.org/10.1215/S0012-7094-40-00718-9) at [The dissection of rectangles into squares (Duke Mathematical Journal, 1940)](https://doi.org/10.1215/S0012-7094-40-00718-9). Diagram.zip implements a text notation and SVG renderer for the squared-rectangle and Smith-diagram correspondence that the four Trinity students discovered.

## Limitations

- Networks are arranged by search, so very large or non-planar networks are rejected instead of drawn.
- A wire whose two nodes settle at the same voltage carries no current and is rejected; choose another battery.
- Node positions in the Smith diagram follow the midpoints of the horizontal segments rather than a spring layout.

## Related pages

- [Style Squaring](/style/types/squaring)
- [General presentation settings](/style/presentation)
- [Open Squaring in the editor](https://diagram.zip/?type=squaring)

## Upstream reference

[Squaring documentation](https://www.squaring.net/)
