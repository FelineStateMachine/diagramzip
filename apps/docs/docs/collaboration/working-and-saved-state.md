---
id: working-and-saved-state
title: Working state and published state
description: Understand editor drafts, published revisions, and persistent diagram data.
sidebar_position: 3
---

# Working state and published state

The editor has a working state and a published state. They can be different
until you publish.

## Working state

The working state is what you currently see and edit. It includes the diagram
source, type, renderer options, presentation settings, title, and description.

Source and Details use separate editor tabs. Details is a JSON document that
contains the title, description, renderer options, and presentation settings.

Invalid Details JSON remains in the local draft. The editor keeps the last
valid preview and blocks file export, publishing, sharing, privacy, and type
changes until it is valid.

When you edit a published diagram, the working state changes first. The
published diagram does not change until you choose **Publish**.

For an open diagram, diagram.zip stores the working state as a local browser
draft. This draft supports recovery on the same browser. It is not a published
diagram and other people cannot read it.

The launcher stores a small metadata-only recent index. Local document source,
Details text, file-save state, and parked per-format drafts live in separate
device-only bodies. Published aliases have no body in the recent index and are
refetched when opened.

Anonymous drafts default to local work. **Save as File** exports the working
state as an editable enriched SVG. The file remains useful as a visible SVG
image and contains a versioned Diagram.zip document for later import.

Importing an editable SVG creates a local draft. The input can come from a
file, drag and drop, pasted SVG text, or an HTTP(S) or data URL. The importer
rejects ordinary, ambiguous, unsupported, or lossy SVG instead of guessing.
Imported input has a 5 MiB limit.

The launcher can reopen and duplicate local documents. Removing a local-only
document requires confirmation because it cannot be recovered from a server.

When a published link opens with a different local draft, the editor marks
that draft as a device-only overlay. Choose **Restore published** to discard
the overlay and return to the alias revision, or **Make a copy** to preserve it
under a new alias. Neither action silently changes the original share link.

For a locked diagram, the editor does not store the working state as plaintext
in browser storage. Publish a locked diagram explicitly to persist it.

Zoom and pan are preview session state, not published diagram state. Appearance
changes and Edit or Preview tab switches preserve the current view position.

## Published state

The published state is the last version that you published successfully. It
has an alias, a revision, and a stable read link.

The Share dialog uses the published state. If the working state has changes,
the dialog tells you to publish before you share. This prevents you from
sharing an older version by mistake.

## Persistent data

After a successful Publish or Encrypt & Publish, diagram.zip persists the
diagram content and its metadata. It can also persist SVG and PNG renders for
that published revision.

Open content is stored as readable diagram data. Locked content and locked
renders are stored as encrypted data. See [Password encryption](/collaboration/encryption/)
for the locked diagram rules.

The persisted data belongs to the alias and its current revision. A local draft
does not replace the persisted data.

## Publish flow

The normal flow is:

1. Edit the working state.
2. Choose **Publish** or **Encrypt & Publish**.
3. diagram.zip stores a new revision.
4. The published state becomes the working state.

Publishing a new diagram creates an alias and an edit capability. Publishing
an open diagram with an edit capability updates its alias. Publishing a
read-only diagram creates a new alias instead.

## Conflicts

The editor publishes against the revision that it last loaded. If that revision
is no longer current, another person published the alias first.

The editor then offers **Reload published** or **Publish as new**. Reload
replaces the working state with the current published state. Publish as new
preserves the working state in a new alias. diagram.zip does not silently
overwrite the other person's published version.
