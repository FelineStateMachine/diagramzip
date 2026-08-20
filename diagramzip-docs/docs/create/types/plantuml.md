---
id: create-plantuml
slug: /create/types/plantuml
title: PlantUML
description: Create a PlantUML diagram in diagram.zip.
sidebar_label: PlantUML
---

import DiagramExample from '@site/src/components/DiagramExample';

# PlantUML

PlantUML creates UML and related diagrams from directives and relationships.

## Use this type

Use PlantUML for sequence, class, activity, state, component, deployment, and use-case diagrams.

## Source format

The source format is **PlantUML text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Start the source with `@startuml`.
- End the source with `@enduml`.
- Declare participants or elements before complex relationships.
- Use arrows to define relationships or messages.

### Example

```text
@startuml
actor Alice
participant Service
Alice -> Service: Create a diagram
Service --> Alice: Return the link
@enduml
```

<DiagramExample engine="plantuml" label="PlantUML" sourceUrl="/examples/plantuml.json" />

## Related pages

- [Style PlantUML](/style/types/plantuml)
- [General presentation settings](/style/presentation)
- [Open PlantUML in the editor](https://diagram.zip/?type=plantuml)

## Upstream reference

[PlantUML documentation](https://plantuml.com/)
