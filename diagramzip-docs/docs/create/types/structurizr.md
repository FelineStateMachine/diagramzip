---
id: create-structurizr
slug: /create/types/structurizr
title: Structurizr
description: Create a Structurizr diagram in diagram.zip.
sidebar_label: Structurizr
---

import DiagramExample from '@site/src/components/DiagramExample';

# Structurizr

Structurizr creates C4 architecture views from a workspace model.

## Use this type

Use Structurizr when one model must produce multiple software architecture views.

## Source format

The source format is **Structurizr DSL**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put the model and views in a `workspace` block.
- Declare people, systems, containers, and components in the model.
- Declare relationships in the model.
- Select elements and layout rules in each view.

### Example

```text
workspace {
  model {
    user = person "User"
    app = softwareSystem "diagram.zip"
    user -> app "Creates diagrams"
  }
  views {
    systemLandscape { include *; autolayout lr }
  }
}
```

The rendered view uses a complete project example for this diagram type.

<DiagramExample engine="structurizr" label="Structurizr" sourceUrl="/examples/structurizr.json" />

## Related pages

- [Style Structurizr](/style/types/structurizr)
- [General presentation settings](/style/presentation)
- [Open Structurizr in the editor](https://diagram.zip/?type=structurizr)

## Upstream reference

[Structurizr documentation](https://docs.structurizr.com/dsl)
