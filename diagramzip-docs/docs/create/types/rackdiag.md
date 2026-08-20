---
id: create-rackdiag
slug: /create/types/rackdiag
title: RackDiag
description: Create a RackDiag diagram in diagram.zip.
sidebar_label: RackDiag
---

import DiagramExample from '@site/src/components/DiagramExample';

# RackDiag

RackDiag creates equipment-rack diagrams from rack-unit positions.

## Use this type

Use RackDiag to document servers, switches, power units, and unused rack space.

## Source format

The source format is **RackDiag text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the diagram in a `rackdiag` block.
- Declare the total rack height in rack units.
- Put the start position before each device.
- Put the device height in square brackets.

### Example

```text
rackdiag {
  8U;
  1: UPS [2U];
  3: Server [2U];
  5: Switch;
}
```

<DiagramExample engine="rackdiag" label="RackDiag" sourceUrl="/examples/rackdiag.json" />

## Related pages

- [Style RackDiag](/style/types/rackdiag)
- [General presentation settings](/style/presentation)
- [Open RackDiag in the editor](https://diagram.zip/?type=rackdiag)

## Upstream reference

[RackDiag documentation](http://blockdiag.com/en/nwdiag/rackdiag-examples.html)
