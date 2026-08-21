---
name: architecture-dynamic-diagram
description: Explain an architecture scenario over time by showing participating components, messages, and state changes for one concrete use case.
---

# Architecture dynamic diagram

## What and why

Use this skill to tell the story of one runtime scenario: who participates, what crosses boundaries, and where decisions, retries, or asynchronous work occur. It complements a static architecture view; it should not become a generic system map.

## Select or avoid

Select it for request lifecycles, event propagation, failure paths, migrations, and performance-sensitive interactions. Avoid it for an inventory of components, infrastructure placement, or a business process with formal events and gateways. If exact temporal order is the point, choose a sequence diagram; if spatial topology is the point, choose deployment or system landscape.

## Modeling method

1. State the scenario, trigger, success condition, and scope.
2. Choose participants at one architecture level and order them by responsibility or boundary.
3. Show the happy path first, then annotate only consequential alternatives, retries, timeouts, and failures.
4. Distinguish synchronous calls, asynchronous messages, callbacks, and durable events.
5. Label messages with intent and contract, not implementation trivia. Mark assumptions and omitted internals.

## Styling and customization

Use a clear time direction, visually separate trust or ownership boundaries, and keep alternate paths close to the message that branches. Use line styles consistently for sync/async and a single accent for failure or retry. Add duration or correlation IDs only when they answer the user’s question. Preserve a user-selected renderer; otherwise prefer `structurizr` when the scenario uses an existing C4 workspace, `c4plantuml` for a focused C4 dynamic view, `plantuml` or `mermaid` for sequence-like scenarios, and `d2` for annotated flows.

## Review checklist

- Is this one scenario rather than an architecture inventory?
- Is ordering unambiguous, including asynchronous behavior?
- Are retries, timeouts, failure ownership, and idempotency visible where relevant?
- Are boundaries and participant abstraction levels consistent?
- Does the diagram state what it intentionally omits?

## Standards and prior art

Use [C4 dynamic diagrams](https://c4model.com/diagrams/dynamic) for scenario-focused architecture narration and [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/) for sequence/message semantics. diagram.zip can render PlantUML, C4 PlantUML, Mermaid, D2, Graphviz, and SeqDiag, but does not validate a formal UML interaction model or guarantee execution traces. Formal architecture-model interchange and analysis are integration opportunities.
