---
name: protocol-layout-diagram
description: Use when a diagram must explain the bit, byte, or word layout of a protocol message, file header, register, or binary record.
---

# Protocol layout diagram

## What it is

A protocol layout diagram maps wire-order positions to named fields. It tells the reader how many bits or bytes each field occupies, where boundaries fall, which values are interpreted together, and which parts are conditional or repeated.

## Choose it when

- the question is “what is at offset N?” or “how is this message encoded?”
- implementation, interoperability, packet capture, or security review depends on exact widths and ordering;
- a prose table would hide alignment, reserved bits, endianness, or optional extensions.

Use a sequence or flow diagram for message behavior. Use a data-flow diagram for movement between components. Do not use this diagram to imply that fields are sent in the order they are drawn unless wire order is explicitly stated.

## Story and modeling

1. State the unit and orientation: bits per row, byte order, bit numbering convention, and whether offsets are absolute or relative.
2. Draw the fixed header first, then conditional, repeated, and payload regions. Mark variable-length fields with their length rule.
3. Give every field a name, width/range, and interpretation. Show reserved bits and whether they must be zero, ignored, or preserved.
4. Separate normative wire facts from explanatory annotations. Record the specification version and section beside the title or in a legend.
5. Check examples against the encoding: widths must sum to the row width, offsets must not overlap, and endianness must agree with the prose.

## Styling and customization

Use a restrained palette: one color for fixed framing, one for payload, one for control/flags, and a visibly distinct treatment for reserved or deprecated fields. Put bit numbers above the row and byte offsets below it. Keep labels short and move long semantics into notes. For accessibility, do not communicate field meaning by color alone; use text, patterns, or a legend.

## Renderer routing

- `packetdiag` is the direct diagram.zip fit for bit-field layouts; preserve its column width and field-range semantics.
- `bytefield` is useful for byte-oriented headers and payloads when a code-defined, repeatable layout is preferred.
- `wavedrom` can express registers and bus transactions when timing is part of the story, but it is not a substitute for a normative packet layout.
- `tikz` or `pikchr` can be a bespoke escape hatch when a standards-specific notation exceeds those renderers.

Keep the user's explicit renderer choice. If no renderer is specified, choose the smallest source that preserves exact widths and explain the choice. diagram.zip does not currently provide a dedicated parser/validator for every protocol standard; a standards-aware packet editor or automatic field-sum validation would be a useful integration opportunity.

## Review checklist

- Is wire order, bit numbering, and unit unambiguous?
- Do widths, offsets, and alignment add up?
- Are optional, repeated, reserved, and extension fields explicit?
- Are byte order and value encoding documented?
- Is the cited specification/version recoverable?
- Can a reader distinguish normative fields from commentary without color?

## References

- [RFC 2360, section 3.3](https://www.rfc-editor.org/rfc/rfc2360.html#section-3.3) summarizes conventions for protocol diagrams and field representations.
- [RFC 791, section 3.1](https://www.rfc-editor.org/rfc/rfc791.html#section-3.1) is a canonical example of an Internet header bit layout and field description.
- [RFC 8200, section 3](https://www.rfc-editor.org/rfc/rfc8200.html#section-3) shows the IPv6 base-header field layout and extension-header model.
- [PacketDiag documentation](http://blockdiag.com/en/nwdiag/packetdiag-examples.html) documents the diagram.zip-supported PacketDiag source model.
- [Bytefield SVG documentation](https://bytefield-svg.deepsymmetry.org/) documents byte-oriented source forms.
