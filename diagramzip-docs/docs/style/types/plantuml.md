---
id: style-plantuml
slug: /style/types/plantuml
title: PlantUML
description: Style a PlantUML diagram in diagram.zip.
sidebar_label: PlantUML
---

# Style PlantUML

PlantUML supports themes, skin parameters, colors, sprites, and element-specific style rules.

Start with the [general presentation settings](/style/presentation). They control the canvas background, padding, and frame for every diagram.

## Source controls

- Use `!theme` to apply a bundled theme.
- Use `skinparam` for global or diagram-specific values.
- Add color values to elements when you need a local override.

## Renderer options

| Option | Values | Purpose |
| --- | --- | --- |
| `theme` | A supported PlantUML theme name | Apply the theme before diagram.zip renders the source. |
| `no-metadata` | Flag | Remove the source metadata from the rendered image. |

## Related pages

- [Create a PlantUML diagram](/create/types/plantuml)
- [General presentation settings](/style/presentation)
- [Open PlantUML in the editor](https://diagram.zip/?type=plantuml)
