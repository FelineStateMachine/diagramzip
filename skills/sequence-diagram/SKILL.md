---
name: sequence-diagram
description: Choose a sequence diagram when the user needs to explain ordered messages, calls, responses, or time-dependent collaboration between participants.
---

# Sequence diagram

## What and why

A sequence diagram tells a time-ordered interaction story. It is strongest for an API request, authentication exchange, event flow, incident trace, or one scenario across services and people. It is not a deployment map, class structure, or a complete behavioral specification.

## Model it

1. Name the scenario and trigger, including success or failure scope.
2. Choose participants that send, receive, or transform a message; omit passive infrastructure.
3. Order messages top-to-bottom and label intent, not implementation trivia.
4. Use activation, return, loop, alternative, optional, and parallel fragments only when they clarify behavior.
5. Mark asynchronous messages, timeouts, retries, and external boundaries explicitly.

UML 2.5.1 defines interaction and combined-fragment semantics. See [UML interaction guidance](references/uml-interactions.md).

## Story and styling

Make the primary path easy to scan, then place alternatives in `alt`/`opt` regions. Use participant types consistently and distinguish synchronous calls from asynchronous signals. Keep lifelines aligned; use restrained color for external systems, errors, or trust boundaries. Never encode meaning by color alone.

## Renderer routing

Prefer `mermaid` for lightweight docs, `plantuml` for expressive UML fragments, `seqdiag` for compact message-focused diagrams, or `d2` when the sequence is part of a broader technical illustration. Preserve the user's renderer choice. `bpmn` is appropriate only when the requested story is a formal business process with BPMN events, tasks, and message flows.

## Review

- Is the scenario boundary and trigger explicit?
- Does vertical order represent time without implying false duration?
- Are request/response direction, async behavior, errors, and retries unambiguous?
- Are fragments labeled with meaningful guards?
- Is the diagram readable without relying on tiny labels or color alone?

## Limits and opportunities

diagram.zip renders sequence sources but does not execute a UML interaction validator or check trace completeness. A future integration could validate UML fragment nesting and provide conformance diagnostics.
