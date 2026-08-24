---
id: create-trn
slug: /create/types/trn
title: TRN
description: Create a TRN diagram in diagram.zip.
sidebar_label: TRN
---

import DiagramExample from '@site/src/components/DiagramExample';

# TRN

TRN stands for Tabular Recipe Notation. It shows how ingredients and intermediate outcomes combine into one or more final results.

## Use this type

Use TRN for recipes, crafting trees, assembly instructions, and other nested transformations.

## Source format

The source format is **Tabular Recipe Notation text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Optionally begin with `.layout combined` or `.layout individual`; the default is `combined`.
- Declare each leaf value with `ingredient`.
- Declare a meaningful final or reusable result with an `outcome` block.
- Keep incidental conversions, such as ore to bars, as steps inside the outcome that consumes them.
- Add a full-width preparation row with `instruction`.
- Long instruction rows wrap and grow vertically to preserve their complete text.
- Add a quoted display label after an identifier when needed.
- Each `+` queues an input for the next `->`; place it immediately before the operation that consumes it.
- Columns represent dependency depth. Independent operations on disjoint inputs can share a column.
- Consecutive `->` lines without a new input extend the same branch from left to right.
- Write one complete instruction in each `->` step.
- Combined layout places prerequisite outcomes before direct ingredients in stable FIFO order.
- Add `portion` after an outcome label or identifier when the result has a useful quantity.
- Use `{portion}` in an action to embed that outcome quantity.
- Start comments with `#`; OCR importers should record uncertain text in comments instead of guessing.

### Example

```text
.layout combined

ingredient flour "Bread flour"
ingredient water
ingredient yeast
ingredient salt

outcome bread portion 1 loaf {
  + flour 500 g
  + water 350 ml
  + yeast 7 g
  + salt 10 g
  -> mix
  -> knead
  -> proof for 1 hour
  -> bake {portion} at 230°C for 30 minutes
}
```

<DiagramExample engine="trn" label="TRN" sourceUrl="/examples/trn.json" />


## Public authoring contract

- Treat TRN source as the only public geometry control surface.
- Select combined or individual geometry with the `.layout` directive.
- Presentation appearance changes palette and canvas treatment. It does not change TRN layout, orientation, wrapping, or packing.
- Edit the TRN source and request a new render.
- Do not edit generated SVG, CSS classes, data attributes, viewBox values, or renderer implementation files.
- If the source format cannot express requested geometry, report the limitation instead of patching renderer output.
## Origin

TRN originates with [Michael Chu](https://www.cookingforengineers.com/) at [Cooking for Engineers](https://www.cookingforengineers.com/). Diagram.zip implements a text DSL and SVG renderer for Chu’s tabular recipe concept.

## Limitations

- The source selects one layout; the SVG does not embed an interactive layout toggle.
- Combined and individual operation labels do not wrap. Long operation text can overflow.
- TRN does not expose a source control for custom column packing.

## Related pages

- [Style TRN](/style/types/trn)
- [General presentation settings](/style/presentation)
- [Open TRN in the editor](https://diagram.zip/?type=trn)

## Upstream reference

[TRN documentation](https://www.cookingforengineers.com/2004/08/recipe-summaries-standards-and.html)
