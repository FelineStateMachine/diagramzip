---
id: create-wavedrom
slug: /create/types/wavedrom
title: WaveDrom
description: Create a WaveDrom diagram in diagram.zip.
sidebar_label: WaveDrom
---

import DiagramExample from '@site/src/components/DiagramExample';

# WaveDrom

WaveDrom creates digital timing diagrams from signal and wave data.

## Use this type

Use WaveDrom for clocks, buses, requests, responses, and protocol timing.

## Source format

The source format is **WaveJSON**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use an object with a `signal` array.
- Give each signal a name and a wave string.
- Use data labels for bus values.
- Use empty objects to add visual space.

### Example

```json
{ "signal": [
  { "name": "clock", "wave": "p...." },
  { "name": "data", "wave": "x.34x", "data": ["A", "B"] }
]}
```

<DiagramExample engine="wavedrom" label="WaveDrom" sourceUrl="/examples/wavedrom.json" />

## Limitations

- Only the six bundled diagram.zip skins are available.
- diagram.zip returns SVG for this type.

## Related pages

- [Style WaveDrom](/style/types/wavedrom)
- [General presentation settings](/style/presentation)
- [Open WaveDrom in the editor](https://diagram.zip/?type=wavedrom)

## Upstream reference

[WaveDrom documentation](https://wavedrom.com/tutorial.html)
