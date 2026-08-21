---
name: container-diagram
description: Show the major deployable or runtime containers inside one software system and how they collaborate.
---

# Container diagram

## What it tells

A container diagram opens one system boundary by one level. It explains the major applications, services, data stores, and other runtime units, their responsibilities, and their important collaborations.

## Use and boundaries

Use it for solution design, team ownership, technology decisions, integration review, and explaining where data or requests flow. Define “container” as a separately runnable or deployable unit in the chosen context; do not confuse it with an operating-system container. Avoid classes, functions, cloud-product inventories, or host topology unless they are the explicit story; use component or deployment views for those.

## Method

Begin with a system context and retain only its boundary-relevant actors/dependencies. For each container state its responsibility and, when useful, technology. Draw the smallest set of collaborations needed to answer the question, label edges with action/data/protocol, and distinguish synchronous from asynchronous paths. Include data stores as containers when persistence matters. If a service is actually a team boundary or a deployment unit, say which interpretation is being used.

## Renderer routing

Keep the user's renderer choice. Prefer `structurizr` when containers share a reusable C4 workspace model or `c4plantuml` for a focused view. Use `plantuml` for UML component/deployment hybrids, `mermaid` or `d2` for approachable sketches, and `graphviz` when automatic layout is the main need. Renderer syntax can draw the shapes but cannot guarantee that a box is a C4 container—encode that meaning in labels, legend, and review.

## Style and customization

Use nested system boundaries, consistent container shapes, short responsibility labels, and a small technology annotation. Separate data stores visually without implying a technology that was not chosen. Use line patterns for sync/async or trust, and keep color accessible and nonessential. Provide a focused companion deployment view when physical placement matters.

## Review

Check that every container has a responsibility, the system boundary is visible, collaborations are directional and labeled, technology details are not mistaken for responsibilities, and the level does not mix classes or infrastructure resources. Test readability at the delivery size and in grayscale. Confirm that the diagram answers one question rather than becoming an inventory.

## Prior art and limits

This uses the C4 container concept, which is notation-independent. C4 PlantUML provides macros, not a formal model interchange format. UML component/deployment views, ArchiMate, and SysML can provide formal semantics, but diagram.zip currently lacks dedicated profile-enforced ArchiMate/SysML sources; integration would be needed for those standards. See [C4 diagrams](https://c4model.com/diagrams), [C4 notation](https://c4model.com/diagrams/notation), [OMG UML](https://www.omg.org/spec/UML/2.5.1/), [ArchiMate overview](https://www.opengroup.org/archimate-forum/archimate-overview), and [OMG SysML](https://www.omg.org/sysml/).
