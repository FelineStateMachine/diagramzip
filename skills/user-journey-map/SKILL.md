---
name: user-journey-map
description: Use when the user needs to understand a person’s experience across stages, touchpoints, actions, thoughts, emotions, pain points, and opportunities.
---

# User-journey map

## What and why

A user-journey map tells the experience story from a specific persona’s point of view across a goal-driven journey. It makes moments of friction, uncertainty, and opportunity visible to product and service teams.

Choose it for experience discovery and service improvement. Avoid it for a technical request sequence (sequence-diagram), a dated delivery plan (gantt-chart), or a generic process with no user perspective (flowchart).

## How

1. Name the persona, situation, goal, scope, and journey start/end. State whether evidence is observed, reported, or hypothesized.
2. Choose 4–8 stages that follow the user’s mental model, not internal team ownership.
3. For each stage capture user actions, touchpoints/channels, questions or thoughts, emotional state, pain points, and opportunities.
4. Add backstage dependencies only in a separate lane so the user’s experience remains primary.
5. Rank opportunities by evidence, impact, and feasibility; do not turn an empathy map into unsupported demographic claims.

## Story and styling

Use stages as columns and experience dimensions as rows. Keep the persona and goal prominent, and use a small, labeled emotional curve only when it is evidence-based. Use icons sparingly, ensure labels carry meaning, and encode pain/opportunity with text plus shape or pattern—not color alone.

If no renderer is specified, use `mermaid` for a simple journey/timeline-like layout or `diagramsnet` when the user needs a hand-arranged workshop canvas. `plantuml` can produce a structured activity-style approximation, but no available renderer is a dedicated journey-map model. Preserve an explicit renderer choice and explain any approximation.

## Review

- Is one persona, goal, and journey boundary explicit?
- Are stages based on user behavior and evidence rather than org-chart phases?
- Are touchpoints, backstage causes, pain, and opportunities distinguishable?
- Are emotions framed as evidence or hypotheses?
- Can a decision-maker see the next opportunity and its rationale?

## Prior art and limitations

Use the journey-mapping practice described by [Nielsen Norman Group](https://www.nngroup.com/articles/journey-mapping-101/) and service-design principles in [ISO 9241-210:2019](https://www.iso.org/standard/77520.html). These are guidance for research and communication, not a machine-readable interchange standard.

The supported renderers do not encode research provenance, accessibility of workshop artifacts, or prioritization semantics. A dedicated journey-map schema with evidence and opportunity fields would be a worthwhile integration opportunity.
