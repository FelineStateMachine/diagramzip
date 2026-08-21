---
name: state-machine-diagram
description: Choose a state-machine diagram when an entity's permitted states, event-triggered transitions, guards, and entry or exit behavior are the central story.
---

# State-machine diagram

## What and why

A state-machine diagram explains how one subject changes state in response to events. Use it for lifecycle rules, protocol sessions, order status, device modes, and resilient services. Do not use it when the main question is work order between participants; choose a sequence or activity diagram instead.

## Model it

1. Name the subject and define its initial and terminal conditions.
2. List stable, externally meaningful states rather than every implementation flag.
3. Label transitions `event [guard] / effect` where useful.
4. Add entry, exit, and do behavior only when it changes the reader's interpretation.
5. Use composite or concurrent states for genuine hierarchy or orthogonal behavior; avoid decorative nesting.

UML 2.5.1 is the prior art for state machines, pseudostates, guards, and regions. See [UML state-machine guidance](references/uml-state-machines.md).

## Story and styling

Make states the visual anchors and transitions the explanation. Use a consistent arrow direction, explicit self-loops, and a legend for event/guard/effect syntax. Style terminal, error, and externally controlled states distinctly, with labels and shapes supporting any color choice.

## Renderer routing

Prefer `mermaid` for compact state diagrams, `plantuml` for UML-rich state machines, `graphviz` for explicit graph layout, or `d2` for annotated technical state views. Preserve a requested renderer. Avoid `c4plantuml`, because C4 is for software architecture structure, not lifecycle behavior.

## Review

- Is there exactly one subject or a clearly defined composite boundary?
- Are initial, terminal, error, and unreachable states considered?
- Does every transition have a meaningful trigger and destination?
- Are guards mutually understandable and effects separated from events?
- Are concurrency, hierarchy, and history semantics necessary and explained?

## Limits and opportunities

diagram.zip can render state-machine source but does not model-check reachability, determinism, deadlocks, or event completeness. A state-machine lint/verification integration would add material value for protocol and safety-critical use cases.
