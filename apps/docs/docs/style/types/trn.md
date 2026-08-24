---
id: style-trn
slug: /style/types/trn
title: TRN
description: Style a TRN diagram in diagram.zip.
sidebar_label: TRN
---

# Style TRN

TRN colors complete relationship zones as branches. Adjacent zones receive different normalized colors, while ingredients run downward and operations run right.

Start with the [general presentation settings](/style/presentation). Edit shared or raw presentation in Details, and keep renderer-specific styling in Source.

## Source controls

- Use `.layout combined` for one merged table.
- Use `.layout individual` for dependency-positioned recipe tables.
- Combined layout places prerequisite outcomes before direct ingredients and preserves source order within each FIFO group.
- Place each `+` immediately before the operation that consumes it.
- Independent branches can reuse a visual column when their inputs do not depend on each other.
- Order consecutive `->` lines as operations should proceed from left to right.
- Use outcomes for meaningful reusable or final results; keep incidental conversions inside the consuming outcome.
- Use concise, complete instructions because combined and individual operation text is vertical.
- Full-width `instruction` rows wrap automatically; combined and individual operation labels remain single-line.
## Limitations

- The source selects one layout; the SVG does not embed an interactive layout toggle.
- Combined and individual operation labels do not wrap. Long operation text can overflow.
- TRN does not expose a source control for custom column packing.

## Related pages

- [Create a TRN diagram](/create/types/trn)
- [General presentation settings](/style/presentation)
- [SVG normalization and version contracts](/style/svg-normalization)
- [Open TRN in the editor](https://diagram.zip/?type=trn)
