---
name: timeline
description: Use when the user needs to communicate events or milestones in chronological order, with dates, intervals, eras, or parallel tracks.
---

# Timeline

## What and why

A timeline tells a chronological story: what happened, when it happened, and sometimes how parallel strands relate. It is useful for releases, incidents, historical context, migrations, and roadmaps.

Choose it when time is the primary organizing axis. Avoid it for task scheduling with dependencies (gantt-chart), causal process flow (flowchart), or a person’s step-by-step experience (user-journey-map).

## How

1. Choose the time scale and state it: dates, quarters, years, eras, or relative time.
2. Select only events that advance the story; give each an unambiguous date or interval.
3. Use a single track for one narrative and parallel tracks for independent streams. Keep labels short and put detail in notes.
4. Distinguish event, milestone, interval, and uncertainty. Do not imply precision the source does not support.
5. If the timeline is a roadmap, label commitment status separately from chronology.

## Story and styling

Use a strong axis and consistent date formatting. Encode event categories with shape or small color accents, but also label them for color-independent reading. Use whitespace for eras and avoid crossing annotations. For dense timelines, split into views by track or period.

If no renderer is specified, use `mermaid` for its timeline syntax or `d2`/`graphviz` when custom layout is more important. These renderers do not provide a universal temporal data model; validate dates and uncertainty in the source data. Preserve an explicit renderer choice.

## Review

- Is the time scale and direction explicit?
- Are dates, intervals, and uncertain dates represented honestly?
- Can a reader distinguish tracks and event categories without color alone?
- Does every item earn its space in the narrative?
- Are roadmap status and chronological position kept separate?

## Prior art and limitations

For milestone and project communication, align terminology with [ISO 21502:2020](https://www.iso.org/standard/74947.html), while recognizing that a timeline is a communication view rather than a project-control model. For historical chronology, use the source domain’s date conventions and cite the source data.

The supported text renderers do not guarantee date-aware scaling, collision avoidance, or semantic uncertainty encoding. A standards-aware timeline data model and date-scale renderer would be a useful integration opportunity.
