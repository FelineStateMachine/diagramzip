---
id: working-and-saved-state
title: Working state and saved state
description: Understand editor drafts, saved revisions, and persistent diagram data.
sidebar_position: 3
---

# Working state and saved state

The editor has a working state and a saved state. They can be different until
you save.

## Working state

The working state is what you currently see and edit. It includes the diagram
source, type, renderer options, presentation settings, title, and description.

Source and Details use separate editor tabs. Details is a JSON document that
contains the title, description, and presentation settings.

Invalid Details JSON remains in the local draft. The editor keeps the last
valid preview and blocks save, share, privacy, and type changes until it is valid.

When you edit a saved diagram, the working state changes first. The saved
diagram does not change until you choose **Save**.

For an open diagram, diagram.zip stores the working state as a local browser
draft. This draft supports recovery on the same browser. It is not a saved
diagram and other people cannot read it.

An edited anonymous example shows a reset icon. Reset removes its local draft
and restores the bundled example after confirmation.

When a saved link opens with a different local draft, the editor marks that
draft as a device-only overlay. Choose **Restore saved** to discard the overlay
and return to the alias revision, or **Make a copy** to preserve it under a new
alias. Neither action silently changes the original share link.

For a locked diagram, the editor does not store the working state as plaintext
in browser storage. Save a locked diagram explicitly to persist it.

Zoom and pan are preview session state, not saved diagram state. Appearance
changes and Edit or Preview tab switches preserve the current view position.

## Saved state

The saved state is the last version that you saved successfully. It has an
alias, a revision, and a stable read link.

The Share dialog uses the saved state. If the working state has changes, the
dialog tells you to save before you share. This prevents you from sharing an
older version by mistake.

## Persistent data

After a successful save, diagram.zip persists the diagram content and its
metadata. It can also persist SVG and PNG renders for that saved revision.

Open content is stored as readable diagram data. Locked content and locked
renders are stored as encrypted data. See [Password encryption](/collaboration/encryption/)
for the locked diagram rules.

The persisted data belongs to the alias and its current revision. A local draft
does not replace the persisted data.

## Save flow

The normal flow is:

1. Edit the working state.
2. Choose **Save**.
3. diagram.zip stores a new revision.
4. The saved state becomes the working state.

Saving a new diagram creates an alias and an edit capability. Saving an open
diagram with an edit capability updates its alias. Saving a read-only diagram
creates a new alias instead.

## Conflicts

The editor saves against the revision that it last loaded. If that revision is
no longer current, another person saved the alias first.

The editor then offers **Reload saved** or **Save as new**. Reload replaces the
working state with the current saved state. Save as new preserves the working
state in a new alias. diagram.zip does not silently overwrite the other
person's saved version.
