---
id: create-seqdiag
slug: /create/types/seqdiag
title: SeqDiag
description: Create a SeqDiag diagram in diagram.zip.
sidebar_label: SeqDiag
---

import DiagramExample from '@site/src/components/DiagramExample';

# SeqDiag

SeqDiag creates sequence diagrams from message statements.

## Use this type

Use SeqDiag to show requests, responses, and ordered interactions.

## Source format

The source format is **SeqDiag text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the diagram in a `seqdiag` block.
- Use arrows to send messages.
- Use a left arrow for a response.
- Put message attributes in square brackets.

### Example

```text
seqdiag {
  user -> agent [label = "Create diagram"];
  user <-- agent [label = "Return link"];
}
```

<DiagramExample engine="seqdiag" label="SeqDiag" sourceUrl="/examples/seqdiag.json" />

## Related pages

- [Style SeqDiag](/style/types/seqdiag)
- [General presentation settings](/style/presentation)
- [Open SeqDiag in the editor](https://diagram.zip/?type=seqdiag)

## Upstream reference

[SeqDiag documentation](http://blockdiag.com/en/seqdiag/)
