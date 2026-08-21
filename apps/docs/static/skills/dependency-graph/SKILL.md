---
name: dependency-graph
description: Show dependencies between packages, modules, services, artifacts, or concepts when the important story is coupling, direction, reachability, or change impact.
---

# Dependency graph

## Select this skill when

Use this skill when a reader needs to see “what depends on what,” identify coupling, trace impact, find cycles, or understand a dependency boundary. Nodes may be software packages, services, libraries, documents, datasets, or other artifacts, but declare the node type and edge meaning.

Avoid it for ordered interactions (use sequence-diagram), ownership hierarchies (use hierarchy-diagram), network reachability (use network-topology), or a business process. If edges mean several different things, split the views or use an explicit legend.

## Story and semantic model

Define the direction in a sentence, such as “A imports B” or “Service A calls Service B.” Name the evidence and time scope: declared dependencies, runtime calls, build dependencies, or inferred references. Keep the graph at one level of abstraction.

- Use directed edges by default and label exceptional edge kinds.
- Distinguish direct from transitive dependencies; do not draw transitive edges unless they are the story.
- Use clusters for ownership or package boundaries, not as a substitute for missing nodes.
- Mark external, optional, deprecated, generated, and cyclic dependencies explicitly.
- For impact analysis, identify the root artifact and highlight reachable downstream nodes without hiding the rest of the graph.

Large graphs should be filtered by boundary, depth, or centrality. A graph that contains every dependency is often a dataset, not a useful diagram.

## Layout and styling

Choose left-to-right for dependency flow and top-to-bottom for layered architecture. Use stable node IDs and short labels; put versions or details in a legend or annotation. Use color for status or ownership, and use line style, labels, or shape for edge semantics so the reading survives grayscale.

Prefer one strong emphasis (for example, a selected package and its callers). Avoid rainbow coloring by node. If the graph has cycles, make them visible and annotate whether the cycle is intentional.

## Renderer routing

Preserve an explicit renderer choice. Otherwise prefer:

- `graphviz` for larger directed/undirected graphs, clusters, rank direction, and automatic layout.
- `d2` for readable architecture/dependency graphs with containers and local styling.
- `mermaid` for compact Markdown documentation and moderate-size graphs.
- `plantuml` when dependency edges are part of a broader UML component or package view.
- `diagramsnet` when a small dependency map must remain manually editable.

Renderer layout is not graph analysis. diagram.zip does not infer dependencies, calculate reachability, detect cycles, or verify versions unless the input itself supplies those facts. Generate or validate the dependency data upstream, then use this skill to present it.

## Review checklist

Read the edge direction aloud and verify it is consistent. Check that every edge has a defined meaning, direct/transitive scope is clear, external boundaries are visible, and the selected graph is small enough to scan. Verify emphasized paths against source evidence. Remove duplicate nodes and edges, and explain cycles instead of routing them out of view.

## Standards and prior art

Graphviz DOT is the most portable source prior art for directed and undirected graph structure and attributes: <https://graphviz.org/documentation/>. The W3C Web of Things Architecture is useful prior art for describing software/system dependencies alongside boundaries and interactions: <https://www.w3.org/TR/wot-architecture/>.

There is no universal standard that makes a generic dependency graph semantically interchangeable across package managers and runtime systems. If the project needs dependency extraction, provenance, graph queries, or a machine-readable graph interchange profile, that requires integration beyond diagram.zip rendering.
