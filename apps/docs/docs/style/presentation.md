---
id: presentation
title: General presentation settings
description: Edit diagram metadata and choose a shared or renderer-defined presentation.
sidebar_position: 1
---

# General presentation settings

Open the **Details** tab in the left pane. It contains a validated JSON document for metadata, renderer options, and presentation.

```json
{
  "title": "Service flow",
  "description": "A request moving through the public API.",
  "options": {},
  "presentation": {
    "appearance": "auto-transparent",
    "background": "",
    "padding": 0,
    "frame": false
  }
}
```

`title` accepts at most 200 characters. `description` accepts at most 2,000 characters. Unknown properties are rejected.

The diagnostics dock reports invalid JSON or schema values. Diagram.zip keeps the last valid preview until the document becomes valid again.

## Renderer options

Put renderer-specific settings in the top-level `options` object. Option values may be strings, numbers, or booleans. The Style page for each diagram type lists its supported keys.

## Appearance

Appearance is presentation only. It does not change source geometry, notation layout, orientation, wrapping, or packing.

For TRN, use the `.layout` directive in Source. Generated SVG classes and data attributes are output metadata, not an authoring API.

`raw` keeps the safe renderer output. It enables the custom background, padding, and frame values in the presentation document.

The shared appearances apply one Diagram.zip palette to supported renderer output:

- `auto-transparent` and `auto-framed` include both palettes. The SVG selects one with `prefers-color-scheme`.
- `light-transparent` and `light-framed` always use the light palette.
- `dark-transparent` and `dark-framed` always use the dark palette.
- Transparent appearances omit the outer canvas.
- Framed appearances add a matching canvas, standard padding, and a border.

When the editor creates an anonymous packed SVG URL, it embeds self-contained
palette rules selected by the root `data-dz-appearance`. The `/svg/{packed}`
route synchronizes that single value from the embedded
`diagram.presentation.appearance`. Changing the data value selects raw, light,
dark, or automatic palette CSS without rewriting SVG paint. Transparent or
framed bounds are prepared before packing because CSS cannot change the outer
`viewBox`.

The editor disables appearances that the current renderer profile cannot support. Diagrams.net supports raw and framed appearances while its authored paint remains unchanged.

Excalidraw and TikZ support every appearance. Their neutral canvas, ink, and line paint adapt while authored non-neutral paint remains renderer-defined.

Read [SVG normalization and version contracts](/style/svg-normalization) for capability levels, renderer version selection, and artifact metadata.

## Preview controls

The preview toolbar offers **Raw**, a theme icon, and a transparency icon. These controls rewrite the appearance value in Details.

The theme icon switches only the preview between explicit light and dark output. It does not change the application or system preference.

The transparency icon switches between transparent and framed output. Raw, theme, and transparency changes preserve the current preview zoom and pan position.

## Background

Set `appearance` to `raw` before you set `background`. Use an empty string for the renderer default or a six-digit hexadecimal color.

Check label and line contrast after changing the background.

## Padding

Padding adds space around the rendered diagram. Use a small value for an inline image. Use a larger value when a frame or a presentation layout needs more space.

`padding` must be an integer from **0 to 256 pixels**.

## Frame

Set `frame` to `true` when raw output needs a clear boundary. Set it to `false` when another surface provides the boundary.

## Type-specific styling

General presentation settings do not replace the style rules in the source language. Open the **Style** page for a type to learn its source controls.

For example, [Mermaid styling](/style/types/mermaid/) uses Mermaid configuration. [Graphviz styling](/style/types/graphviz/) uses DOT attributes.

## A safe order

1. Choose a shared appearance when the renderer supports it.
2. Use `raw` when you need custom canvas values.
3. Apply type-specific styles.
4. Check light, dark, and transparent output at the target size.

A **Renderer options** section appears only when the renderer adds options for that type.
