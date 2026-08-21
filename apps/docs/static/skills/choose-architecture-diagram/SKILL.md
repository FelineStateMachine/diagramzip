---
name: choose-architecture-diagram
description: Choose the smallest architecture view that answers the stakeholder's question, then route it to a suitable diagram source.
---

# Choose an architecture diagram

## What it tells

This skill is a decision aid for selecting an architecture view before drawing. It distinguishes landscape, context, container, component, deployment, dynamic, and block views by audience, scope, and relationship semantics.

## When to use

Use it when a request says “architecture diagram” without naming a view, or when the requested picture risks mixing organizational scope, runtime behavior, and implementation structure. Ask who needs the decision, what boundary they need, and whether the question is static structure, runtime interaction, or physical placement.

Avoid it when the user has already named a precise view and its scope. Use the corresponding architecture skill directly, preserving the user's choice.

## Method

1. Restate the question as a decision or explanation.
2. Choose one primary view and make its system boundary explicit.
3. Keep the abstraction level consistent; do not mix components with external organizations or deployment hosts without a deliberate second view.
4. Name relationships with a verb and, where useful, a protocol or trust boundary.
5. Offer a companion view only when it answers a separate question.

Use the C4 model as a notation-independent framing aid: landscape for many systems, context for one system and its users/dependencies, container for deployable/runtime units, and component for internals of one container. Use deployment for nodes/environments and dynamic views for a scenario over time. A block diagram is appropriate when the domain is not software or when informal modular decomposition is enough.

## Renderer routing

Preserve an explicitly requested renderer. Otherwise prefer `structurizr` when one C4 model should produce several views, `c4plantuml` for a focused C4 view, `plantuml` for UML-flavoured architecture, `mermaid` or `d2` for lightweight sketches, `graphviz` for graph-heavy dependencies, and `blockdiag` for simple block structure. These are source choices, not diagram types; confirm the renderer can express the chosen semantics before generating.

## Style and customization

Use a restrained palette, a visible legend, directional flow, short labels, and a title stating scope and audience. Use consistent shapes for people, software systems, containers, components, and external dependencies. Prefer line styles or icons for trust, synchronous/asynchronous, and data-flow distinctions; never rely on color alone. Generate a second focused diagram when labels become paragraphs.

## Review

Check that every element is inside or outside the boundary intentionally, every arrow has a readable meaning, the audience can identify the level of abstraction, and no implementation detail is implied by an informal shape. Check that the diagram remains useful in grayscale and at its intended size. If the user needs formal conformance, call out that C4 itself is a model/framing convention rather than an ISO notation standard.

## Prior art and limits

The C4 model is explicitly notation-independent. C4 PlantUML is a practical renderer library, not a formal interchange standard. ArchiMate and SysML offer stronger formal viewpoints/modeling semantics but are not currently represented by a dedicated diagram.zip source skill; integration would require a compatible renderer/import path and a decision on conformance. See [C4 diagrams](https://c4model.com/diagrams), [C4 notation](https://c4model.com/diagrams/notation), [ArchiMate](https://www.opengroup.org/archimate-forum/archimate-overview), and [OMG SysML](https://www.omg.org/sysml/).
