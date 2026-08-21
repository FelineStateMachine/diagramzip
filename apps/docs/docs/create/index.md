---
title: Create a diagram
description: Choose a diagram type and create a diagram in diagram.zip.
sidebar_position: 1
---

# Create a diagram

Start with a diagram type. Each type page shows the source format, a small example, and the syntax that you need first.

## A simple workflow

1. Choose a type from the [diagram type list](/).
2. Open its **Syntax** page.
3. Copy the example into the **Source** tab.
4. Replace the example labels and connections.
5. Edit metadata or presentation in the **Details** tab when needed.
6. Check the preview.
7. Save the diagram when you want a stable link.

## Choose a type

Use the filter on the [diagram type list](/) to search by name, format, or purpose. The list has one syntax page and one style page for every supported type.

When you choose a type in the editor, diagram.zip records it in the page URL as
`?type={type}`. Reloading or copying that working URL keeps the same active type.
Saved read and edit links remain alias-based and do not depend on this query.

## Source, Details, and preview

The left pane has **Source** and **Details** tabs. Source contains the selected diagram language. Details contains validated JSON for metadata and presentation.

The diagnostics dock below the editors reports Details validation. Invalid Details JSON keeps the last valid preview and blocks actions that require valid state.

The preview updates as you edit. A source syntax error can stop rendering and appears in a short-lived toast at the lower right.

The preview toolbar controls zoom, fit, raw output, theme, and transparency. Appearance changes preserve the current zoom and pan position.

The preview theme affects only the output pane. The application continues to follow the browser or operating-system color preference.

Structured types, such as BPMN, Diagrams.net, Excalidraw, UMLet, Vega, and WaveDrom, use XML or JSON. Keep valid document structure when you edit these types.

Read [General presentation settings](/style/presentation/) for the Details document schema and appearance values.

## Local drafts

Open diagrams keep unsaved changes in local browser storage. An edited example shows a reset icon that restores its bundled source and details.

Saved links use a separate device-only overlay for local changes. Read [Working state and saved state](/collaboration/working-and-saved-state/) before restoring or copying that overlay.

## Save or share

Use **Save** to create a saved revision. Use a read link when people only need to view the diagram.

Use an edit link when people must save changes. Read [Share a diagram](/collaboration/sharing/) before you send an edit link.
