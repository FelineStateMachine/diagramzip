# Vega and Vega-Lite reference

Use the renderer that matches the required control surface:

- [Vega documentation](https://vega.github.io/vega/docs/) defines the lower-level grammar: data, transforms, scales, axes, legends, marks, signals, and projections. It is the supported diagram.zip renderer ID `vega`.
- [Vega-Lite documentation](https://vega.github.io/vega-lite/docs/) defines concise marks, encodings, typed fields, layering, concatenation, faceting, and repeat views. It is the supported diagram.zip renderer ID `vegalite`.
- The Vega-Lite paper, [A Grammar of Interactive Graphics](https://idl.uw.edu/papers/vega-lite/), explains why explicit data types and compositional encodings make common charts easier to specify and review.

Practical routing:

- Start with Vega-Lite for bars, lines, areas, scatterplots, histograms, box plots, heatmaps, faceting, and small multiples.
- Use Vega when you need custom transforms, a geographic projection, a force layout, bespoke marks, signals, or exact layered composition.
- Put records or geometry inline. External URLs are unavailable in diagram.zip’s Vega and Vega-Lite renderers.
- Use explicit `type` (`quantitative`, `temporal`, `ordinal`, or `nominal`) and explicit scale domains when comparison across views matters.
- Verify the actual output at the target size; a valid specification can still produce illegible labels or an ambiguous legend.

The renderer catalog does not currently provide convenience renderers for Sankey, treemap, beeswarm, word cloud, or network diagrams. A future integration could add tested, accessible templates or dedicated renderers for these forms; until then, disclose custom Vega work and do not claim that a generic mark is a semantic implementation.
