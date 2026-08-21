---
name: digital-timing-diagram
description: Use when a diagram must show digital signals changing over time, including clocked interfaces, bus transactions, handshakes, setup/hold relationships, or waveform protocols.
---

# Digital timing diagram

## What it is

A digital timing diagram is a time-aligned view of signals and events. It tells the reader which edges, levels, delays, and sampling relationships are required—not merely which components are connected.

## Choose it when

- correctness depends on clock edges, signal levels, latency, pulse width, or ordering in time;
- the reader needs to compare a producer, consumer, clock, enable, reset, or bus on a shared time axis;
- a protocol's “what happens when” is about electrical/logical timing rather than software call order.

Use a sequence diagram for causal messages between participants. Use a protocol-layout diagram for field positions in a packet. Use an electrical schematic for connectivity and symbols.

## Story and modeling

1. Define the time direction, scale or “not to scale” status, voltage/logic convention, and active edge.
2. Put the reference clock and reset first. Align every signal to explicit edges or intervals.
3. Label meaningful transitions: setup window, hold window, valid/ready, request/acknowledge, turnaround, wait state, and sampled value.
4. Show unknown, high-impedance, don't-care, and invalid states distinctly; never silently draw them as stable 0 or 1.
5. State assumptions such as synchronous domain, propagation delay, bus ownership, and whether the waveform is normative or an example trace.

## Styling and customization

Use a consistent signal baseline and equal vertical spacing. Use a single accent for the active transaction, neutral clock/grid lines, and explicit hatch or text for unknown/high-impedance states. Annotate intervals with brackets and values, not only color. Keep the time axis readable at the intended output size and split long traces into named phases rather than shrinking everything.

## Renderer routing

- `wavedrom` is the direct diagram.zip fit for clocked waveforms, signal lanes, phase labels, and bus values.
- `vega` can produce bespoke plotted traces when quantitative time data or custom scales matter, but it needs more explicit grammar and does not itself confer electrical meaning.
- `tikz` or `pikchr` can handle a custom timing notation when WaveDrom's primitives are insufficient.
- `plantuml`, `mermaid`, and `seqdiag` show ordered interactions but do not encode waveform-level setup/hold semantics; use them only if that abstraction is intentional.

Preserve the user's renderer choice. If no renderer is requested, prefer `wavedrom` and state any assumptions. diagram.zip does not currently validate timing constraints against an HDL interface standard or simulate a waveform; an integration that imports interface timing tables or checks setup/hold annotations would be valuable. IEEE 1800/SystemVerilog assertions and vendor timing formats remain unsupported as normative inputs unless separately integrated.

## Review checklist

- Is the time axis and scale status clear?
- Are clock edge, polarity, reset, and sampling point explicit?
- Are setup/hold, latency, pulse width, and turnaround intervals labeled where relevant?
- Are X/Z/don't-care states distinguishable from 0/1?
- Does every transition support the stated protocol story?
- Is this a normative timing requirement or one illustrative trace?

## References

- [WaveDrom documentation](https://wavedrom.com/) describes the waveform source model supported by diagram.zip.
- [IEEE 1800-2023](https://standards.ieee.org/ieee/1800/10458/) is the SystemVerilog language standard, including assertions and timing-oriented design constructs; diagram.zip does not parse it as a timing-diagram source.
- [JEDEC JESD79-5C](https://www.jedec.org/standards-documents/docs/jesd79-5c) is an example of a memory-interface specification where timing diagrams accompany normative setup/hold requirements.
