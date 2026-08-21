---
name: technical-illustration
description: Use when the user needs an explanatory technical figure showing parts, assemblies, operation, dimensions, callouts, or a controlled visual sequence.
---

# Technical illustration

## Select it when

Choose this skill for an explanatory figure whose meaning depends on physical appearance, exploded relationships, section views, callouts, or a sequence of operation. Use it for manuals, training, proposals, and engineering communication. Do not use it for a pure graph, formal schematic, manufacturing drawing, or photorealistic product render unless that is explicitly the requested deliverable.

## Story and modeling

State the reader's question and the viewing convention: identify parts, show assembly order, explain motion/flow, expose an internal section, or compare states. Establish a datum/orientation, part IDs, leader-line targets, scale status, and what is intentionally omitted. Separate measured dimensions from illustrative proportions. If geometry or safety depends on exact values, link to the controlled CAD/drawing source.

The output is an explanatory depiction, not automatically a standards-compliant technical product definition. A generic diagram renderer cannot guarantee projection rules, tolerances, datum systems, material hatching, or manufacturing authority.

## Styling and customization

Use a restrained palette, high-contrast labels, consistent line weights, and uncluttered leader lines. Use exploded offsets and transparency sparingly; preserve occlusion cues and assembly order. Number parts consistently and provide a keyed parts list. Use section hatching or dimension marks only when their convention is explained. Avoid decorative perspective that changes the apparent relationship or hides a critical interface.

## Renderer routing

Preserve a renderer explicitly requested by the user. Use `pikchr` or `tikz` for controlled geometry, `diagramsnet` or `excalidraw` for manually composed callouts and assembly views, and `ditaa`, `goat`, or `svgbob` for text-native sketches. Use `d2`, `graphviz`, or `plantuml` when the illustration is really a relationship abstraction. No listed renderer is a CAD, geometric-dimensioning, or photorealistic illustration engine; offer an integration gap rather than faking precision.

## Review

Check callout target accuracy, part numbering, orientation, section/hidden-line conventions, label legibility, contrast, and print behavior. Confirm that dimensions have units and that “not to scale” is visible where applicable. Have a domain reviewer verify the physical interpretation and compare against the controlled source. Record revision and intended audience.

## References

- [ISO 128-1:2020](https://www.iso.org/standard/65296.html) — general principles for technical drawings; consult the applicable part and licensed text for production work.
- [ISO 5455:1979](https://www.iso.org/standard/11514.html) — scales for technical drawings; a renderer does not enforce scale.
- [ISO 5457:1999](https://www.iso.org/standard/11522.html) — sizes and layout of drawing sheets; page-layout integration may be needed.
- [IEC 61082-1](https://webstore.iec.ch/en/publication/265) — electrotechnical documentation conventions where the illustration is part of such a document.

## Integration opportunities

Standards-aware projection, dimensioning, tolerancing, CAD import, vector authoring, material/section conventions, and controlled title-block export are not provided by the current diagram renderers. Treat those as integration opportunities when exact engineering documentation is required.
