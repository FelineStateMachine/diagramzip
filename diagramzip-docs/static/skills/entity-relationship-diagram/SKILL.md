---
name: entity-relationship-diagram
description: Model persistent data with entities, attributes, keys, relationships, cardinality, optionality, and integrity boundaries using an entity-relationship diagram.
---

# Entity-relationship diagram

## Select this skill when

Use this skill when the story is how data is stored and related: entities, identifying keys, foreign keys, cardinality, optionality, normalization, or schema ownership. Use it before writing SQL when a team needs to agree on the data model.

Avoid it for service calls and runtime behavior (use data-flow or sequence), software types (use class-diagram), or a generic dependency graph. A physical schema diagram may include indexes and column types, but do not let implementation detail obscure the conceptual model.

## Story and semantic model

State whether the view is conceptual, logical, or physical. Name entities with stable singular nouns, attributes with domain terms, and identifiers explicitly. For each relationship, answer: can each side exist without the other, how many are allowed, and what identifies the relationship?

- Mark primary keys and candidate keys; distinguish a surrogate identifier from a meaningful natural key.
- Show foreign-key mappings in a logical or physical view, but do not infer them from similarly named columns.
- Use associative entities for many-to-many relationships when the relationship has attributes or needs independent lifecycle.
- Represent optionality and cardinality explicitly. “One or more” and “zero or one” are different constraints.
- Note temporal, tenant, uniqueness, and deletion rules when they change the interpretation of the model.

Keep a conceptual ERD free of storage-engine choices. In a physical view, include types, indexes, and constraints only when they answer the audience’s question.

## Layout and styling

Place the central business entities in the middle, group entities by bounded context or ownership, and route relationship lines to minimize crossings. Use a stable key/attribute order and consistent notation (crow’s foot, Chen, or another declared profile).

Use color to distinguish ownership or lifecycle, never to encode cardinality alone. Show key and constraint symbols in text or shape as well. If the renderer cannot express the chosen notation, add a legend and use labels rather than silently changing semantics.

## Renderer routing

Preserve an explicit renderer choice. Otherwise prefer:

- `dbml` for a compact physical/logical relational schema with tables, fields, indexes, and references.
- `mermaid` for a shareable ER view in Markdown-oriented workflows.
- `plantuml` for richer entity notation and explanatory annotations.
- `graphviz` or `d2` for a custom data relationship graph when strict ER notation is not required.
- `diagramsnet` for manually arranged, editable database documentation.

`dbml` describes relational structure but does not by itself establish a universal conceptual ER notation. Validate that the selected renderer can show keys, nullability, and cardinality required by the story. diagram.zip renders source; it does not connect to a live database or verify that a schema matches production.

## Review checklist

Check every entity has an identifier or an explicit reason it does not. Check every relationship has both endpoint constraints, no many-to-many relationship is accidental, and optionality is stated. Look for duplicated facts, transitive dependencies, ambiguous names, and ownership rules missing from the model. Review conceptual and physical views separately when both are needed.

## Standards and prior art

Use ISO/IEC 11179 terminology for data-element naming and metadata where a governance context requires it: <https://www.iso.org/standard/35343.html>. For relational implementation, the SQL standard is the authority for constraints, but vendor DDL adds behavior not represented by a generic ERD.

Crow’s-foot notation is common practice rather than one single universally controlling interchange standard. Declare the notation in a legend. If the user requires a formally exchangeable conceptual model (for example, a vendor-specific modeling repository format), diagram.zip has no dedicated interchange validator; that is an integration opportunity.
