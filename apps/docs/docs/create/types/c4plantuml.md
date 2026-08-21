---
id: create-c4plantuml
slug: /create/types/c4plantuml
title: C4 PlantUML
description: Create a C4 PlantUML diagram in diagram.zip.
sidebar_label: C4 PlantUML
---

import DiagramExample from '@site/src/components/DiagramExample';

# C4 PlantUML

C4 PlantUML creates C4 software architecture diagrams with PlantUML macros.

## Use this type

Use C4 PlantUML for system landscape, system context, container, component, dynamic, and deployment views.

## Source format

The source format is **PlantUML with C4 macros**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Start and end the source with PlantUML directives.
- Include the required C4 library file.
- Declare people, systems, containers, or components.
- Use `Rel` macros to define relationships.

### Example

```text
@startuml
!include <C4/C4_Context>
Person(user, "User")
System(app, "diagram.zip")
Rel(user, app, "Creates diagrams")
@enduml
```

<DiagramExample engine="c4plantuml" label="C4 PlantUML" sourceUrl="/examples/c4plantuml.json" />

## Related pages

- [Style C4 PlantUML](/style/types/c4plantuml)
- [General presentation settings](/style/presentation)
- [Open C4 PlantUML in the editor](https://diagram.zip/?type=c4plantuml)

## Upstream reference

[C4 PlantUML documentation](https://github.com/plantuml-stdlib/C4-PlantUML)
