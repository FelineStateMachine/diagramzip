---
name: deployment-diagram
description: Show where software artifacts run, which infrastructure nodes host them, and how runtime communication crosses environments or trust boundaries.
---

# Deployment diagram

## What and why

Use this skill to tell the operational placement story: artifacts or services, execution nodes, environments, networks, and the paths between them. It supports capacity, security, release, and incident discussions. It is not a component dependency map or a rack inventory unless that physical detail is the subject.

## Select or avoid

Select it when location, hosting, environment, connectivity, or redundancy matters. Avoid it when only logical ownership matters (component), when the audience needs business systems (landscape/context), or when exact hardware rack units are the question (rack diagram). Clarify whether “node” means cloud service, VM/container, device, or physical host.

## Modeling method

1. Name the deployment environment and observation time.
2. Define nodes and nested execution environments at a consistent granularity.
3. Place deployable artifacts or services on their host; distinguish replicated, standby, and ephemeral instances.
4. Label connections with protocol, port, direction, trust boundary, and important controls.
5. Show only topology relevant to the decision; add a legend for availability, environment, and security notation.

## Styling and customization

Use nested containers for environments and hosts, and a calm color scheme for production/staging/development. Keep network or trust boundaries visually stronger than ordinary grouping. Use badges for replicas, zones, and managed services; never rely on color alone. Preserve a user-selected renderer; otherwise prefer `structurizr` or `c4plantuml` for C4 deployment views, `plantuml` for UML deployment notation, `mermaid` or `d2` for documentation, and `nwdiag` for network-centric topology.

## Review checklist

- Is the environment/time snapshot explicit?
- Can a reader identify what runs where and what crosses each boundary?
- Are replicas, zones, failure domains, and dependencies represented accurately?
- Are protocols, ports, and trust assumptions labeled when operationally important?
- Does the diagram avoid implying a physical guarantee from a logical cloud abstraction?

## Standards and prior art

See [deployment profiles](references/deployment-profiles.md). UML 2.5.1 defines deployment nodes, artifacts, communication paths, and deployment relationships; C4’s deployment diagrams provide a pragmatic architecture view. diagram.zip renders PlantUML, C4 PlantUML, Mermaid, D2, Graphviz, BlockDiag, and NwDiag, but does not validate a UML model, cloud-provider topology, or security policy. Cloud-provider-native architecture export and formal deployment-model interchange are integration opportunities.
