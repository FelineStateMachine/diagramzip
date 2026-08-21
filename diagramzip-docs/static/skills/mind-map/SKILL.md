---
name: mind-map
description: Use when the user needs to explore one central topic through associative branches, capture brainstorming, or organize an unconstrained idea space before choosing a structure.
---

# Mind map

## What / why

A mind map radiates from one central subject. It tells the story “what belongs around this idea?” rather than “what causes what?” Use it to externalize a messy topic, reveal themes, and identify next questions. Choose another skill when relationships need to be typed, ordered, causal, or exhaustive.

## How to model

- Put one unambiguous topic at the center; make branch labels nouns or short prompts.
- Keep one concept per node and use a stable depth (topic → theme → detail).
- Prefer parent-child containment. Do not imply sequence, ownership, or causality with an ordinary branch.
- Mark questions, examples, decisions, and unknowns distinctly; do not bury caveats in prose.

## Styling and customization

Use radial or left-to-right layout, short labels, whitespace, and restrained color. Reserve color for branch families or status, and use line weight sparingly. A bespoke style may use icons, but every visual distinction needs a legend or clear label.

## Renderer choices

Ask for the user’s renderer preference first. Mermaid supports mind maps and configurable themes/layouts; D2, Graphviz, PlantUML, and diagrams.net can express tree-like maps but do not guarantee a mind-map grammar. Use native layout where possible; do not force a flowchart and call it a mind map. diagram.zip has no dedicated semantic mind-map validator, so validate hierarchy and labels in the source.

## Review

Check exactly one center, readable branches without color, comparable sibling levels, and no connector implying an unsupported relationship. Confirm whether the map is exploratory or a final taxonomy.

## Prior art

See [references/prior-art.md](references/prior-art.md).
