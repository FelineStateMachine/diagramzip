---
id: create-actdiag
slug: /create/types/actdiag
title: ActDiag
description: Create an ActDiag diagram in diagram.zip.
sidebar_label: ActDiag
---

import DiagramExample from '@site/src/components/DiagramExample';

# ActDiag

ActDiag creates activity diagrams with actions and lanes.

## Use this type

Use ActDiag to show a process across people, systems, or teams.

## Source format

The source format is **ActDiag text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the diagram in an `actdiag` block.
- Use arrows to connect actions.
- Put related actions in a `lane` block.
- Put action attributes in square brackets.

### Example

```text
actdiag {
  write -> review -> share
  lane user {
    write; share;
  }
  lane agent {
    review;
  }
}
```

<DiagramExample engine="actdiag" label="ActDiag" sourceUrl="/examples/actdiag.json" />

## Related pages

- [Style ActDiag](/style/types/actdiag)
- [General presentation settings](/style/presentation)
- [Open ActDiag in the editor](https://diagram.zip/?type=actdiag)

## Upstream reference

[ActDiag documentation](http://blockdiag.com/en/actdiag/)
