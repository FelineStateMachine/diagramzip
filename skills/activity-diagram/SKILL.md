---
name: activity-diagram
description: Choose an activity diagram when the user needs to explain workflow logic, parallel work, decisions, joins, and responsibility across actions.
---

# Activity diagram

## What and why

An activity diagram tells how work flows through actions and control nodes, including branching, merging, concurrency, and synchronization. Use it for algorithms, operational workflows, and cross-team procedures. Use BPMN when formal business-process events, messages, compensation, or executable process semantics matter.

## Model it

1. Define the activity boundary, initial condition, and completion criteria.
2. Name actions with concise verbs and separate control flow from data flow.
3. Use decision/merge and fork/join deliberately; a fork must have a meaningful synchronization story.
4. Add swimlanes only to answer ownership questions; keep lane count small.
5. Show exceptions, cancellation, and parallel completion rules when they affect the outcome.

UML 2.5.1 provides the activity, action, control-node, token-flow, and partition concepts. See [UML activities](references/uml-activities.md).

## Story and styling

Give the happy path a stable reading direction and make concurrency visually parallel. Label guards as business conditions, not code fragments. Use lanes as responsibility bands, and reserve color for ownership or exception emphasis with a textual legend.

## Renderer routing

Prefer `plantuml` for UML activity semantics, `mermaid` for accessible documentation flow, `actdiag` for simple lane-oriented activities, or `d2` for a customized technical workflow. Preserve the user's requested renderer. Use `bpmn` for formal process interchange rather than translating BPMN semantics into a generic activity chart.

## Review

- Are actions, decisions, merges, forks, and joins distinguishable?
- Does every parallel branch have a clear completion or cancellation rule?
- Are swimlanes meaningful and consistently assigned?
- Are data objects shown only when they clarify the workflow?
- Can a reader follow normal, exception, and concurrent paths?

## Limits and opportunities

diagram.zip does not validate UML token-flow semantics or guarantee that an activity is deadlock-free. A UML activity parser/linter and a first-class swimlane layout profile would be useful future integrations.
