---
id: create-vegalite
slug: /create/types/vegalite
title: Vega-Lite
description: Create a Vega-Lite diagram in diagram.zip.
sidebar_label: Vega-Lite
---

import DiagramExample from '@site/src/components/DiagramExample';

# Vega-Lite

Vega-Lite creates data visualizations from concise mark and encoding declarations.

## Use this type

Use Vega-Lite for common charts that do not need the full Vega grammar.

## Source format

The source format is **Vega-Lite JSON**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use a JSON object with a Vega-Lite schema URL.
- Put inline records in `data.values`.
- Select a mark type.
- Map fields to channels in the `encoding` object.

### Example

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"values": [{"name": "A", "value": 4}]},
  "mark": "bar",
  "encoding": {
    "x": {"field": "name", "type": "nominal"},
    "y": {"field": "value", "type": "quantitative"}
  }
}
```

<DiagramExample engine="vegalite" label="Vega-Lite" sourceUrl="/examples/vegalite.json" />

## Limitations

- URL-backed data and images are not available.
- diagram.zip returns SVG for this type.

## Related pages

- [Style Vega-Lite](/style/types/vegalite)
- [General presentation settings](/style/presentation)
- [Open Vega-Lite in the editor](https://diagram.zip/?type=vegalite)

## Upstream reference

[Vega-Lite documentation](https://vega.github.io/vega-lite/docs/)
