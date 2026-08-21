---
name: flowchart
description: Choose a flowchart when the user needs a readable decision or process path with a clear start, sequence, branch, merge, or end.
---

# Flowchart

## What and why

A flowchart is a control-flow story: work moves from an entry point through actions and decisions to one or more outcomes. Choose it for procedures, troubleshooting, algorithms, approvals, and “what happens next?” explanations. It is not a good fit for rich business semantics, timed interactions between participants, or a large dependency network.

## Model it

1. State the scope and one reader question in the title.
2. Identify start/end outcomes before filling in steps.
3. Use verb-first action labels and phrase decisions as questions with labeled exits.
4. Make the normal path visually dominant; keep exception paths explicit.
5. Merge paths when they become equivalent, and avoid crossing connectors.

Use conventional symbols where the audience expects them: process, decision, terminator, input/output, and connector. ISO 5807 remains the relevant flowchart reference; use its notation when interchange or formal review matters. See [flowchart conventions](references/flowchart-conventions.md).

## Story and styling

The useful story is “how a case gets from here to there.” Keep one direction, consistent spacing, and short labels. Reserve color for semantic emphasis such as risk, exception, or ownership; provide shape or text cues too. Put explanatory detail in notes or adjacent prose rather than turning every node into a paragraph.

## Renderer routing

Prefer `mermaid` for quick Markdown-friendly flowcharts, `graphviz` when automatic graph layout matters, `plantuml` for a source-controlled formal diagram, or `d2` for a polished architecture/process sketch. `blockdiag` is suitable for simple block-oriented paths. Preserve an explicitly requested renderer and adapt the model to its syntax.

## Review

- Is there one clearly stated scope and outcome question?
- Can every decision exit be followed and understood?
- Are loops, retries, and failure outcomes visible?
- Does the layout have a reading direction and minimal line crossings?
- Are symbols, labels, contrast, and text alternatives usable in the target output?

## Limits and opportunities

The renderers above do not provide a guaranteed ISO 5807 interchange validator. If strict symbol conformance or machine validation becomes a product requirement, add a flowchart semantic linter or an ISO-profile integration.
