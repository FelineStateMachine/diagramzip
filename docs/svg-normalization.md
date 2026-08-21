# SVG normalization contract

## Purpose

SVG is the rendering contract between a diagram engine and its consumers. An
engine can use any language, runtime, renderer, layout algorithm, or deployment
topology. Its accepted output becomes safe, deterministic SVG. Consumers can
present it with one of seven Diagram.zip appearance presets:

```text
raw
auto-transparent
light-transparent
dark-transparent
auto-framed
light-framed
dark-framed
```

Normalization gives these outputs a coherent Diagram.zip visual language
without requiring engines to produce identical markup or use identical native
themes. The contract is defined in terms of output capabilities and semantic
roles rather than a fixed inventory of engines. A new engine or a new release
of an existing engine may use a different normalization pattern when its output
traits change.

This contract does not require pixel compatibility between different engines,
replace an engine's layout algorithm, or make arbitrary SVG artwork fully
themeable. It does define what an engine must provide before each normalized
appearance can be advertised as supported.

## Terminology

- **Engine SVG** is the SVG returned by a renderer before shared processing.
- **Sanitized SVG** is engine SVG with unsafe content and disallowed resources
  removed.
- **Normalization profile** is a versioned set of configuration, recognition,
  and annotation rules for a particular renderer output contract.
- **Canonical SVG** is safe SVG whose geometry is preserved and whose relevant
  visual elements have Diagram.zip semantic roles.
- **Appearance preset** is a versioned mapping from semantic roles to concrete
  paint and presentation values.
- **Materialized SVG** is a self-contained SVG with one appearance preset
  selected. It is the public render artifact.
- **Canvas** is the backdrop around the diagram. It is distinct from the fills
  of nodes, notes, groups, labels, and other diagram objects.

## Pipeline contract

Every render follows the same conceptual pipeline:

```text
source and options
  -> renderer configuration
  -> engine render
  -> SVG sanitization
  -> structural normalization
  -> semantic annotation
  -> canonical SVG
  -> appearance materialization
  -> final validation
  -> artifact
```

Stages may execute in the browser, at the edge, in a service, or in the same
process as the engine. Their location does not change their contracts.

The engine render is the only stage allowed to change diagram geometry as part
of layout. Later stages may normalize document bounds and add presentation
padding or a frame. They must not reroute connectors, reflow labels, or change
font metrics after layout. They must not reinterpret the source language.

Sanitization occurs before semantic processing. Normalization rules must never
depend on active content, external stylesheets, remote resources, or other
content that the sanitizer will remove. A final validation pass verifies that
normalization did not introduce invalid or unsafe SVG.

## Appearance presets

The appearance name is a closed product-level enum, not a bag of independent
flags. This prevents combinations whose contrast and presentation have not
been tested.

| Appearance | Canvas | Frame | Diagram palette |
| --- | --- | --- | --- |
| `raw` | Renderer-defined | Renderer-defined | Renderer-defined |
| `auto-transparent` | Transparent | None | Matches the viewing color scheme |
| `light-transparent` | Transparent | None | Light |
| `dark-transparent` | Transparent | None | Dark |
| `auto-framed` | Matching surface | Standard | Matches the viewing color scheme |
| `light-framed` | Light surface | Standard | Light |
| `dark-framed` | Dark surface | Standard | Dark |

Transparent means that the canvas is transparent. It does not mean that all
object fills are transparent. A light-transparent node may use an opaque light
surface so that its dark label remains readable. A dark-transparent node may
use an opaque dark surface for the same reason.

The transparent variants are intended for a surrounding surface of the same
lightness. Free-standing text and connectors in a light-transparent diagram may
not be readable on an arbitrary dark page. The reverse is true for a
dark-transparent diagram. Framed variants are self-contained and must remain
readable regardless of the embedding page.

The automatic variants include both palettes and select between them with an
internal `prefers-color-scheme` media query. They do not depend on CSS from the
embedding page, which cannot style an SVG displayed through an image element.

The standard frame owns:

- a canvas surface;
- deterministic padding derived from the normalized bounds;
- a palette-defined border;
- any standard corner treatment;
- any frame-only shadow or elevation treatment.

Frame strokes should use non-scaling behavior when necessary. Frame geometry
must be included in the final view box, and rounded corners must not expose an
unintended opaque rectangular canvas behind them.

`raw` means visually faithful, safe renderer output. It does not mean
byte-for-byte preservation, unsanitized output, or exemption from deterministic
serialization. Removal of unsafe content may necessarily change the result.

## Canonical SVG contract

