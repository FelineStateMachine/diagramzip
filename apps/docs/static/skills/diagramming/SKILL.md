---
name: diagramming
description: Choose the semantic diagram story first, then select a diagram.zip renderer and produce a clear, reviewable diagram.
---

# Diagramming

## What this is

Use this as the model-invokable router for diagram requests. A renderer is a notation and execution choice; a diagram type is the story the reader needs. Select the story before selecting syntax.

## Why

The same system can be shown as a flow, interaction, boundary, dependency, data model, or physical layout. Choosing by renderer first commonly produces a technically valid diagram that answers the wrong question.

## How to route

1. Ask or infer the audience, decision, scope, time direction, and required level of detail.
2. Choose the smallest semantic skill that matches the question. Prefer `diagram-workshop` when the user needs help discovering the question; it is user-invokable only and must not be invoked implicitly.
3. Read that skill, including its references when the subject is formal or safety-sensitive.
4. Choose a supported renderer from the local renderer catalog. Preserve an explicit renderer request even if another renderer is a better fit; explain any limitation and adapt the source.
5. Make one main claim visually dominant. Label relationships with verbs, keep a consistent direction, and remove details that do not support the claim.
6. Review the result for semantic correctness, layout, accessibility, and renderer limitations. Offer a second view when one diagram cannot answer two different questions.

## Renderer routing

Common choices include Mermaid for compact general diagrams, PlantUML for UML-oriented notation, C4 PlantUML for C4 views, and Graphviz or D2 for graph structure. BPMN supports formal process exchange, DBML supports relational schemas, and PacketDiag or Bytefield supports protocol fields.

The complete renderer set and syntax links are in [llms.txt](https://docs.diagram.zip/llms.txt) and [diagram-types.json](https://docs.diagram.zip/diagram-types.json). Semantic routing metadata is in [diagram-skills.json](https://docs.diagram.zip/diagram-skills.json).

Do not infer standards support from a similarly named renderer mode. Confirm the renderer's output and interchange fidelity.

## diagram.zip delivery

Keep renderer notation in Source. Use Details only for the title, description, and presentation settings. Follow the [presentation guide](https://docs.diagram.zip/style/presentation/) for the current JSON shape.

## Prior art and standards

Use the [OMG UML specification](https://www.omg.org/spec/UML), [OMG BPMN specification](https://www.omg.org/spec/BPMN/2.0.2/), [C4 notation](https://c4model.com/diagrams/notation), and other authoritative references linked by the selected semantic skill when formal conformance matters. Treat these as guidance for meaning and notation, not as permission to invent unsupported renderer features.

## Review checklist

- Can the intended reader state the diagram's question in one sentence?
- Are nodes, relationships, boundaries, and direction consistent with the selected story?
- Is every label necessary and unambiguous?
- Does the chosen renderer actually support the required semantics, layout, and export?
- Are text, contrast, alternative descriptions, and SVG metadata adequate for the delivery context?
- Have unsupported standards or fidelity gaps been named as integration opportunities?
