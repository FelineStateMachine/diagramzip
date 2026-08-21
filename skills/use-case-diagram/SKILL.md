---
name: use-case-diagram
description: Use when the user needs to explain who can achieve which externally visible goals with a system, including actors, system boundaries, and goal relationships.
---

# Use-case diagram

## What and why

Use a use-case diagram to scope a system from the perspective of actors and their goals. It tells the story of who interacts with the system and what value they seek, not how the implementation works.

Choose it when the question is “who needs which capability?” Avoid it for call ordering, internal architecture, data movement, or detailed requirements; use a sequence, context, or data-flow diagram instead.

## How

1. Name the system boundary and write each use case as an observable goal using a verb.
2. Identify human, organizational, device, or external-system actors; keep actors outside the boundary.
3. Connect actors to goals they participate in. Use `include` only for required reused behavior and `extend` only for optional behavior at an explicit extension point.
4. Add generalization only when a specialized actor or goal is substitutable for a more general one.
5. Keep the diagram at one scope and move scenarios, exceptions, and acceptance criteria into accompanying text.

## Story and styling

The visual hierarchy should make the boundary, actors, and primary goals obvious. Prefer a small set of neutral actor/system colors, strong boundary contrast, and short labels. Group use cases by capability area only when that grouping answers a real scope question; do not turn every subsystem into an actor.

If the user has not chosen a renderer, use `plantuml` for UML notation or `mermaid` for a lightweight, Markdown-friendly version. `c4plantuml` is appropriate for a system-context view, not detailed use-case semantics. Preserve an explicit renderer choice. Mermaid and PlantUML can express the common notation, but neither is a requirements repository or a complete UML interchange format.

## Review

- Is every actor outside the system boundary and named by a role?
- Does every use case state a user-visible goal rather than an implementation step?
- Are `include`, `extend`, and generalization used sparingly and in the correct direction?
- Is scope narrow enough to read without a legend-heavy wall of bubbles?
- Are assumptions, alternate flows, and non-functional requirements documented elsewhere?

## Prior art and limitations

The notation follows the UML use-case model in [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/), especially Use Cases and Relationships. For accessibility expectations for the rendered SVG, apply [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and provide a meaningful title/description where the host supports it.

The available renderers do not provide a standards-complete UML model exchange or traceability to requirements tools. Supporting XMI/UML interchange would be a separate integration opportunity.
