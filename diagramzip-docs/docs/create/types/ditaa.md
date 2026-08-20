---
id: create-ditaa
slug: /create/types/ditaa
title: Ditaa
description: Create a Ditaa diagram in diagram.zip.
sidebar_label: Ditaa
---

import DiagramExample from '@site/src/components/DiagramExample';

# Ditaa

Ditaa converts an ASCII-art drawing into a clean diagram.

## Use this type

Use Ditaa when the source must remain readable as plain text.

## Source format

The source format is **ASCII diagram text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use ASCII lines to draw boxes and connectors.
- Put text inside a closed shape.
- Use arrowheads to set connector direction.
- Use Ditaa tags to set shape and color behavior.

### Example

```text
+--------+       +-------------+
|  User  |------>| diagram.zip |
+--------+       +-------------+
```

<DiagramExample engine="ditaa" label="Ditaa" sourceUrl="/examples/ditaa.json" />

## Related pages

- [Style Ditaa](/style/types/ditaa)
- [General presentation settings](/style/presentation)
- [Open Ditaa in the editor](https://diagram.zip/?type=ditaa)

## Upstream reference

[Ditaa documentation](https://github.com/stathissideris/ditaa)
