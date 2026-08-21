---
name: gantt-chart
description: Use when the user needs a time-scaled schedule showing tasks, durations, dependencies, milestones, and progress across teams or workstreams.
---

# Gantt chart

## What and why

A Gantt chart tells the scheduling story: work packages occupy intervals on a calendar, and dependencies constrain when work can happen. It is useful for delivery plans, migrations, launches, and maintenance windows.

Choose it for planned work over time. Avoid it for an event history (timeline), a process’s logical steps without dates (flowchart), or a personal experience over stages (user-journey-map).

## How

1. Establish a calendar, timezone, working-day policy, and status date.
2. Decompose deliverables into tasks with owners, start/finish or duration, and a definition of done.
3. Add only meaningful dependencies; distinguish finish-to-start from other relationships when supported.
4. Mark milestones as zero-duration outcomes, not decorative dates. Show progress with a legend and a clear as-of date.
5. Keep the critical path or key release gates visible; move low-value detail to a linked plan.

## Story and styling

Order rows by deliverable or dependency flow. Use neutral bars for planned work, a distinct overlay for completed work, and one accent for gates or risk. Never use color alone for status. Include weekends/holidays and baseline variance only if they inform the decision.

If no renderer is specified, use `mermaid` for a compact source-controlled schedule. `plantuml` can represent Gantt charts in its supported syntax; `graphviz` and `d2` require modeling a schedule manually and are poor defaults. Preserve an explicit renderer choice. Renderers do not replace a scheduling engine: validate dates, dependencies, and resource constraints before drawing.

## Review

- Is the as-of date, calendar, and timezone visible?
- Does each task have an owner, outcome, and realistic duration?
- Are dependencies meaningful and free of cycles?
- Are milestones outcomes and progress semantics unambiguous?
- Does the chart distinguish plan, actual, baseline, and uncertainty?

## Prior art and limitations

Use project-scheduling vocabulary from [ISO 21502:2020](https://www.iso.org/standard/74947.html) and dependency concepts from [PMI’s Practice Standard for Scheduling](https://www.pmi.org/pmbok-guide-standards/practice-guides/scheduling). These sources guide the planning model; they do not prescribe one SVG notation.

The available renderers do not calculate critical paths, resource leveling, calendars, or earned value. Integration with a scheduling model/validator would be needed for authoritative planning rather than presentation-only charts.
