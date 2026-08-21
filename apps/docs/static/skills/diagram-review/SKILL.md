---
name: diagram-review
description: Review a proposed diagram for semantic fit, evidence, readability, accessibility, and renderer or standards limitations; recommend precise revisions.
---

# Diagram review

## What this is

Use this model-invokable skill after a diagram is drafted, when a user asks whether it is correct, or when requirements are ambiguous enough that errors would be costly. Review the semantic story separately from the renderer syntax.

## Review sequence

1. State the diagram's apparent question, audience, scope, and main claim.
2. Check that the selected diagram family makes that claim easy to read. Identify category errors, overloaded symbols, missing actors, hidden assumptions, and relationships that lack direction or labels.
3. Check evidence: distinguish facts, inferred relationships, proposed architecture, and illustrative examples. Flag claims that need a source or domain-owner confirmation.
4. Check layout: reading direction, grouping, crossings, hierarchy, density, legend, labels, and print or small-screen behavior.
5. Check accessibility: meaningful text alternatives, document language and title/description where supported, contrast, non-color encoding, text size, and a linear reading explanation. Use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [SVG accessibility guidance](https://www.w3.org/TR/SVG-access/) for delivery decisions.
6. Check renderer fidelity and export. Name unsupported standard constructs, layout controls, or interchange data rather than silently approximating them.
7. Return prioritized fixes: blocking semantic errors, reader-confusing issues, then polish. Include a concise corrected story or source fragment when useful.

For an enriched SVG, also check source provenance, metadata schema, and
deterministic round-trip behavior. Confirm that the visible SVG remains useful
as an image and that the embedded document restores the same type, source,
options, presentation, title, and description. Reject ordinary, ambiguous,
unsupported, or lossy SVG instead of treating its shapes as authoritative
source. Check the 5 MiB import limit and warn that file exports are plaintext.

## Styling and customization

Prefer styles that reinforce meaning: consistent shape roles, restrained color, explicit boundaries, and labels that survive grayscale or color-vision differences. Keep bespoke styling local and documented. Do not let a theme override a formal symbol's meaning or make decorative elements look like data.

Inspect shared appearances in light and dark output. Test transparent output against light and dark host surfaces.

## Prior art

For formal diagrams, compare against the relevant [OMG UML](https://www.omg.org/spec/UML), [OMG BPMN](https://www.omg.org/spec/BPMN/2.0.2/), or [C4 notation](https://c4model.com/diagrams/notation) guidance. For flowcharts, consult [ISO 5807](https://www.iso.org/standard/11955.html) where exact symbol conventions matter. Standards are review references; the local renderer catalog determines what diagram.zip can execute.
