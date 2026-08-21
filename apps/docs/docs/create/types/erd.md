---
id: create-erd
slug: /create/types/erd
title: ERD
description: Create an ERD diagram in diagram.zip.
sidebar_label: ERD
---

import DiagramExample from '@site/src/components/DiagramExample';

# ERD

ERD creates entity-relationship diagrams from entities, attributes, and cardinalities.

## Use this type

Use ERD for compact relational models and domain data models.

## Source format

The source format is **ERD text**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Put an entity name in square brackets.
- Put each attribute below its entity.
- Use `*` for a key attribute.
- Use a relationship line with cardinality markers.

### Example

```text
[User]
*id
name

[Diagram]
*id
+user_id

[User] 1--* [Diagram]
```

The rendered view uses a complete project example for this diagram type.

<DiagramExample engine="erd" label="ERD" sourceUrl="/examples/erd.json" />

## Related pages

- [Style ERD](/style/types/erd)
- [General presentation settings](/style/presentation)
- [Open ERD in the editor](https://diagram.zip/?type=erd)

## Upstream reference

[ERD documentation](https://github.com/BurntSushi/erd)
