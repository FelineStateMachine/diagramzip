---
id: presentation
title: General presentation settings
description: Choose a shared appearance or keep the renderer canvas, padding, and frame.
sidebar_position: 1
---

# General presentation settings

Open **Details**, then use **Appearance** to choose how diagram.zip presents the SVG.

## Appearance

**Renderer default** keeps the safe renderer output. It also enables the canvas, padding, and frame controls.

The shared appearances apply one Diagram.zip palette to supported renderer output:

- **Match device** includes light and dark palettes in one SVG. The SVG selects a palette with `prefers-color-scheme`.
- **Light** always uses the light palette.
- **Dark** always uses the dark palette.
- **Transparent** does not add an outer canvas.
- **Framed** adds a matching canvas, standard padding, and a border.

The editor disables appearances that the current renderer profile cannot support. Diagrams.net supports raw and framed appearances while its authored paint remains unchanged.

Excalidraw and TikZ support every appearance. Their neutral canvas, ink, and line paint adapt while authored non-neutral paint remains renderer-defined.

Read [SVG normalization and version contracts](/style/svg-normalization) for capability levels, renderer version selection, and artifact metadata.

## Background

Choose **Renderer default** before you set the background. Use a light background for most documents. Check the contrast of labels and lines after you change it.

## Padding

Padding adds space around the rendered diagram. Use a small value for an inline image. Use a larger value when a frame or a presentation layout needs more space.

The supported range is **0 to 256 pixels**.

## Frame

Turn the frame on when the diagram needs a clear boundary. Turn it off when another page or card already provides the boundary.

## Type-specific styling

General presentation settings do not replace the style rules in the source language. Open the **Style** page for a type to learn its source controls.

For example, [Mermaid styling](/style/types/mermaid/) uses Mermaid configuration. [Graphviz styling](/style/types/graphviz/) uses DOT attributes.

## A safe order

1. Choose a shared appearance when the renderer supports it.
2. Use **Renderer default** when you need custom canvas controls.
3. Apply type-specific styles.
4. Check the preview at its target size.

A **Renderer options** section appears only when the renderer adds options for that type.
