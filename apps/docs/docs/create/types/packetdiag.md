---
id: create-packetdiag
slug: /create/types/packetdiag
title: PacketDiag
description: Create a PacketDiag diagram in diagram.zip.
sidebar_label: PacketDiag
---

import DiagramExample from '@site/src/components/DiagramExample';

# PacketDiag

PacketDiag creates bit-field layouts for packets and binary records.

## Use this type

Use PacketDiag to show field positions, field widths, and grouped data.

## Source format

The source format is **PacketDiag text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the diagram in a `packetdiag` block.
- Set the column width when the default is not correct.
- Use bit ranges before field labels.
- Use attributes for field height or label rotation.

### Example

```text
packetdiag {
  colwidth = 16;
  0-3: Version;
  4-7: Flags;
  8-15: Length;
}
```

<DiagramExample engine="packetdiag" label="PacketDiag" sourceUrl="/examples/packetdiag.json" />

## Related pages

- [Style PacketDiag](/style/types/packetdiag)
- [General presentation settings](/style/presentation)
- [Open PacketDiag in the editor](https://diagram.zip/?type=packetdiag)

## Upstream reference

[PacketDiag documentation](http://blockdiag.com/en/nwdiag/packetdiag-examples.html)
