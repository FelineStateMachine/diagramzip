---
name: class-diagram
description: Create or review class diagrams that explain types, responsibilities, contracts, and structural relationships in an object-oriented or domain model.
---

# Class diagram

## Select this skill when

Use this skill when the story is about named types and their structural relationships: attributes, operations, inheritance, interfaces, composition, aggregation, or dependencies. Use it for a design contract, domain model, API shape, or a focused explanation of one subsystem.

Avoid it when the main story is runtime order (use a sequence or activity diagram), deployment topology (use deployment or network-topology), relational tables (use entity-relationship-diagram), or a graph whose nodes are not types (use dependency-graph).

## Story and semantic model

Start with the question the reader must answer: “What are the important types, what do they own, and how may they collaborate?” Name the abstraction level in the title. Keep the diagram to one coherent boundary and show only members that support the story.

Use UML semantics deliberately:

- A class has identity and may show attributes and operations; an interface describes a contract.
- Generalization means “is a”; realization means “implements the contract”; dependency means “uses”.
- Composition means the part’s lifecycle is owned by the whole; aggregation is weaker and should be used sparingly.
- Label associations with role names, navigability, and multiplicities when they matter. Do not imply lifecycle or cardinality merely with a line.
- Prefer explicit relationship labels over relying on arrow glyphs that vary by renderer.

Object diagrams are a useful companion when the reader needs one concrete runtime snapshot. Keep that as a reference view rather than mixing instances and classifiers in the same primary diagram.

## Layout and styling

Use a consistent reading direction, group types by bounded context or package, and place the most important contract near the center. Keep inheritance vertical where possible and route cross-group dependencies around the outside. Show public API members first; omit private implementation details unless they explain a constraint.

Use restrained color for roles or packages, not for every class. Make interface, abstract, external, and deprecated status available through shape, stereotype, or text as well as color. Use high-contrast text and never make a dashed/solid distinction the only encoding.

## Renderer routing

Preserve an explicit renderer choice from the user. Otherwise prefer:

- `plantuml` for expressive UML, relationships, members, and mature styling.
- `mermaid` for a lightweight Markdown-friendly class view.
- `c4plantuml` only when the class view is actually a component-level C4 view; it is not a general UML class renderer.
- `graphviz` or `d2` for a dependency-shaped type graph when UML notation is unnecessary.
- `diagramsnet` when the user needs hand-positioned, editable shapes.

Check the local renderer catalog before promising syntax or export behavior. Renderer support is not semantic validation: diagram.zip cannot guarantee that a source expresses valid UML merely because it renders.

## Review checklist

Check that every arrow has a sentence meaning, multiplicities are intentional, ownership is not overstated, and the abstraction level is consistent. Remove orphan types, duplicate concepts, and members that do not support the stated question. Test the diagram at its final reading size and verify that a grayscale or non-color reading still works.

## Standards and prior art

The baseline is OMG UML 2.5.1, especially Class, Interface, Generalization, Realization, Dependency, and Association semantics: <https://www.omg.org/spec/UML/2.5.1/>. UML is a vocabulary, not a mandate to show every member or relationship.

The object-diagram companion is also defined by UML, but diagram.zip currently has no dedicated object-diagram skill. A future skill could add instance identity, slots, links, and snapshot review rules. If a user requires machine-valid UML interchange or complete XMI round-tripping, that is an unsupported integration opportunity rather than a promise of this skill.
