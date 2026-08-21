---
name: decision-tree
description: Use when the user needs to show a sequence of choices, branching rules, outcomes, or diagnostic paths.
---

# Decision tree

## What / why

A decision tree tells the story “which question or rule leads to which next branch and outcome?” It is for explicit branching logic, not a general process or arbitrary hierarchy.

## How to model

- Start with one entry condition and make each decision node a question or predicate.
- Label every outgoing edge with understandable, mutually exclusive conditions; include the default/else branch.
- Keep outcomes distinct from subsequent decisions and identify terminal nodes.
- State precedence, probability, owner, or evidence when decisions depend on them.
- If rules are complex, separate the readable tree from the authoritative decision table.

## Styling and customization

Use diamonds or clearly differentiated decision nodes, rounded/colored terminal outcomes, and directional flow. Keep branch labels near edges and avoid color-only meaning. Use line styles for confidence or exception paths only with a legend.

## Renderer choices

Preserve the user’s renderer. Mermaid flowcharts, Graphviz, D2, PlantUML activity diagrams, and diagrams.net can render decision trees. diagram.zip does not implement DMN decision requirements diagrams or FEEL evaluation; that is an unsupported integration opportunity. Use BPMN when the user needs formal process events/tasks, not merely branching.

## Review

Trace every path from entry to outcome. Check branch completeness, overlap, unreachable nodes, contradictory predicates, and whether visual order matches evaluation order. Call out any informal rule that needs DMN or a decision table.

## Prior art and gaps

See [references/prior-art.md](references/prior-art.md).
