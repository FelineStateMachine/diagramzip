---
id: create-mermaid
slug: /create/types/mermaid
title: Mermaid
description: Create a Mermaid diagram in diagram.zip.
sidebar_label: Mermaid
---

import DiagramExample from '@site/src/components/DiagramExample';

# Mermaid

Mermaid creates diagrams with compact, Markdown-friendly text.

## Use this type

Use Mermaid for flowcharts, sequence diagrams, class diagrams, state diagrams, timelines, and many other diagram forms.

## Source format

The source format is **Mermaid text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the diagram keyword on the first line.
- Declare nodes, participants, or data after the keyword.
- Use the syntax for the selected Mermaid diagram form.
- diagram.zip rejects frontmatter settings that reduce renderer security.

### Example

```text
flowchart LR
  Idea[Idea] --> Agent[Agent]
  Agent --> Diagram[Shared diagram]
```

<DiagramExample engine="mermaid" label="Mermaid" sourceUrl="/examples/mermaid.json" />

## Limitations

- diagram.zip removes active content and unsafe external resources from the SVG.
- Security configuration values cannot reduce the renderer security level.

## Related pages

- [Style Mermaid](/style/types/mermaid)
- [General presentation settings](/style/presentation)
- [Open Mermaid in the editor](https://diagram.zip/?type=mermaid)

## Upstream reference

[Mermaid documentation](https://mermaid.js.org/intro/)
