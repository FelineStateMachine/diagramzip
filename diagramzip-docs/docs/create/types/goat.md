---
id: create-goat
slug: /create/types/goat
title: GoAT
description: Create a GoAT diagram in diagram.zip.
sidebar_label: GoAT
---

import DiagramExample from '@site/src/components/DiagramExample';

# GoAT

GoAT converts ASCII-art diagrams into SVG.

## Use this type

Use GoAT for boxes, arrows, grids, and compact diagrams that remain useful as text.

## Source format

The source format is **ASCII diagram text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use ASCII or supported Unicode line characters.
- Close shapes when you need filled regions.
- Add arrowheads at the end of a connector.
- Keep labels away from connector intersections.

### Example

```text
+-------------------+                           ^                      .---.
|      ‗A Box‗      |__.--.__    __.-->         |      .-.             |   |
|                   |        '--'               v     | * |<---        |   |
+-------------------+                                  '-'             |   |
                        `Round`                                    *---(-. |
  .-----------------.  .-------.    .----------.         .-------.     | | |
 |   Mixed Rounded  | |         |  / Diagonals  \        |   |   |     | | |
 | & Square Corners |  '--. .--'  /              \       |---+---|     '-)-'       .--------.
 '--+------------+-'  .--. |     '-------+--------'      |   |   |       |        / Search /
    |            |   |    | '---.        |               '-------'       |       '-+------'
    |<---------->|   |    |      |       v                Interior                 |     ^
    '           <---'      '----'   .-----------.              ---.     .---       v     |
 .------------------.  Diag line    | .-------. +---.              \   /           .     |
 |   if (a > b)     +---.      .--->| |       | |    |`Curved line` \ /           / \    |
 |   obj->fcn()     |    \    /     | '-------' |<--'                +           /   \   |
 '------------------'     '--'      '--+--------'      .--. .--.     |  .-.     +Done?+-'
    .---+-----.                        |   ^           |\ | | /|  .--+ |   |     \   /
    |   |     | Join        \|/        |   | `Curved`  | \| |/ | |    \    |      \ /
    |   |     +---->  o    --o--        '-'  Vertical  '--' '--'  '--  '--'        +  .---.
 <--+---+-----'       |     /|\                                                    |  | 3 |
                      v                             not:line    'quotes'        .-'   '---'
  .-.             .---+--------.            /            A || B   ·bold·       |        ^
 |   |           |   Not a dot  |      <---+---<--    A dash--is not a line    v        |
  '-'             '---------+--'          /           Nor/is this.            ---
```

<DiagramExample engine="goat" label="GoAT" sourceUrl="/examples/goat.json" />

## Related pages

- [Style GoAT](/style/types/goat)
- [General presentation settings](/style/presentation)
- [Open GoAT in the editor](https://diagram.zip/?type=goat)

## Upstream reference

[GoAT documentation](https://github.com/blampe/goat)
