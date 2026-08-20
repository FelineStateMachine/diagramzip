---
id: create-nwdiag
slug: /create/types/nwdiag
title: NwDiag
description: Create a NwDiag diagram in diagram.zip.
sidebar_label: NwDiag
---

import DiagramExample from '@site/src/components/DiagramExample';

# NwDiag

NwDiag creates network diagrams from networks, addresses, and hosts.

## Use this type

Use NwDiag to show network segments and the devices that connect to them.

## Source format

The source format is **NwDiag text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the diagram in an `nwdiag` block.
- Declare each network in a `network` block.
- Declare hosts inside a network.
- Use attributes for addresses and labels.

### Example

```text
nwdiag {
  network public {
    address = "192.0.2.0/24";
    gateway [address = "192.0.2.1"];
  }
}
```

<DiagramExample engine="nwdiag" label="NwDiag" sourceUrl="/examples/nwdiag.json" />

## Related pages

- [Style NwDiag](/style/types/nwdiag)
- [General presentation settings](/style/presentation)
- [Open NwDiag in the editor](https://diagram.zip/?type=nwdiag)

## Upstream reference

[NwDiag documentation](http://blockdiag.com/en/nwdiag/)
