---
id: create-bytefield
slug: /create/types/bytefield
title: Bytefield
description: Create a Bytefield diagram in diagram.zip.
sidebar_label: Bytefield
---

import DiagramExample from '@site/src/components/DiagramExample';

# Bytefield

Bytefield creates byte-oriented protocol diagrams from drawing forms.

## Use this type

Use Bytefield for byte layouts, headers, payloads, and protocol documentation.

## Source format

The source format is **bytefield-svg forms**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put one drawing form on each line.
- Use `draw-box` to add a field.
- Use a property map to set a span.
- Use gap and bottom forms to complete the layout.

### Example

```clojure
(draw-column-headers)
(draw-box "Type" {:span 2})
(draw-box "Length" {:span 2})
(draw-gap "Payload")
(draw-bottom)
```

<DiagramExample engine="bytefield" label="Bytefield" sourceUrl="/examples/bytefield.json" />

## Limitations

- diagram.zip returns SVG for this type.

## Related pages

- [Style Bytefield](/style/types/bytefield)
- [General presentation settings](/style/presentation)
- [Open Bytefield in the editor](https://diagram.zip/?type=bytefield)

## Upstream reference

[Bytefield documentation](https://bytefield-svg.deepsymmetry.org/)
