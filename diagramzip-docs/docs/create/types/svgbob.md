---
id: create-svgbob
slug: /create/types/svgbob
title: Svgbob
description: Create a Svgbob diagram in diagram.zip.
sidebar_label: Svgbob
---

import DiagramExample from '@site/src/components/DiagramExample';

# Svgbob

Svgbob converts ASCII-art diagrams into SVG.

## Use this type

Use Svgbob for boxes, arrows, circuits, and diagrams that must remain readable as text.

## Source format

The source format is **ASCII diagram text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use ASCII or supported Unicode drawing characters.
- Close shapes when you need filled regions.
- Put arrowheads at connector ends.
- Put labels where they do not touch a line.

### Example

```text
+------+       +---------+
| User |------>| Diagram |
+------+       +---------+
```

<DiagramExample engine="svgbob" label="Svgbob" sourceUrl="/examples/svgbob.json" />

## Related pages

- [Style Svgbob](/style/types/svgbob)
- [General presentation settings](/style/presentation)
- [Open Svgbob in the editor](https://diagram.zip/?type=svgbob)

## Upstream reference

[Svgbob documentation](https://ivanceras.github.io/svgbob-editor/)
