---
name: block-diagram
description: Arrange labeled blocks and relationships to communicate system decomposition, signal or data paths, and high-level structure without committing to a specialized formal notation.
---

# Block diagram

## What and why

Use this skill for a deliberately general overview: major blocks, inputs and outputs, and the paths that connect them. It is useful early in design, in technical documentation, and when a domain-specific notation would distract from the main story.

## Select or avoid

Select it when the audience needs a compact structural abstraction and the exact notation is not the decision. Avoid it when semantics are important enough to warrant a flowchart, component, deployment, circuit, protocol-layout, or formal SysML diagram. State whether arrows mean control, data, energy, material, or dependency; an unlabeled generic arrow is ambiguous.

## Modeling method

1. Write the one-sentence story and define the system boundary.
2. Select blocks that transform, contain, or depend on something relevant to that story.
3. Arrange blocks in the dominant flow direction and label inputs, outputs, and relationships.
4. Group blocks only when the grouping changes interpretation; keep hierarchy shallow.
5. Add assumptions, units, interfaces, and omitted detail as notes or a legend.

## Styling and customization

Use one shape family for blocks, spacing to show hierarchy, and line weight to distinguish boundary from flow. Use color for category or state, never as the only encoding. Prefer orthogonal routing for engineered paths and whitespace over connector crossings. Preserve a user-selected renderer; otherwise use D2 or Graphviz for flexible blocks, BlockDiag for automatic block layouts, Mermaid for lightweight docs, or PlantUML for a familiar architecture notation.

## Review checklist

- Is the meaning of each block and arrow explicit?
- Is the abstraction level consistent?
- Can the dominant path be followed without crossing lines?
- Are boundary, interface, assumptions, and omitted detail visible?
- Would a specialized diagram type communicate the decision more precisely?

## Standards and prior art

Block diagrams are a family of conventions rather than one universally governing notation. [ISO 5807:1985](https://www.iso.org/standard/11955.html) covers information-processing flowchart and program-network symbols, while [OMG SysML](https://www.omg.org/sysml/) formalizes block-oriented systems modeling beyond a generic sketch. diagram.zip supports generic block rendering through PlantUML, Mermaid, D2, Graphviz, BlockDiag, and diagrams.net, but does not provide SysML validation or interchange. Native SysML 2 support is an integration opportunity if demand justifies it.
