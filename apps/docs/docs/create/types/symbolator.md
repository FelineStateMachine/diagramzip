---
id: create-symbolator
slug: /create/types/symbolator
title: Symbolator
description: Create a Symbolator diagram in diagram.zip.
sidebar_label: Symbolator
---

import DiagramExample from '@site/src/components/DiagramExample';

# Symbolator

Symbolator creates a component symbol from a hardware module declaration.

## Use this type

Use Symbolator to document component ports, directions, groups, and data widths.

## Source format

The source format is **VHDL or Verilog source**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Declare a VHDL entity or a Verilog module.
- Declare the ports that must appear in the symbol.
- Use supported comments to group ports.
- Select the component when the source has more than one.

### Example

```text
module diagram (
  input wire clock,
  input wire data_in,
  output wire data_out
);
endmodule
```

<DiagramExample engine="symbolator" label="Symbolator" sourceUrl="/examples/symbolator.json" />

## Related pages

- [Style Symbolator](/style/types/symbolator)
- [General presentation settings](/style/presentation)
- [Open Symbolator in the editor](https://diagram.zip/?type=symbolator)

## Upstream reference

[Symbolator documentation](https://github.com/kevinpt/symbolator)
