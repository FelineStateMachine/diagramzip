---
id: style-graphviz
slug: /style/types/graphviz
title: Graphviz
description: Style a Graphviz diagram in diagram.zip.
sidebar_label: Graphviz
---

# Style Graphviz

DOT supports graph, node, and edge attributes.

Start with the [general presentation settings](/style/presentation). They control the canvas background, padding, and frame for every diagram.

## Source controls

- Set graph defaults with a `graph` attribute statement.
- Set node defaults with a `node` attribute statement.
- Set edge defaults with an `edge` attribute statement.
- Add an attribute list to override one element.

## Renderer options

| Option | Values | Purpose |
| --- | --- | --- |
| `layout` | `dot`, `neato`, `fdp`, `sfdp`, `twopi`, or `circo` | Select the layout program. |
| `graph-attribute-{name}` | A DOT graph attribute value | Set one graph attribute. |
| `node-attribute-{name}` | A DOT node attribute value | Set one default node attribute. |
| `edge-attribute-{name}` | A DOT edge attribute value | Set one default edge attribute. |
| `scale` | Number; default is `72.0` | Set the input scale for position data. |

## Related pages

- [Create a Graphviz diagram](/create/types/graphviz)
- [General presentation settings](/style/presentation)
- [Open Graphviz in the editor](https://diagram.zip/?type=graphviz)
