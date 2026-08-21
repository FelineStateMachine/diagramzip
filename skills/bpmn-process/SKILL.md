---
name: bpmn-process
description: Choose BPMN when the user needs a formal business-process model with events, tasks, gateways, pools, lanes, and message or sequence flows.
---

# BPMN process

## What and why

BPMN is a business-process notation and metamodel, not merely a flowchart style. Use it for cross-organization processes, orchestration, choreography, exception events, compensation, and process-engine interchange. Use a generic flowchart or activity diagram for an informal procedure without BPMN semantics.

## Model it

1. Define participants and process boundaries; use pools and lanes for responsibility.
2. Start with start/end events and the business outcome.
3. Choose tasks by business meaning, then add gateways only for real control decisions.
4. Use sequence flow inside a process and message flow between participants; never conflate them.
5. Model timer, error, escalation, compensation, subprocess, and data semantics only when they affect execution or understanding.

BPMN 2.0.2 is standardized by OMG and ISO 19510. See [BPMN references](references/bpmn-standard.md).

## Story and styling

Make participant boundaries and the normal process path obvious. Use event markers and gateway labels consistently. Keep diagram interchange positions stable when XML is exchanged, and use restrained colors for roles or exceptions. Explain any vendor-specific extensions in a legend or note.

## Renderer routing

Use `bpmn` when BPMN 2.0 XML and formal interchange are required. Use `plantuml` or `mermaid` only for an intentionally BPMN-like explanatory sketch, and state that it is not BPMN interchange. `graphviz` or `d2` can show a business process but cannot preserve BPMN semantics. Preserve an explicitly requested renderer.

## Review

- Are pools, lanes, sequence flows, and message flows used for their intended meanings?
- Is each gateway type justified by the process behavior?
- Are event triggers and exception paths explicit?
- Are start/end events and subprocess boundaries coherent?
- Does the XML include stable IDs and diagram interchange where exchange requires it?

## Limits and integration opportunities

diagram.zip supports BPMN rendering, but it does not promise full BPMN conformance validation, execution semantics, vendor-extension compatibility, or process-model analysis. A BPMN 2.0.2 validator, lint ruleset, and round-trip interchange tests would be valuable integrations.
