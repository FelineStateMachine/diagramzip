---
id: create-dbml
slug: /create/types/dbml
title: DBML
description: Create a DBML diagram in diagram.zip.
sidebar_label: DBML
---

import DiagramExample from '@site/src/components/DiagramExample';

# DBML

DBML creates database schemas from tables, fields, enums, indexes, and references.

## Use this type

Use DBML to document relational data models with a concise schema language.

## Source format

The source format is **Database Markup Language**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Declare a table with a `Table` block.
- Declare one field on each line.
- Put field settings in square brackets.
- Use `Ref` to define a relationship.

### Example

```sql
Table users {
  id integer [primary key]
  name varchar
}

Table diagrams {
  id integer [primary key]
  user_id integer
}

Ref: diagrams.user_id > users.id
```

<DiagramExample engine="dbml" label="DBML" sourceUrl="/examples/dbml.json" />

## Related pages

- [Style DBML](/style/types/dbml)
- [General presentation settings](/style/presentation)
- [Open DBML in the editor](https://diagram.zip/?type=dbml)

## Upstream reference

[DBML documentation](https://dbml.dbdiagram.io/docs/)
