---
id: create-tikz
slug: /create/types/tikz
title: TikZ
description: Create a TikZ diagram in diagram.zip.
sidebar_label: TikZ
---

import DiagramExample from '@site/src/components/DiagramExample';

# TikZ

TikZ creates precise diagrams with TeX drawing commands.

## Use this type

Use TikZ for mathematical, scientific, geometric, and publication-quality diagrams.

## Source format

The source format is **TeX with TikZ**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put drawing commands in a `tikzpicture` environment.
- Create shapes with commands such as `node`, `draw`, and `path`.
- Put options in square brackets.
- Terminate each path command with a semicolon.

### Example

```text
\begin{tikzpicture}
  \node (user) at (0,0) {User};
  \node (diagram) at (3,0) {diagram.zip};
  \draw[->] (user) -- (diagram);
\end{tikzpicture}
```

The rendered view uses a complete project example for this diagram type.

<DiagramExample engine="tikz" label="TikZ" sourceUrl="/examples/tikz.json" />

## Related pages

- [Style TikZ](/style/types/tikz)
- [General presentation settings](/style/presentation)
- [Open TikZ in the editor](https://diagram.zip/?type=tikz)

## Upstream reference

[TikZ documentation](https://ctan.org/pkg/pgf)
