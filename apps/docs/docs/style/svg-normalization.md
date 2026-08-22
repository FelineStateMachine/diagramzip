---
id: svg-normalization
title: SVG normalization and version contracts
description: Understand normalized SVG, renderer version selection, capability metadata, and consumer guarantees.
sidebar_position: 2
---

# SVG normalization and version contracts

Diagram.zip accepts SVG from renderers with different structures, palettes, and release cycles. A shared pipeline turns that output into safe, predictable artifacts.

```text
renderer SVG
  -> sanitization
  -> canonical normalization
  -> appearance materialization
  -> final SVG
```

The renderer owns source interpretation and layout. Later stages preserve diagram geometry while adding safety, semantic paint roles, and optional presentation bounds.

## Editable SVG contract

An editable export is still a normal visible SVG. It embeds a versioned
Diagram.zip document in `<metadata>` and uses `data-*` attributes for compact
per-element and root bindings. The document records the source type, source,
renderer options, presentation, title, and description.

The metadata contract is versioned independently from rendering contracts. An
importer must validate the schema, required fields, size limit, and deterministic
reconstruction before it creates a draft. The current input limit is 5 MiB.

The importer accepts a validated enriched SVG from a local file, drag and drop,
pasted SVG text, or an HTTP(S) or data URL. It rejects ordinary SVG, ambiguous
metadata, unsupported schema versions, and any input that would lose source or
presentation information. It does not infer a source language from visible
shapes.

**Save as File** exports the enriched SVG without server persistence. **Publish**
and **Encrypt & Publish** persist aliases separately from the file export.

## Artifact stages

| Stage | Contract |
| --- | --- |
| Renderer SVG | Output from one identified renderer build. |
| Canonical SVG | Sanitized SVG with normalized metadata, bounds, and supported semantic roles. |
| Materialized SVG | Canonical geometry combined with one explicit appearance, palette, and optional frame. |

Materialization does not run the renderer again. Light, dark, transparent, and framed artifacts reuse the same canonical geometry.

Framed appearances may expand the outer view box for standard padding and the frame. They do not reroute connectors or reflow labels.

## Appearance contract

The appearance name is a closed enum:

```text
raw
auto-transparent
light-transparent
dark-transparent
auto-framed
light-framed
dark-framed
```

`raw` preserves the safe renderer appearance. It does not promise byte-for-byte preservation because sanitization and deterministic serialization still apply.

Automatic appearances embed both palettes and select one with `prefers-color-scheme`. They do not depend on styles from the embedding page.

Transparent appearances omit the outer canvas. Diagram objects may retain opaque surfaces when those surfaces are required for readable labels.

Framed appearances add a matching canvas, standard padding, and a border. They remain readable independently of the embedding page.

The editor offers only appearances advertised by the active profile. `raw` is always available.

## Capability levels

| Conformance | Meaning | Expected appearance support |
| --- | --- | --- |
| `semantic` | Stable renderer meaning maps directly to shared visual roles. | All audited appearances. |
| `adaptive` | Known structure and neutral paint adapt while authored color remains intact. | All audited appearances. |
| `presentation-only` | The authored drawing stays unchanged while Diagram.zip owns the outer presentation. | Raw and audited framed appearances. |
| `raw` | The SVG is safe, but no themed adaptation is claimed. | Raw only. |

An authored non-neutral color may remain unchanged in a semantic or adaptive profile. Normalization does not erase meaningful source styling.

## How renderer versions select a profile

Each engine catalog entry pins a renderer version and an audited normalization profile. Compatibility belongs to that tested pair, not only to the engine name.

HTTP renderers identify their output with these response headers:

| Header | Purpose |
| --- | --- |
| `X-Diagram-Engine-Version` | Identifies the underlying engine release. |
| `X-Renderer-Build` | Identifies the Diagram.zip renderer build. |

Every renderer provides the same version identity through its catalog entry and HTTP response. Diagram.zip uses this identity before it assigns semantic roles.

