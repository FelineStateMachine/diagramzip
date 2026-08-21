---
id: create-pikchr
slug: /create/types/pikchr
title: Pikchr
description: Create a Pikchr diagram in diagram.zip.
sidebar_label: Pikchr
---

import DiagramExample from '@site/src/components/DiagramExample';

# Pikchr

Pikchr creates precise technical drawings from relative placement commands.

## Use this type

Use Pikchr when you need controlled geometry and readable text source.

## Source format

The source format is **Pikchr text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Create objects with commands such as `box`, `circle`, and `arrow`.
- Use directions and anchor names for relative placement.
- Assign a name when another command must reference an object.
- Put text in quoted strings.

### Example

```text
box "User"
arrow right 0.6
box "diagram.zip"
```

<DiagramExample engine="pikchr" label="Pikchr" sourceUrl="/examples/pikchr.json" />

## Related pages

- [Style Pikchr](/style/types/pikchr)
- [General presentation settings](/style/presentation)
- [Open Pikchr in the editor](https://diagram.zip/?type=pikchr)

## Upstream reference

[Pikchr documentation](https://pikchr.org/home/doc/trunk/doc/userman.md)
