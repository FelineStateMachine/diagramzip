---
name: rack-diagram
description: Use when documenting equipment placement in a cabinet or rack, including rack units, device identity, power, network uplinks, and physical capacity.
---

# Rack diagram

## What it is

A rack diagram is a vertical physical inventory view. It tells the reader what occupies each rack unit, where blanking panels and shared equipment are, and how to identify or service the installed hardware.

## Choose it when

- operations, facilities, installation, maintenance, or capacity planning depends on physical rack position;
- a cabinet contains servers, switches, patch panels, PDUs, UPS units, shelves, or reserved space;
- the reader needs a fast unit-by-unit inventory rather than a logical topology.

Pair it with a network-topology diagram for logical links and a deployment diagram for software placement. Do not infer power, airflow, cable path, or network connectivity from vertical adjacency alone.

## Story and modeling

1. Name the site, room, cabinet, face (front/rear), orientation, and rack-unit numbering direction.
2. Show total usable U height and every occupied, reserved, and intentionally blank unit. Represent multi-U devices at their actual height.
3. Label each device with asset/service identity, model or role, and U range. Use a legend for shared devices, patch panels, PDUs, and blanking panels.
4. Add power feeds, cable management, airflow direction, and rear-view details only when they are in scope; distinguish planned, installed, and decommissioned equipment.
5. Include revision/date and an authoritative inventory reference. A rack drawing is not an asset database.

## Styling and customization

Use a stable visual grammar: one unit grid, consistent device height, strong cabinet boundaries, and restrained colors by equipment role. Use labels and symbols in addition to color. Keep identifiers legible at print scale, and use callouts for dense front/rear cabling rather than crossing the rack body with wires.

## Renderer routing

- `rackdiag` is the direct diagram.zip fit and preserves rack-unit placement and device height.
- `diagramsnet` is appropriate when a facilities team needs to edit a native physical-layout document.
- `diagramsnet` or `tikz` can support bespoke front/rear views, airflow arrows, or detailed cable callouts.
- `nwdiag` shows network segments, not physical cabinet placement; pair it when logical connectivity matters.

Preserve the user's explicit renderer choice. If no renderer is specified, choose `rackdiag` for an inventory-style rack and explain what it cannot represent. diagram.zip does not currently ingest DCIM/CMDB inventories, validate U conflicts, or model thermal/power budgets. Importing an authoritative inventory and checking occupied-unit, power, and airflow constraints would be a meaningful integration opportunity.

## Review checklist

- Are cabinet identity, face, orientation, and U numbering explicit?
- Do device heights and U ranges avoid overlap and fit the cabinet?
- Are blank, reserved, planned, and decommissioned units distinguished?
- Are asset identity and revision/date present?
- Are power, airflow, and cabling claims backed by source data?
- Is logical connectivity kept separate or clearly linked to another view?

## References

- [RackDiag examples](http://blockdiag.com/en/nwdiag/rackdiag-examples.html) documents the diagram.zip-supported rack-unit source model.
- [ANSI/TIA-606-C](https://www.tiaonline.org/standards/standards-information/) is the telecommunications infrastructure administration and labeling standard; use the licensed standard for authoritative identifier and record requirements.
- [ASHRAE TC 9.9](https://www.ashrae.org/technical-resources/bookstore/datacom-series) provides data-center thermal guidance; a rack drawing should not claim thermal compliance without the applicable facility analysis.
- [Uptime Institute data-center standards](https://uptimeinstitute.com/standards) provides facility-resilience context that is outside the scope of a rack-placement renderer.
