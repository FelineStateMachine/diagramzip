---
name: concept-map
description: Use when the user needs to explain concepts and the labeled relationships between them, especially definitions, dependencies, evidence, or cross-domain connections.
---

# Concept map

## What / why

A concept map is a semantic network: concepts are nodes and labeled propositions connect them. It tells the story “how are these ideas related, and what kind of relationship is it?” Choose it over a mind map when cross-links and relationship meaning matter.

## How to model

- State the focus question before modeling.
- Use noun or noun-phrase concepts; connect them with explicit verbs or relation labels.
- Make each path read as a proposition: `concept — relation — concept`.
- Use hierarchy only for real general-to-specific relationships; allow cross-links.
- Distinguish evidence, examples, and claims from concepts themselves.

## Styling and customization

Use directional links, high-contrast labels, and enough space for relation text. Use color for concept categories, not relationship meaning alone. Add a legend for arrowheads, line styles, and confidence/status. For a dense map, provide a focused subgraph as well as the overview.

## Renderer choices

Preserve the user’s renderer choice. Mermaid, Graphviz, D2, PlantUML, and diagrams.net can represent labeled graphs; Graphviz is useful for automatic layout, while D2 or diagrams.net suit deliberate composition. No diagram.zip renderer enforces concept-map propositions or validates relationship labels; the skill supplies that semantic discipline.

## Review

Read every edge as a sentence. Check labels are specific, arrow direction is meaningful, cycles are intentional, and the focus question is answered. Remove unlabeled edges unless adjacency itself is the claim.

## Prior art and gaps

See [references/prior-art.md](references/prior-art.md). The [ISO 704 terminology principles](https://www.iso.org/standard/59176.html) are useful prior art for clear concepts and relations, but diagram.zip does not implement a terminology interchange format.