An unknown or upgraded renderer build does not inherit an older profile automatically. It falls back to `safe-raw-1`, which supports only `raw`.

This fail-closed behavior prevents rules for one renderer structure from changing unrelated elements in another structure.

Version identifiers are opaque contract values. Consumers should compare complete values and must not infer compatibility from embedded numbers.

The [renderer catalog](https://diagram.zip/render/v1/catalog) reports every engine version, known loss, and active normalization capability.

## Independently versioned contracts

| Contract | Example identifier | Changes when |
| --- | --- | --- |
| Canonical schema | `1` | The canonical SVG structure changes incompatibly. |
| Normalizer | `svg-normalizer-2` | Sanitization, annotation, or serialization behavior changes. |
| Profile | `neutral-svg-semantic-2` | Renderer recognition or role assignment changes. |
| Palette | `diagramzip-palette-1` | Materialized role colors change. |
| Materializer | `svg-materializer-2` | Appearance rules, padding, frame, or output assembly changes. |
| Renderer | Catalog version and build | Engine output or its integration changes. |

These versions advance independently. A renderer upgrade does not require a schema change, and a palette update does not require new geometry.

Any component that changes pixels or bounds must change the relevant build identifier. Cache identity must include every component that affected the artifact.

## Root SVG metadata

Canonical and materialized SVG expose their active contract through `data-dz-*` attributes on the root element.

| Attribute | Meaning |
| --- | --- |
| `data-dz-schema` | Canonical SVG schema. |
| `data-dz-normalizer` | Normalizer build. |
| `data-dz-engine` | Renderer engine identifier. |
| `data-dz-profile` | Selected normalization profile. |
| `data-dz-palette` | `renderer` for raw SVG, or the selected Diagram.zip palette build. |
| `data-dz-appearance` | Materialized appearance. |
| `data-dz-conformance` | Active capability level. |
| `data-dz-appearances` | Supported non-raw appearances, separated by spaces. |
| `data-dz-bounds` | Canonical diagram bounds as `x y width height`. |
| `data-dz-materializer` | Materializer build, present after non-raw materialization. |

Normalized elements may also use `data-dz-fill`, `data-dz-stroke`, and `data-dz-role`. These attributes separate semantic intent from concrete palette values.

```xml
<svg
  data-dz-schema="1"
  data-dz-normalizer="svg-normalizer-2"
  data-dz-engine="mermaid"
  data-dz-profile="neutral-svg-semantic-2"
  data-dz-palette="renderer"
  data-dz-appearance="raw"
  data-dz-conformance="adaptive"
  data-dz-appearances="auto-transparent light-transparent dark-transparent auto-framed light-framed dark-framed"
  data-dz-bounds="0 0 320 180">
</svg>
```

The identifiers above are examples. Inspect the artifact or catalog instead of hard-coding them.

Consumers should treat `data-dz-appearances` as an allowlist. Adding an unsupported value by hand does not create a supported artifact.

## Consumer guarantees

A normalized SVG has these guarantees:

- It is valid, sanitized, deterministic SVG with no unapproved network dependency.
- It is self-contained after materialization and does not require embedding-page CSS.
- It preserves renderer geometry, except for presentation bounds added by a frame.
- It applies palette rules only to elements assigned a supported semantic role.
- It preserves authored paint when the profile cannot adapt that paint honestly.
- It rejects unsupported appearance materialization instead of applying heuristic theming.

Cache keys must include source identity, renderer options, renderer builds, schema, normalizer, profile, palette, materializer, and appearance.

Do not key a cache only by source and engine name. That can return artifacts created under an incompatible renderer or presentation contract.

## Upgrade expectations

A renderer upgrade is a new output contract until the representative test corpus passes. The existing profile may then add compatibility, or a new profile may replace it.

Tests cover safety, determinism, raw fidelity, geometry stability, contrast, transparent canvases, frames, authored colors, and hostile resource attempts.

See the [full engineering contract](https://github.com/FelineStateMachine/diagramzip/blob/main/docs/svg-normalization.md) for profile design, semantic roles, validation rules, and caching details.
