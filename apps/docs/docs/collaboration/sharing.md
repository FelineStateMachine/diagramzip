---
id: sharing
title: Share a diagram
description: Share read-only or editable diagram.zip links.
sidebar_position: 1
---

# Share a diagram

Save a diagram before you share it. A saved diagram has a stable read link.

## Read links

A read link lets a person open the saved diagram. The link has this form:

```text
https://diagram.zip/d/{alias}
```

Anyone who has an open read link can view the diagram. Anyone who has an open
read link can also use the SVG or Markdown embed link.

A read link does not let a person save changes to the saved diagram.

For a locked diagram, the person must also enter the password. The password is
not part of the read link.

## Edit links

An edit link gives permission to save changes to the alias. It has this form:

```text
https://diagram.zip/d/{alias}#w={write-capability}
```

The edit capability is a bearer credential. Anyone who has the complete edit
link can update the diagram. Share it only with people who should have write
access.

The browser reads the capability from the URL fragment. The browser then saves
it for that alias and removes it from the address bar. A copied page URL is
therefore normally a read link. Copy the edit link from the Share dialog when
you need to share write access.

For a locked diagram, an edit link does not replace the password. The person
needs both the edit capability and the password.

There are no accounts or recovery controls. If you lose the edit capability,
you cannot update that alias from a new device. If you lose the password for a
locked diagram, you cannot decrypt it.

## Read-only edits and forks

You can edit a diagram after opening a read link. These edits stay local until
you save them.

If this browser already has unsaved changes for the link, a local-changes bar
offers **Restore saved** and **Make a copy**. Restore returns to the shared
revision. Make a copy forks the local state to a new alias, even when this
browser also holds write access to the original.

The Save button becomes **Save copy** because you do not have write access to
the original alias. Save the copy to create a new alias and a new edit link.
The original diagram does not change.

## Save conflicts

Each saved alias has a revision. The editor checks the revision when it saves.

If another person saved a newer revision first, diagram.zip reports a save
conflict. Choose one of these actions:

- **Reload saved** discards your local edits and opens the newer saved version.
- **Save as new** keeps your edits and creates a separate alias.

The editor does not overwrite a newer saved revision without your choice.

## Embeds

The Share dialog provides an SVG image link and a Markdown image link for an
open saved diagram. These links point to the saved render.

Locked diagrams cannot be embedded. An embed request cannot ask for a password,
so the server does not return encrypted diagram renders as public images.

Save the diagram again before you share if the Share dialog says that the links
show an older saved version.
