---
id: sharing
title: Share a diagram
description: Share read-only or editable diagram.zip links.
sidebar_position: 1
---

# Share a diagram

Publishing is optional. Anonymous drafts remain local until you choose
**Publish** or **Encrypt & Publish**. A published diagram has a stable alias.

The Share menu contains these actions:

- **Publish** creates or updates an open server alias.
- **Encrypt & Publish** creates or updates a password-protected server alias.
- **Save as File** downloads an editable enriched SVG without server persistence.
- **Copy SVG URL** copies the stable render URL for an open published alias. For
  an anonymous draft, it copies a self-contained URL with the editable SVG data
  packed into the URL itself.
- **Copy as Markdown** copies a Markdown image using the same stable or packed
  SVG URL.

Lock, password change, and password removal actions stay beside the content
they affect. Save as File is available for a local draft and does not require
an account or network persistence.

## Read links

A read link lets a person open the published diagram. The link has this form:

```text
https://diagram.zip/d/{alias}
```

Anyone who has an open read link can view the diagram. Anyone who has an open
read link can also use the SVG or Markdown embed link.

A read link does not let a person update the published diagram.

An editable SVG file is separate from a read link. It remains useful as an SVG
image, while its versioned Diagram.zip document supports a later import.

For a locked diagram, the person must also enter the password. The password is
not part of the read link.

## Edit links

An edit link gives permission to publish changes to the alias. It has this form:

```text
https://diagram.zip/d/{alias}#w={write-capability}
```

The edit capability is a bearer credential. Anyone who has the complete edit
link can update the diagram. Share it only with people who should have write
access.

The browser reads the capability from the URL fragment. The browser then stores
it for that alias and removes it from the address bar. A copied page URL is
therefore normally a read link. Copy the edit link from the Share dialog when
you need to share write access.

Copy actions report success or failure in a short-lived toast above the dialog
backdrop.

For a locked diagram, an edit link does not replace the password. The person
needs both the edit capability and the password.

There are no accounts or recovery controls. If you lose the edit capability,
you cannot update that alias from a new device. If you lose the password for a
locked diagram, you cannot decrypt it.

## Read-only edits and forks

You can edit a diagram after opening a read link. These edits stay local until
you publish them.

If this browser already has unsaved changes for the link, a local-changes bar
offers **Restore published** and **Make a copy**. Restore returns to the shared
revision. Make a copy forks the local state to a new alias, even when this
browser also holds write access to the original.

The Publish button becomes **Publish a Copy** because you do not have write
access to the original alias. Publish the copy to create a new alias and a new
edit link. The original diagram does not change.

## Publish conflicts

Each published alias has a revision. The editor checks the revision when it
publishes.

If another person published a newer revision first, diagram.zip reports a
publish conflict. Choose one of these actions:

- **Reload published** discards local edits and opens the newer published version.
- **Publish as new** keeps your edits and creates a separate alias.

The editor does not overwrite a newer published revision without your choice.

## Embeds

The Share dialog provides an SVG image link and a Markdown image link without
requiring publication. An open published alias uses its stable server render.
An anonymous draft uses a compressed, self-contained editable SVG URL and does
not create server state.

Before packing an anonymous URL, the editor prepares the selected transparent
or framed geometry and embeds self-contained palette CSS. The root
`data-dz-appearance` value selects raw, light, dark, or automatic palette rules.
The `/svg/{packed}` route validates the SVG and synchronizes that one value from
the embedded `diagram.presentation.appearance`. Consumers do not need to
simulate the palette or patch SVG paint client-side. Frame padding and the outer
`viewBox` are prepared before packing because CSS cannot change SVG bounds.

Packed URLs contain the rendered SVG, diagram source, options, metadata, and
presentation settings. Anyone with the URL can inspect that content and reopen
it as an editable SVG. Do not use a packed URL for secrets. Diagram.zip rejects
a copy when the complete URL would exceed the safe request limit. Save the
editable SVG as a file or publish it instead.

Locked diagrams cannot be embedded. An embed request cannot ask for a password,
so the server does not return encrypted diagram renders as public images.

Publish the diagram again before you share if the Share dialog says that an
alias link shows an older published version.

## Importing an editable SVG

Open an editable SVG from a file picker, drag and drop it, paste SVG text, or
provide an HTTP(S) or data URL. This flow creates a local draft first. It does
not publish the draft automatically.

The importer accepts only a valid, versioned Diagram.zip document. It rejects
ordinary SVG, ambiguous metadata, unsupported schema versions, and inputs that
would lose source or presentation information. Input is limited to 5 MiB.
