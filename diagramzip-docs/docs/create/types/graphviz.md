---
id: create-graphviz
slug: /create/types/graphviz
title: Graphviz
description: Create a Graphviz diagram in diagram.zip.
sidebar_label: Graphviz
---

import DiagramExample from '@site/src/components/DiagramExample';

# Graphviz

Graphviz creates directed and undirected graphs from the DOT language.

## Use this type

Use Graphviz when graph structure and automatic layout are more important than manual placement.

## Source format

The source format is **DOT text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use `digraph` for directed edges.
- Use `graph` for undirected edges.
- Use `->` for a directed edge.
- Use `--` for an undirected edge.
- Put attributes in square brackets.

### Example

```text
digraph delivery {
  rankdir=LR
  idea -> agent -> diagram
}
```

<DiagramExample engine="graphviz" label="Graphviz" sourceUrl="/examples/graphviz.json" />

## Related pages

- [Style Graphviz](/style/types/graphviz)
- [General presentation settings](/style/presentation)
- [Open Graphviz in the editor](https://diagram.zip/?type=graphviz)

## Upstream reference

[Graphviz documentation](https://graphviz.org/documentation/)
