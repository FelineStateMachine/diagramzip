---
name: choose-data-visualization
description: Choose and design a data visualization when the user has data, a comparison, trend, distribution, relationship, flow, or geographic question but has not yet chosen a chart form. Use the simplest honest encoding, explain the story, and route the result to Vega or Vega-Lite when appropriate.
---

# Choose a data visualization

## What this skill is

This is a semantic chart-selection skill. It decides what the data should say before deciding how the source is written. It covers bar, line and area, scatter and bubble, histogram, box/violin/density, pie/donut, heatmap, treemap, Sankey, geographic, network, beeswarm, and word-cloud forms.

## Ask first

Establish these facts before choosing a mark:

- What decision or question should the reader answer?
- What is one row: an observation, category, event, relationship, region, or aggregate?
- Which fields are quantitative, temporal, ordinal, nominal, geographic, or identifiers?
- Is the task comparison, ranking, change over time, distribution, correlation, part-to-whole, flow, location, hierarchy, or topology?
- How many observations and categories are there, and will the chart be printed, embedded, or explored interactively?
- Are zero, uncertainty, missing values, weights, denominators, and units meaningful?

If the user already selected a chart form or renderer, preserve that choice and review it against the question. Do not silently substitute a chart.

## Choose the story

- **Bar**: compare discrete values or rank categories. Use a common zero baseline for magnitudes; sort deliberately. Horizontal bars suit long labels. Avoid bars for dense time series or many categories.
- **Line / area**: show ordered time or another continuous sequence. Lines imply continuity; do not connect unrelated categories. Use area for cumulative volume or a small number of parts, not for precise comparison of many series.
- **Scatter / bubble**: show association between two quantitative variables; use size for a third only when area can be read as approximate magnitude. Add trend or reference lines only when they have a stated meaning.
- **Histogram**: show the distribution of one quantitative field. State bin width or method; compare groups with shared bins. It is not a bar chart of arbitrary categories.
- **Box / violin / density**: compare distributions across groups. Box plots emphasize robust summaries and outliers; violins/densities show shape but can mislead with small samples or smoothing. Show sample size where it changes interpretation.
- **Pie / donut**: show a small number of mutually exclusive parts of one whole when the total is meaningful. Prefer bars when exact comparison matters; never use a pie for unrelated values or a changing total.
- **Heatmap**: show a quantitative value over two categorical/ordered dimensions, often a matrix or calendar. Use a perceptually ordered scale and label the legend; do not imply precision the color cannot carry.
- **Treemap**: show nested part-to-whole with limited space. Use area for the primary magnitude and hierarchy for grouping; avoid it when adjacent length comparisons are required.
- **Sankey / flow**: show quantities moving among stages or nodes. Preserve conservation or explain losses/gains, label units, and avoid excessive crossing. It is not a generic relationship graph.
- **Geographic map**: show spatial distribution or routes only when location changes the decision. Choose a projection and geometry appropriate to the region; normalize rates by population/area where relevant. A map is not automatically more informative than a ranked bar chart.
- **Network visualization**: show entities and relationships/topology. Define node and edge meaning, direction, and weight; do not use position as an unearned quantitative scale. For dense networks, filter, group, or provide a table/search alternative.
- **Beeswarm**: show every observation across one or more groups while exposing distribution and sample size. It is useful when overplotting would hide points; preserve a quantitative axis and explain jitter packing.
- **Word cloud**: show rough prominence of terms in a corpus, not exact ranking or meaning. Prefer a sorted bar chart for measured comparison; remove stopwords and disclose the weighting/tokenization.

## Honest encodings and styling

Use position and length for the most important quantitative comparison, then color, shape, and size. Treat color as a redundant cue, not the sole encoding. Use a zero baseline for bars and areas unless a clearly marked non-zero baseline is the point. Keep comparable panels on shared scales. Label units, denominators, aggregation, date range, missing data, and uncertainty.

Prefer restrained, semantic styling: a neutral field, one accent for the focus, a colorblind-safe categorical palette, direct labels where they reduce lookup, and a legend only when it remains legible. Avoid 3-D effects, decorative gradients, rainbow scales for ordered values, misleading area/volume, excessive gridlines, and truncated axes that exaggerate differences. Provide text or tabular access to values and meaningful titles/annotations.

For Vega-Lite, start with a mark and field encodings, then set explicit types, scales, axes, legends, and configuration. Use Vega when the chart needs custom marks, transforms, signals, projections, force layouts, or precise composition. Both are supported renderer IDs in diagram.zip: `vegalite` and `vega`. Keep data and images inline: diagram.zip does not provide URL-backed data or images for these renderers and returns SVG.

Renderer choice remains the user’s choice. If another supported renderer is requested, route only if it can express the selected story faithfully; otherwise explain the gap and offer a Vega/Vega-Lite source as an option. The current catalog has no dedicated high-level renderer for Sankey, treemap, beeswarm, word cloud, or network charts. Vega can sometimes implement them with custom transforms/marks; Vega-Lite is not a turnkey solution for each. Geographic charts require inline geometry and a deliberate projection. Treat this as an integration opportunity, not permission to invent unsupported syntax.

## Review before delivery

Check that the title states the question, encodings match field types, aggregation and denominators are explicit, scales do not distort the comparison, categories are ordered intentionally, and annotations do not imply causation. Test long labels, missing values, small samples, extreme values, grayscale/low-vision viewing, keyboard or text alternatives, and export at the intended size. For maps check projection, boundary date, privacy, and rate normalization; for flows check conservation; for networks check edge ambiguity; for distributions check binning/smoothing and sample size.

Read [Vega and Vega-Lite guidance](references/vega.md) for renderer-specific decisions and [accessibility guidance](references/accessibility.md) when the output will be published or used for a decision.
