---
name: network-topology
description: Document physical or logical networks with nodes, interfaces, links, segments, addressing, trust zones, and traffic boundaries.
---

# Network topology

## Select this skill when

Use this skill when the story is connectivity: which devices or services attach to which network, how traffic can flow, where trust boundaries sit, or how a physical installation is wired. State whether the view is physical, logical, or both.

Avoid it for application call dependencies (use dependency-graph), packet field layout (use protocol-layout-diagram), rack-unit placement (use rack-diagram), or a general system context. Do not use a topology map to imply that an application call is permitted merely because two nodes share a segment.

## Story and semantic model

Name the scope, observation time, and layer. Identify devices, interfaces, links, network segments, address ranges, VLANs, zones, gateways, and trust boundaries as appropriate. Define link direction and capacity only when known.

- Distinguish physical links from logical adjacencies, tunnels, overlays, and routes.
- Label interfaces or endpoints when a device has multiple connections.
- Show layer-3 prefixes and layer-2 segments separately; do not conflate an IP range with a broadcast domain.
- Mark ingress/egress, filtering devices, and trust boundaries with explicit labels.
- Treat cloud and external networks as boundaries with ownership and assumptions, not as opaque decorative clouds.

For a change review, highlight the affected path and annotate source-of-truth evidence. For incident response, show observed state and timestamp rather than presenting an intended design as fact.

## Layout and styling

Use nested containers for sites, zones, or segments. Arrange traffic flow consistently (left-to-right or top-to-bottom), keep gateways at boundaries, and attach labels close to interfaces. Use shape for device class and line style for physical/logical/tunnel links. Use color for trust or operational status only with a legend and a text fallback.

Include a legend for abbreviations, link semantics, and address notation. Avoid unlabeled line crossings; if a link crosses a boundary, make the crossing explicit.

## Renderer routing

Preserve an explicit renderer choice. Otherwise prefer:

- `nwdiag` for network blocks, hosts, addresses, and shared segments.
- `d2` for custom logical/physical topology with containers and annotations.
- `graphviz` for topology-as-graph or route-focused views.
- `mermaid` for a small Markdown-friendly network map.
- `diagramsnet` for manually positioned physical topology documentation.

`nwdiag` is convenient but does not express every routing, security-policy, or vendor-device semantic. diagram.zip does not discover devices, test reachability, or validate IP plans. If the user requires import/export to a network-management or vendor topology format, live inventory integration, or formal path-policy validation, call that an unsupported integration opportunity.

## Review checklist

Check that scope, layer, timestamp, and ownership are stated. Verify every link has endpoints and a defined meaning, every segment has a boundary, and addresses are not invented. Confirm that physical and logical relationships are not visually conflated. Review the highlighted path against current source-of-truth data and test the final diagram at print or incident-room size.

## Standards and prior art

RFC 2360 documents conventions for Internet protocol documentation and packet/network figures: <https://www.rfc-editor.org/rfc/rfc2360>. ISO/IEC 27001 and 27002 provide information-security control context for network zones and access boundaries, but do not prescribe a single topology notation: <https://www.iso.org/isoiec-27001-information-security.html>.

Network topology notation is largely operational prior art rather than one universal exchange standard. Declare the layer and legend. For formal network configuration or topology exchange, diagram.zip currently has no dedicated NETCONF/YANG, vendor NMS, or inventory adapter; that is an integration opportunity.
