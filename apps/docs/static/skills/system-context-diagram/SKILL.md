---
name: system-context-diagram
description: Explain one system in its environment by showing its users, external systems, and the relationships that matter.
---

# System context diagram

## What it tells

This view answers “what is this system, who uses it, and what does it depend on?” It shows one named system as the focal boundary plus relevant people, organizations, external systems, and high-level relationships.

## Use and boundaries

Use it for onboarding, product scope, stakeholder alignment, risk review, and early architecture decisions. Keep the focal system as one box. Do not open it into containers or components, and do not turn external systems into infrastructure nodes. Add a system landscape first when the audience needs portfolio context.

## Method

Name the system by purpose, identify actors by role, and list external systems only when they exchange information or impose a meaningful constraint. Label every relationship with a concise verb and optionally direction, protocol, or data. Make system ownership and trust boundaries explicit when they affect the story. Prefer one context diagram per focal system and audience.

## Renderer routing

Preserve a requested renderer. Prefer `structurizr` when the context view belongs to a reusable C4 workspace model, `c4plantuml` for a focused C4 source, `plantuml` for an unconstrained architecture view, or `mermaid`, `d2`, and `graphviz` for lightweight sketches. Use `blockdiag` only for an informal block view; it will not encode C4 roles or semantics for you.

## Style and review

Use a strong visual treatment for the focal system, a consistent actor shape, and a neutral external-system shape. Keep the canvas sparse, route edges clearly, and include a legend for trust or relationship patterns. Ensure the focal boundary is unambiguous, all important actors/dependencies are named, arrows are readable in grayscale, and no internal implementation details slipped in.

## Prior art and limits

The C4 context diagram is a widely used framing convention and is deliberately notation-independent, not a formal interchange standard. ArchiMate and UML can provide formal viewpoints, but diagram.zip does not currently expose a dedicated ArchiMate source or a profile-enforced context renderer. That is an integration opportunity if formal semantics or model exchange becomes a requirement. See [C4 diagrams](https://c4model.com/diagrams), [C4 notation](https://c4model.com/diagrams/notation), [UML](https://www.omg.org/spec/UML/2.5.1/), and [ArchiMate overview](https://www.opengroup.org/archimate-forum/archimate-overview).
