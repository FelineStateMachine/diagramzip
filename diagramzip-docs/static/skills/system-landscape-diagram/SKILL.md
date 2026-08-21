---
name: system-landscape-diagram
description: Show the systems and people across an organization or domain, emphasizing ownership and meaningful dependencies.
---

# System landscape diagram

## What it tells

A landscape is the broadest software architecture view: which systems, people, teams, or domains exist and how they relate. It tells an audience where a system sits in a wider estate, not how its internals work.

## Use and boundaries

Use it for portfolio orientation, modernization planning, ownership conversations, integration discovery, and explaining a system's neighbors. Choose one organizational or domain scope and state it in the title. Avoid showing classes, containers, deployment hosts, or detailed request sequences; those belong in narrower companion views.

## Method

Start with the audience's question and inventory only systems relevant to it. Group by business domain, ownership, or environment—not arbitrary spatial decoration. Give each node a stable name and concise purpose. Draw only relationships that support a decision, label them with a verb, and distinguish dependency from data movement or responsibility. Mark uncertainty rather than inventing an integration.

## Renderer routing

Honor the user's source choice. For a C4-style landscape, use `structurizr` when the landscape belongs to a reusable workspace model or `c4plantuml` for a focused source file. Use `plantuml` for a custom UML-like view, or `mermaid`, `d2`, and `graphviz` for compact relationship maps. `blockdiag` can express simple blocks but does not supply C4 semantics. Check the selected renderer's supported syntax in diagram.zip docs before writing source.

## Style and review

Use one shape family for systems and another for people or organizations. Cluster sparingly, keep edge crossings low, and provide a legend for colors, line types, ownership, and trust boundaries. Prefer labels and patterns over color-only coding. Review for accidental detail, duplicate nodes, unlabeled arrows, missing external actors, and a scope that is too broad to read.

## Prior art and limits

This follows the C4 landscape/context framing, which is notation-independent; it is not a formal ArchiMate exchange model. ArchiMate viewpoints could add standardized enterprise-architecture semantics, but diagram.zip has no dedicated ArchiMate renderer/skill yet. Consider integration if conformance or model interchange is required. See [C4 diagrams](https://c4model.com/diagrams), [C4 notation](https://c4model.com/diagrams/notation), and [ArchiMate overview](https://www.opengroup.org/archimate-forum/archimate-overview).
