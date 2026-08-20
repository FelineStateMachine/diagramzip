---
id: create-blockdiag
slug: /create/types/blockdiag
title: BlockDiag
description: Create a BlockDiag diagram in diagram.zip.
sidebar_label: BlockDiag
---

import DiagramExample from '@site/src/components/DiagramExample';

# BlockDiag

BlockDiag creates block diagrams with automatic layout.

## Use this type

Use BlockDiag for systems, processes, and component relationships.

## Source format

The source format is **BlockDiag text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the diagram in a `blockdiag` block.
- Separate statements with semicolons.
- Use arrows to connect nodes.
- Put node attributes in square brackets.

### Example

```text
blockdiag {
  idea -> agent -> diagram;
  agent [color = "#dbeafe"];
}
```

<DiagramExample engine="blockdiag" label="BlockDiag" sourceUrl="/examples/blockdiag.json" />

## Related pages

- [Style BlockDiag](/style/types/blockdiag)
- [General presentation settings](/style/presentation)
- [Open BlockDiag in the editor](https://diagram.zip/?type=blockdiag)

## Upstream reference

[BlockDiag documentation](http://blockdiag.com/en/blockdiag/)
