---
name: diagram-workshop
description: Work with me to discover the right diagram question, audience, scope, and level of detail before making a diagram.
disable-model-invocation: true
---

# Diagram workshop

Use this skill when the user explicitly asks to workshop, explore, compare, or decide what diagram to make. It is intentionally user-invokable only: a router may recommend it, but must not invoke it without the user's direction.

## What to discover

Establish:

- who will read the diagram and what decision or explanation it must support;
- the subject, boundaries, time direction, and stable versus changing facts;
- whether the story is flow, interaction, state, structure, data, hierarchy, comparison, physical placement, or a formal process;
- the required fidelity, output format, renderer preference, and accessibility constraints.

## How to facilitate

Ask only the smallest set of questions that changes the diagram choice. Offer two or three candidate stories, state what each makes easy or hides, and recommend one. Sketch the entities and relationships in plain language before writing renderer syntax. Then hand off to the selected semantic skill and renderer while preserving the user's choices.

## Useful prompts

“What should a reader be able to decide after looking at this?” “Is order or structure more important?” “What is inside the boundary?” “Which facts must be exact?” “Who owns each step or component?” “Will this be read on a slide, in a document, or by assistive technology?”

## Guardrails

Do not manufacture missing facts. Mark assumptions and ask for confirmation when they affect meaning. A single diagram should not silently combine incompatible stories; propose separate views or a deliberate hybrid. If the requested formal notation is not available in diagram.zip, explain the gap and suggest the closest semantic view plus an integration opportunity.

## Prior art

Use the [C4 diagram question framing](https://c4model.com/diagrams), [OMG UML](https://www.omg.org/spec/UML), and [OMG BPMN](https://www.omg.org/spec/BPMN/2.0.2/) as appropriate. These references inform the conversation; they do not replace the selected skill's renderer support check.