A canonical SVG preserves the engine's geometry while making presentation
intent explicit. It should identify its normalization schema, renderer
identity, normalization profile, and palette compatibility in machine-readable
metadata or root attributes.

Schema 1 uses the following root attributes:

```xml
<svg
  data-dz-schema="1"
  data-dz-normalizer="svg-normalizer-2"
  data-dz-engine="example"
  data-dz-profile="semantic-markup-2"
  data-dz-palette="renderer"
  data-dz-appearance="raw">
  <g data-dz-role="node">
    <rect data-dz-fill="surface-1" data-dz-stroke="line" />
    <text data-dz-fill="ink">Service</text>
  </g>
</svg>
```

Appearance materialization adds the self-contained tokens, owned canvas, and
owned frame after the canonical SVG is stored. The canonical object remains
unchanged.

These attributes are namespaced to Diagram.zip. The generic `data-theme`
attribute is not part of the contract because it can collide with renderer and
embedding conventions. Geometry and semantic paint roles remain independent
of the selected appearance.

Canonical SVG must be:

- valid, namespace-correct SVG;
- safe to display as an image under the product's content security policy;
- free of unapproved network dependencies;
- deterministic for identical renderer output, profile, and normalizer builds;
- idempotent under the same normalization build;
- self-contained after materialization;
- explicit about document bounds;
- stable under a change of appearance, except for presentation bounds added by
  the framed variants.

The normalizer may preserve original IDs when safe. Any IDs it creates must be
deterministically namespaced to avoid collisions with engine IDs, paint
servers, masks, markers, filters, or embedded SVG fragments.

Schema 1 separates fill and stroke roles. `data-dz-fill` controls paint inside
an element, while `data-dz-stroke` controls its boundary or connector. This
keeps arrowheads, unfilled nodes, and line geometry from inheriting the wrong
property during materialization.

## Current profile coverage

The shared sanitizer, canonical serializer, and appearance materializer apply
to browser and Worker renderers. Every catalog entry reports its active
normalization capability. An unrecognized renderer contract remains on
`safe-raw-1` and supports only `raw`.

The current catalog uses these profile families:

| Profile | Conformance | Engines | Supported appearances |
| --- | --- | --- | --- |
| `graphviz-15-semantic-2` | Semantic | Graphviz, DBML, ERD, WireViz | All |
| `d2-0.7-semantic-2` | Semantic | D2 | All |
| `plantuml-2026-semantic-2` | Semantic | PlantUML, C4 PlantUML, Structurizr | All |
| `svgbob-0.7-semantic-2` | Semantic | Svgbob, Ditaa | All |
| `neutral-svg-semantic-2` | Adaptive | BlockDiag, SeqDiag, ActDiag, NwDiag, PacketDiag, RackDiag, Bytefield, Mermaid, BPMN, Nomnoml, Pikchr, Symbolator, UMLet | All |
| `structured-svg-semantic-2` | Adaptive | GoAT, Vega, Vega-Lite, WaveDrom | All |
| `authored-neutral-semantic-1` | Adaptive | Excalidraw, TikZ | All |
| `authored-svg-presentation-1` | Presentation only | Diagrams.net | Raw and framed |

Semantic profiles rely on pinned renderer structures and stable class or group
meaning. Adaptive profiles recognize neutral paint and selected structural
roles. They preserve authored data colors and other non-neutral paint.
Presentation-only profiles do not claim that the authored drawing adapts. They
add only the shared outer canvas and frame.

Profile selection also checks the pinned renderer version. An engine upgrade
does not inherit a profile until its output passes the catalog audit. Unknown
builds fall back to `safe-raw-1`.

## Semantic visual roles

The normalized palette is expressed through semantic roles rather than literal
colors. The minimum role vocabulary is:

| Role | Meaning |
| --- | --- |
| `canvas` | Framed diagram backdrop |
| `surface-1` | Ordinary node or object surface |
| `surface-2` | Container, group, pool, cluster, or section surface |
| `surface-3` | Nested, elevated, note, header, or callout surface |
| `ink` | Primary text and high-emphasis symbols |
| `ink-muted` | Secondary labels and annotations |
| `line` | Primary boundaries and connectors |
| `line-muted` | Grids, separators, guides, and secondary boundaries |
| `accent-N` | Stable categorical or semantic hue slot |
| `on-accent` | Content placed on a strong accent surface |

Profiles may define more precise structural roles, but public appearance
presets should resolve them through this small shared vocabulary. This keeps
the palette bounded and prevents engine-specific colors from becoming part of
the public contract.

