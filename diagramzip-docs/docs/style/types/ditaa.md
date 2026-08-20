---
id: style-ditaa
slug: /style/types/ditaa
title: Ditaa
description: Style a Ditaa diagram in diagram.zip.
sidebar_label: Ditaa
---

# Style Ditaa

Ditaa supports shape tags, color tags, dashed lines, and renderer options.

Start with the [general presentation settings](/style/presentation). They control the canvas background, padding, and frame for every diagram.

## Source controls

- Add a six-character color tag such as `{cBLU}` inside a shape.
- Use shape tags such as `{d}` for a document.
- Use the Ditaa line characters to control corners and connectors.

## Renderer options

| Option | Values | Purpose |
| --- | --- | --- |
| `no-antialias` | Flag | Turn off anti-aliasing. |
| `no-separation` | Flag | Do not separate common shape edges. |
| `round-corners` | Flag | Use round corners. |
| `scale` | Number; default is `1.0` | Scale the diagram. |
| `no-shadows` | Flag | Turn off shadows. |
| `tabs` | Number | Set the tab width. |
| `background` | Six hexadecimal digits, for example `FFFFFF` | Set the image background. |
| `transparent` | Flag | Use a transparent background. |

## Related pages

- [Create a Ditaa diagram](/create/types/ditaa)
- [General presentation settings](/style/presentation)
- [Open Ditaa in the editor](https://diagram.zip/?type=ditaa)
