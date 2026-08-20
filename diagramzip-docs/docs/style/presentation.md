---
id: presentation
title: General presentation settings
description: Set the canvas background, padding, and frame for a diagram.zip diagram.
sidebar_position: 1
---

# General presentation settings

These settings apply to every rendered diagram. Set them after you create valid source.

## Background

Set the canvas background to a color that supports your diagram. Use a light background for most documents. Check the contrast of labels and lines after you change it.

## Padding

Padding adds space around the rendered diagram. Use a small value for an inline image. Use a larger value when a frame or a presentation layout needs more space.

The supported range is **0 to 256 pixels**.

## Frame

Turn the frame on when the diagram needs a clear boundary. Turn it off when another page or card already provides the boundary.

## Type-specific styling

General presentation settings do not replace the style rules in the source language. Open the **Style** page for a type to learn its source controls.

For example, [Mermaid styling](/style/types/mermaid/) uses Mermaid configuration. [Graphviz styling](/style/types/graphviz/) uses DOT attributes.

## A safe order

1. Set the canvas background.
2. Set padding.
3. Choose the frame state.
4. Apply type-specific styles.
5. Check the preview at its target size.

A **Renderer options** section appears only when the renderer adds options for that type.
