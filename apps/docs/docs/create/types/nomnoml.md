---
id: create-nomnoml
slug: /create/types/nomnoml
title: Nomnoml
description: Create a Nomnoml diagram in diagram.zip.
sidebar_label: Nomnoml
---

import DiagramExample from '@site/src/components/DiagramExample';

# Nomnoml

Nomnoml creates UML-style diagrams from bracketed classifiers and relationships.

## Use this type

Use Nomnoml for fast class, component, and relationship sketches.

## Source format

The source format is **Nomnoml text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put each classifier in square brackets.
- Separate name, attributes, and methods with a vertical bar.
- Connect classifiers with a relationship operator.
- Put directives at the start of the source.

### Example

```text
#direction: right
[User]->[Diagram]
[Diagram|title: string|save(); share()]
```

<DiagramExample engine="nomnoml" label="Nomnoml" sourceUrl="/examples/nomnoml.json" />

## Limitations

- diagram.zip returns SVG for this type.

## Related pages

- [Style Nomnoml](/style/types/nomnoml)
- [General presentation settings](/style/presentation)
- [Open Nomnoml in the editor](https://diagram.zip/?type=nomnoml)

## Upstream reference

[Nomnoml documentation](https://nomnoml.com/)
