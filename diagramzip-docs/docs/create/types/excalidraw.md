---
id: create-excalidraw
slug: /create/types/excalidraw
title: Excalidraw
description: Create an Excalidraw diagram in diagram.zip.
sidebar_label: Excalidraw
---

import DiagramExample from '@site/src/components/DiagramExample';

# Excalidraw

Excalidraw renders a hand-drawn diagram from an Excalidraw JSON document.

## Use this type

Use this type when Excalidraw is the source editor for the diagram.

## Source format

The source format is **Excalidraw JSON**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use an Excalidraw JSON object.
- Put drawable objects in the `elements` array.
- Put document settings in the `appState` object.
- Keep element IDs unique.

### Source structure

This source shows the document structure. It is not a complete document.

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [],
  "appState": {
    "viewBackgroundColor": "#ffffff"
  }
}
```

The rendered view uses a complete project example for this diagram type.

<DiagramExample engine="excalidraw" label="Excalidraw" sourceUrl="/examples/excalidraw.json" />

## Related pages

- [Style Excalidraw](/style/types/excalidraw)
- [General presentation settings](/style/presentation)
- [Open Excalidraw in the editor](https://diagram.zip/?type=excalidraw)

## Upstream reference

[Excalidraw documentation](https://docs.excalidraw.com/docs/codebase/json-schema/)
