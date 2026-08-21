---
id: create-vega
slug: /create/types/vega
title: Vega
description: Create a Vega diagram in diagram.zip.
sidebar_label: Vega
---

import DiagramExample from '@site/src/components/DiagramExample';

# Vega

Vega creates data visualizations from a declarative JSON specification.

## Use this type

Use Vega when you need detailed control of data, scales, signals, marks, and interactions.

## Source format

The source format is **Vega JSON**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use a JSON object with a Vega schema URL.
- Put inline records in a data source.
- Define scales and axes before marks use them.
- Use mark encodings to map data to visual properties.

### Example

```json
{
  "$schema": "https://vega.github.io/schema/vega/v6.json",
  "width": 320,
  "height": 180,
  "padding": 5,
  "data": [{
    "name": "steps",
    "values": [
      {"step": "Create", "count": 8},
      {"step": "Review", "count": 5},
      {"step": "Share", "count": 7}
    ]
  }],
  "scales": [
    {"name": "x", "type": "band", "domain": {"data": "steps", "field": "step"}, "range": "width", "padding": 0.2},
    {"name": "y", "type": "linear", "domain": {"data": "steps", "field": "count"}, "nice": true, "zero": true, "range": "height"}
  ],
  "axes": [
    {"orient": "bottom", "scale": "x"},
    {"orient": "left", "scale": "y"}
  ],
  "marks": [{
    "type": "rect",
    "from": {"data": "steps"},
    "encode": {"enter": {
      "x": {"scale": "x", "field": "step"},
      "width": {"scale": "x", "band": 1},
      "y": {"scale": "y", "field": "count"},
      "y2": {"scale": "y", "value": 0},
      "fill": {"value": "#7c3aed"}
    }}
  }]
}
```

<DiagramExample engine="vega" label="Vega" sourceUrl="/examples/vega.json" />

## Limitations

- URL-backed data and images are not available.
- diagram.zip returns SVG for this type.

## Related pages

- [Style Vega](/style/types/vega)
- [General presentation settings](/style/presentation)
- [Open Vega in the editor](https://diagram.zip/?type=vega)

## Upstream reference

[Vega documentation](https://vega.github.io/vega/docs/)
