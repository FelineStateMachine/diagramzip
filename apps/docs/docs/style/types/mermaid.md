---
id: style-mermaid
slug: /style/types/mermaid
title: Mermaid
description: Style a Mermaid diagram in diagram.zip.
sidebar_label: Mermaid
---

# Style Mermaid

Mermaid supports themes, frontmatter configuration, class definitions, and diagram-specific configuration.

Start with the [general presentation settings](/style/presentation). Edit shared or raw presentation in Details, and keep renderer-specific styling in Source.

## Source controls

- Use `classDef` and `class` in flowcharts.
- Use frontmatter for supported theme and layout values.
- Use Mermaid theme variables for controlled color changes.

## Renderer options

| Option | Values | Purpose |
| --- | --- | --- |
| `layout` | `dagre` or `elk`; mind maps can also use `tidy-tree` | Select a layout engine. |
| `Mermaid configuration` | Primitive values | Use kebab-case. Replace a configuration dot with an underscore. |

## Limitations

- diagram.zip removes active content and unsafe external resources from the SVG.
- Security configuration values cannot reduce the renderer security level.

## Related pages

- [Create a Mermaid diagram](/create/types/mermaid)
- [General presentation settings](/style/presentation)
- [SVG normalization and version contracts](/style/svg-normalization)
- [Open Mermaid in the editor](https://diagram.zip/?type=mermaid)
