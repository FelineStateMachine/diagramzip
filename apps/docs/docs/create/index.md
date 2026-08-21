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
7. Choose **Save as File** for a portable editable SVG, or **Publish** for a stable server alias.

## Open an existing diagram

You can reopen an editable SVG from a local file, including a file selected on
mobile, or by dragging it into the editor. You can also paste SVG text into the
open flow. The editor accepts an HTTP(S) or data URL when the response is an
SVG document.

An editable SVG remains a useful visible image. It also contains a versioned
Diagram.zip document in SVG metadata and `data-*` attributes. The document
restores the source, type, options, presentation, title, and description.

The editor validates the embedded document before creating a draft. Ordinary
SVG, ambiguous SVG, unsupported SVG, and lossy SVG are rejected instead of
being guessed or silently converted. Imported input is limited to 5 MiB.

## Choose a type

Use the filter on the [diagram type list](/) to search by name, format, or purpose. The list has one syntax page and one style page for every supported type.

When you choose a type in the editor, diagram.zip records it in the page URL as
`?type={type}`. Reloading or copying that working URL keeps the same active type.
Saved read and edit links remain alias-based and do not depend on this query.

## Source, Details, and preview

The left pane has **Source** and **Details** tabs. Source contains the selected diagram language. Details contains validated JSON for metadata and presentation.

Edit the title directly in the top bar for a faster naming workflow. The value stays synchronized with `title` in Details.

The diagnostics dock below the editors reports Details validation. Invalid Details JSON keeps the last valid preview and blocks actions that require valid state.

The preview updates as you edit. A source syntax error can stop rendering and appears in a short-lived toast at the lower right.

The preview toolbar controls zoom, fit, raw output, theme, and transparency. Appearance changes preserve the current zoom and pan position.

The preview theme affects only the output pane. The application continues to follow the browser or operating-system color preference.

Structured types, such as BPMN, Diagrams.net, Excalidraw, UMLet, Vega, and WaveDrom, use XML or JSON. Keep valid document structure when you edit these types.

Read [General presentation settings](/style/presentation/) for the Details document schema and appearance values.

## Local drafts

Open diagrams keep unsaved changes in local browser storage. An edited example shows a reset icon that restores its bundled source and details.

Anonymous drafts default to local work. **Save as File** downloads an editable
SVG without creating a server alias. The downloaded file can be reopened on
another device through the same import flow.

Published links use a separate device-only overlay for local changes. Read
[Working state and published state](/collaboration/working-and-saved-state/)
before restoring or copying that overlay.

## Save, publish, or share

Use **Publish** to create or update a server alias. Use **Encrypt & Publish**
when the server copy requires password protection. Both actions opt into server
persistence.

Use an edit link when people must save changes. The Share menu also provides
**Copy SVG URL** and **Copy as Markdown** for image embeds. Anonymous drafts use
a self-contained packed SVG URL; published diagrams use their stable alias
render. Read [Share a diagram](/collaboration/sharing/) before you send an edit
link.

The save dropdown selects **Publish**, **Encrypt & Publish**, or **Save as File**
as the main button action. Selecting an action does not run it. Copy actions in
the dropdown run immediately.
