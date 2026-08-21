---
id: create-diagramsnet
slug: /create/types/diagramsnet
title: Diagrams.net
description: Create a Diagrams.net diagram in diagram.zip.
sidebar_label: Diagrams.net
---

import DiagramExample from '@site/src/components/DiagramExample';

# Diagrams.net

Diagrams.net renders a diagram from its native XML document.

## Use this type

Use this type when diagrams.net is the source editor for the diagram.

## Source format

The source format is **diagrams.net XML**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use an `mxfile` document.
- Put each page in a `diagram` element.
- Store cells in an `mxGraphModel` structure.
- Keep element IDs unique inside the document.

### Source structure

This source shows the document structure. It is not a complete document.

```xml
<mxfile>
  <diagram name="Page-1">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

The rendered view uses a complete project example for this diagram type.

<DiagramExample engine="diagramsnet" label="Diagrams.net" sourceUrl="/examples/diagramsnet.json" />

## Related pages

- [Style Diagrams.net](/style/types/diagramsnet)
- [General presentation settings](/style/presentation)
- [Open Diagrams.net in the editor](https://diagram.zip/?type=diagramsnet)

## Upstream reference

[Diagrams.net documentation](https://www.diagrams.net/doc/faq/diagram-source-edit)