Four surface levels are enough to express canvas, ordinary objects,
containers, and elevated or nested objects. Profiles need not use every level.
Surface numbers describe hierarchy, not fixed lightness: the appearance preset
chooses appropriate values in light and dark modes.

Accent slots preserve distinctions, not literal shades. An authored blue and
an authored orange can map to stable blue-like and orange-like accent slots.
The light and dark presets select different shades for contrast. Color must not
be the sole carrier of meaning when the source format provides shape, label,
line, or pattern distinctions.

## Palette contract

The palette is a small, pinned data set embedded into materialized SVG. It must
not depend on a remote CSS resource or on the embedding page. A versioned subset
of the [Pico color palette](https://picocss.com/docs/colors) can supply neutral
surfaces and accent ramps. Diagram.zip role assignments and contrast pairs have
their own versioned contract.

The palette contains only the families and shades used by the role table. At a
minimum it defines:

- four light surfaces and four dark surfaces;
- primary and muted ink for each scheme;
- primary and muted line colors for each scheme;
- paired light and dark values for every supported accent slot;
- safe foreground values for strong accent surfaces;
- frame border and optional shadow values.

Selected foreground/background pairs must be measured rather than assumed to
be accessible because they came from a color library. Text contrast is checked
against the surface that owns the text. Strong accent fills should use a known
`on-accent` value. Subtle categorical fills should use a tinted surface and a
stronger accent border when that combination provides more reliable contrast.

Palette changes create a new palette build. Existing artifacts remain tied to
the palette build with which they were produced.

## Renderer configuration and normalization

The renderer and the normalizer share responsibility, but the normalizer owns
the final contract.

Configure a renderer when configuration affects output before layout or makes
semantic intent more reliable. Examples include:

- selecting deterministic output;
- selecting a known font before text measurement;
- suppressing an unnecessary canvas;
- enabling stable semantic groups or classes;
- disabling renderer-owned shadows or decorations that cannot be adapted;
- asking for neutral rather than independently themed output;
- preventing network or filesystem resource loading.

Post-process renderer output when the change is presentation-only and does not
need source-language knowledge. Examples include:

- sanitization;
- canvas recognition and removal;
- deterministic bounds and serialization;
- role annotations based on stable renderer structure;
- semantic paint overrides;
- adding the Diagram.zip frame;
- embedding metadata and the selected appearance.

Do not render separate native light and dark layouts only to obtain theme
support. The renderer must first prove that both modes have identical geometry
and semantic structure. Native themes can change font selection, layout,
filters, markup, and measurements. Prefer one canonical geometry.

Do not replace fonts after layout unless the profile proves metric
compatibility. A color-only post-processing step is generally safe; a font
change can overflow labels and move perceived alignment even when SVG geometry
is unchanged.

## Normalization profiles

A normalization profile is selected for a renderer output contract, not merely
for an engine name. Selection may consider renderer identity, build, declared
capabilities, output schema, and tested structural signatures. A renderer
upgrade does not inherit a profile automatically.

Profiles are built from composable patterns. Common patterns include:

### Native semantic output

The renderer emits stable semantic groups, classes, or tokens for nodes, edges,
containers, labels, and accents. The profile validates and maps those semantics
onto Diagram.zip roles. This is the strongest and least heuristic pattern.

### Configurable neutral output

The renderer can be configured to emit a predictable neutral palette and no
canvas. The profile recognizes a small set of known paints and structural
elements, then assigns roles. Configuration and post-processing work together.

### Stylesheet-driven output

Visual properties are controlled by embedded CSS rather than presentation
attributes. The profile must account for cascade and inheritance. It may append
appearance rules with sufficient specificity, rewrite a bounded known
stylesheet, or resolve selected properties before annotation. Blind string
replacement inside CSS is not acceptable.

### Structural geometry output

The renderer emits groups and geometry with little or no semantic styling. The
profile identifies object boundaries from stable structure and supplies
surfaces, ink, and lines. This pattern may synthesize a missing object fill only
when it has positively identified the element's semantic role.

### Flat paint output

The renderer emits literal paints with weak structural semantics. The profile
maps neutral paints to shared roles and hue-bearing paints to accent slots.
It must preserve distinctions and avoid treating every equal literal color as
the same semantic role when context says otherwise.

### Authored-visual output

Colors, gradients, patterns, or opacity are significant user-authored content.
The profile preserves the raw appearance and uses semantic or hue-preserving
adaptation only where it can distinguish structure from authored artwork. Full
theme support requires stronger renderer metadata; a frame alone must not be
advertised as full dark-mode normalization.

### Composite output

The SVG contains embedded raster images, nested SVG, complex filters, or other
opaque visual subtrees. The profile normalizes the parts it understands and
declares the remainder. Opaque content cannot be claimed as theme-adaptive
without a renderer-provided alternate representation.

### Translated pipeline output

One stage translates source into another renderer's input. Semantic annotations
may be carried through the translation, applied by the final renderer's
profile, or composed by both. Artifact identity records the ordered pipeline
and every normalization profile that affected the result.

These patterns are neither exclusive nor permanent categories. One renderer
build may combine semantic markup with stylesheet-driven labels and composite
icons. A later build may expose native tokens and stop using the flat-paint
pattern. The profile documents and tests the combination actually used.

## Paint assignment rules

Paint assignment operates on parsed SVG and known style structure, not regular
expressions over serialized markup.

The profile distinguishes at least:

- canvas paint;
- object surface paint;
- text paint;
- connector and boundary paint;
- markers and arrowheads;
- categorical or semantic accents;
- authored artwork;
- paint servers such as gradients and patterns;
- filters and shadows.

SVG defaults and inheritance matter. An absent `fill` does not necessarily mean
transparent. An explicit `fill="none"` does not identify a shape as a node
boundary or an open decorative path. The normalizer must inspect computed intent
within the bounded styling model that the profile supports.

A profile may turn an unfilled boundary into an opaque themed surface only
when it has identified the element as an object surface. It must not infer that
every closed rectangle, polygon, or path is a node. Arrowheads, icons, chart
marks, separators, clipping geometry, masks, hit targets, and invisible layout
elements are common counterexamples.

Text is assigned an ink role relative to its owning surface. Text without an
identifiable owner uses the scheme's canvas ink. A profile must account for
ordinary SVG text, paths, and approved embedded markup. Support for one form
does not imply support for the others.

Markers should inherit or be assigned the connector's role. If the renderer
reuses one marker definition across differently colored connectors, the
profile may need deterministic marker cloning or a supported contextual paint
mechanism.

Gradients and patterns require explicit profile rules. Mapping only a gradient
reference while leaving incompatible stops unchanged is not normalization.
When safe adaptation is unavailable, preserve the authored paint in `raw`.
Report the themed appearance as unsupported or incomplete. Do not silently
produce misleading output.

## Raw preservation and themed overrides

Raw values remain available independently of Diagram.zip role values. A
canonical representation can preserve renderer paint and apply scoped
appearance overrides. It can instead store normalized raw fallbacks in
deterministic custom properties. The exact mechanism is an implementation
choice when these invariants hold:

- selecting `raw` restores the safe renderer appearance;
- selecting a themed appearance does not require rerendering geometry;
- appearance rules affect only elements positively assigned a role;
- engine styles cannot accidentally override required themed contrast;
- themed rules do not destroy the information needed for `raw`.

Literal byte equality is not an invariant. Visual equivalence is tested with a
documented tolerance, alongside structural assertions for content that is
difficult to compare by pixels.

## Materialization

Canonical SVG is the reusable geometry and role representation. Materialization
selects a root appearance value and embeds the required palette tokens and role
rules. It applies canvas or frame geometry and serializes a self-contained SVG.

Consumers may inline canonical SVG and change its root appearance in a trusted
environment. Consumers displaying SVG through an image element cannot assume
that page CSS will style the SVG document. Public image endpoints and downloaded
artifacts therefore return a materialized SVG with an explicit appearance.

Materialization must not invoke the diagram engine. Switching between light
and dark or transparent and framed variants reuses canonical geometry. Framed
and transparent variants may have different outer view boxes because padding
and frame geometry are presentation, not diagram layout.

## Conformance and capability reporting

An appearance is supported only when the active profile satisfies its
invariants. Capability reporting should distinguish:

- `raw`: safe, visually faithful output;
- `semantic`: roles are derived from renderer semantics or proven stable
  structure;
- `adaptive`: paints are mapped with sufficient context to meet contrast and
  distinction requirements;
- `presentation-only`: only the canvas and frame are normalized;
- `unsupported`: the appearance cannot be produced honestly.

The four themed appearances require `semantic` or `adaptive` conformance.
`presentation-only` output may be useful for experimentation, but it must not
be presented as a normalized dark or light diagram. A production engine
upgrade should remain on its last conforming renderer/profile pair until the
new output contract passes normalization tests.

If a profile selector does not recognize a renderer build or structural
signature, it fails closed. It must not silently apply rules written for a
different output contract. A generic safe fallback may still provide `raw`,
but it does not inherit themed conformance.

Materialized SVG should expose enough metadata for diagnostics, including:

- renderer identity and build;
- ordered renderer or translator pipeline;
- normalizer schema and build;
- normalization profile and build;
- palette build;
- selected appearance;
- conformance level and declared limitations.

## Artifact identity and caching

Renderer, normalization, and appearance versions are independent inputs to
artifact identity. A cache key for a final SVG includes at least:

```text
source identity
renderer options
renderer pipeline and builds
normalizer schema and build
normalization profile builds
palette build
appearance
render-affecting metadata
```

Caching may be split into layers:

```text
engine render cache
  = source + renderer options + renderer pipeline/builds

canonical SVG cache
  = engine SVG identity + sanitizer/normalizer/profile builds

materialized SVG cache
  = canonical identity + palette build + appearance + metadata
```

This split is an optimization, not part of the public API. The correctness rule
is that changing a renderer, sanitizer, profile, normalizer, palette, or
appearance cannot accidentally reuse an artifact created by an incompatible
build.

## Validation

Each renderer/profile pair has a representative golden corpus. The corpus
covers the output traits used by its patterns rather than only a minimal smoke
diagram. Where applicable it includes:

- unfilled and filled objects with labels;
- nested containers and repeated surface levels;
- free-standing text;
- multiple connector types and markers;
- explicit authored colors and categorical accents;
- gradients, patterns, opacity, and filters;
- embedded markup, nested SVG, or raster content;
- unusual view boxes, dimensions, and coordinate origins;
- international text and the renderer's supported font behaviors;
- empty, very small, and bounded large diagrams;
- hostile SVG and resource-loading attempts.

Conformance tests verify:

1. The engine SVG is sanitized and the result remains valid SVG.
2. `raw` remains visually faithful within the declared tolerance.
3. Repeated normalization is byte-deterministic.
4. Normalization is idempotent for the same build.
5. All appearances preserve canonical diagram geometry.
6. Transparent appearances contain no canvas backdrop.
7. Transparent appearances retain required object surfaces.
8. Framed appearances include the complete frame within their bounds.
9. Text and meaningful marks meet the palette's contrast requirements against
   their owning surfaces.
10. Accent distinctions remain stable across light and dark appearances.
11. Unknown or decorative geometry is not assigned an invented surface.
12. External resources and active content do not survive or reappear.
13. The SVG renders consistently through supported image-element, inline, and
    rasterization paths.

Visual tests render transparent appearances over both expected and adversarial
checkerboard surfaces. This makes accidental canvas fills and unreadable free
text visible. Framed variants are tested over unrelated embedding colors to
verify that they are self-contained.

## Versioning and change management

The following are separately versioned contracts:

- renderer identity and build;
- renderer pipeline;
- sanitizer behavior;
- canonical SVG schema;
- normalization profile;
- palette;
- appearance preset geometry and rules.

A renderer upgrade, even under the same engine name, is treated as a new output
contract until its existing profile passes the full corpus. A profile may then
declare compatibility with the new renderer build, or a new profile may be
introduced. Pattern membership is updated based on observed capabilities, not
historical engine classification.

Changes that alter materialized pixels or bounds require a new relevant build
identifier. Schema migrations should preserve the ability to serve or
regenerate artifacts whose identities refer to an older supported contract.

## Anti-patterns

The following approaches violate this contract:

- global search-and-replace of color strings;
- treating every `fill="none"` shape as an object that needs a surface;
- using the presence of a rectangle alone to identify the canvas;
- applying a profile solely by engine name across untested renderer upgrades;
- claiming dark support after changing only the outer canvas;
- changing fonts after layout without metric-compatibility proof;
- allowing embedding-page CSS to be required for a public SVG;
- loading palette styles or fonts from the network at display time;
- mutating geometry separately for light and dark appearances;
- silently falling back from an unrecognized profile to heuristic theming;
- omitting normalizer, profile, or palette builds from artifact identity;
- calling unsafe renderer output `raw` and bypassing sanitization.

## Contract summary

The engine owns source interpretation and layout. The sanitizer owns safety.
The normalization profile owns the mapping from a tested renderer output
contract to semantic roles. The appearance preset owns palette, canvas, and
frame. Materialization combines one canonical geometry with one explicit
appearance to produce a deterministic, self-contained SVG.

Engines and their versions may change normalization patterns freely. Consumers
continue to receive the same five appearance names and the same semantic visual
contract.
