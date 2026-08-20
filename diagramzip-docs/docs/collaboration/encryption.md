---
id: encryption
title: Password encryption
description: Understand password protection for diagram.zip diagrams.
sidebar_position: 2
---

# Password encryption

Use a password when a diagram must not be readable by people who only have its
read link.

## What is encrypted

When you lock a diagram, the browser encrypts these items before it sends them
to diagram.zip:

- diagram source;
- diagram type and renderer options;
- presentation settings;
- title and description;
- saved SVG and PNG renders.

The browser decrypts the diagram after you enter the password. The renderer
can receive the source while it creates a preview. Persistent storage receives
encrypted data for a locked diagram.

## What the password does

The browser creates a private encryption key for the diagram. The password
protects that key. The browser uses a new random value for each encrypted item.

The password and the unwrapped encryption key stay in the browser. diagram.zip
does not receive either value.

The password also protects read access. A person with only the read link sees a
password prompt. A person with an edit link still needs the password before
they can read or save the diagram.

## Password changes

Changing the password changes the protection for the private encryption key.
It does not require the browser to encrypt every stored item again.

Enter the current password before you change or remove password protection.

## Password loss

There is no password reset or account recovery. If you lose the password, you
cannot decrypt the source, metadata, or saved renders. Keep a secure copy of
the password when the diagram is important.

## Locked drafts

The editor keeps an open draft in the browser so you can recover recent work.
It does not write a locked draft to browser storage as plaintext.

For a locked diagram, keep the page open and save the diagram explicitly. A
locked draft is persisted only after a successful save. If the page closes
before that save, the browser may not be able to restore the draft.

## Embeds

Locked diagrams cannot use public SVG or Markdown embeds. An embed has no safe
way to ask for the password. Open the diagram in diagram.zip to enter the
password and view it.
