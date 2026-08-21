---
name: data-flow-diagram
description: Use when the user needs to show where information originates, how processes transform it, where stores retain it, and which external entities exchange it.
---

# Data-flow diagram

## What and why

A data-flow diagram (DFD) explains movement and transformation of information. Its story is source → process → store/sink, with the data named on each flow. It is useful for system scope, privacy reviews, integration discovery, and requirements conversations.

Choose it for information movement. Avoid it for temporal call order (sequence diagram), network topology (network-topology), business control flow (flowchart/BPMN), or deployment placement.

## How

1. Declare the level: context/level 0 for one process and external entities, or a decomposed level for internal processes.
2. Use four concepts: external entity, process, data store, and data flow. Give each a stable ID and a meaningful noun/verb label.
3. Label every arrow with the data being exchanged; distinguish request, response, event, and batch where it matters.
4. Balance decomposition: flows crossing a parent boundary must remain represented in its child diagram.
5. Mark trust boundaries, retention, sensitive fields, and ownership as annotations rather than inventing new flow semantics.

## Story and styling

Put external entities at the perimeter, processes in the reading direction, and stores near the processes that use them. Use restrained colors for entity/process/store roles and a single accent for sensitive or cross-boundary flows. Arrow direction and labels must remain legible in monochrome.

If no renderer is specified, `graphviz` is a strong default for explicit nodes and directed edges; `mermaid` or `d2` is convenient for source-controlled sketches. These renderers do not enforce Yourdon/DeMarco or Gane–Sarson symbol semantics, so state the chosen profile in a legend or title. Preserve the user’s renderer choice.

## Review

- Is the diagram level and system boundary explicit?
- Does every process have at least one input and output, unless it is an intentional source/sink?
- Are all flows named with data, not vague verbs such as “handles”?
- Are stores and external entities distinct from processes?
- Are decomposed diagrams balanced and are sensitive/trust-crossing flows visible?

## Prior art and limitations

Use the [NIST glossary definition of a data-flow diagram](https://csrc.nist.gov/glossary/term/data_flow_diagram) as a government-domain anchor, and document the selected notation profile. DFD notation has multiple historical conventions; there is no single current ISO visual interchange standard implemented by the available renderers.

SVG output should meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) non-text contrast and text alternatives. A future integration could add a profile-aware DFD renderer or interchange validator for Yourdon–DeMarco and Gane–Sarson symbols.
