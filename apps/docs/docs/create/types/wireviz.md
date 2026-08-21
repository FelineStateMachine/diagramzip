---
id: create-wireviz
slug: /create/types/wireviz
title: WireViz
description: Create a WireViz diagram in diagram.zip.
sidebar_label: WireViz
---

import DiagramExample from '@site/src/components/DiagramExample';

# WireViz

WireViz creates wiring-harness diagrams from connectors, cables, and connections.

## Use this type

Use WireViz to document cable assemblies, pins, wire colors, gauges, and connector mappings.

## Source format

The source format is **WireViz YAML**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Declare connectors in the `connectors` map.
- Declare cables in the `cables` map.
- Put wiring paths in the `connections` list.
- Use matching pin and wire lists for grouped connections.

### Example

```yaml
connectors:
  X1:
    type: Molex
    pinlabels: [GND, DATA]
cables:
  W1:
    wirecount: 2
connections:
  - - X1: [1, 2]
    - W1: [1, 2]
```

<DiagramExample engine="wireviz" label="WireViz" sourceUrl="/examples/wireviz.json" />

## Related pages

- [Style WireViz](/style/types/wireviz)
- [General presentation settings](/style/presentation)
- [Open WireViz in the editor](https://diagram.zip/?type=wireviz)

## Upstream reference

[WireViz documentation](https://github.com/wireviz/WireViz)
