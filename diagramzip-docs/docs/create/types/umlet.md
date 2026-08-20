---
id: create-umlet
slug: /create/types/umlet
title: UMLet
description: Create an UMLet diagram in diagram.zip.
sidebar_label: UMLet
---

import DiagramExample from '@site/src/components/DiagramExample';

# UMLet

UMLet renders UML elements from a UXF XML document.

## Use this type

Use UMLet when UMLet is the source editor for the diagram.

## Source format

The source format is **UMLet UXF XML**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use a `diagram` root element.
- Put each diagram item in a `element` block.
- Use `coordinates` to set position and size.
- Use `panel_attributes` for labels and element settings.

### Source structure

This source shows the document structure. It is not a complete document.

```xml
<diagram program="umlet">
  <element>
    <id>UMLClass</id>
    <coordinates><x>20</x><y>20</y><w>160</w><h>80</h></coordinates>
    <panel_attributes>User</panel_attributes>
  </element>
</diagram>
```

The rendered view uses a complete project example for this diagram type.

<DiagramExample engine="umlet" label="UMLet" sourceUrl="/examples/umlet.json" />

## Related pages

- [Style UMLet](/style/types/umlet)
- [General presentation settings](/style/presentation)
- [Open UMLet in the editor](https://diagram.zip/?type=umlet)

## Upstream reference

[UMLet documentation](https://www.umlet.com/)
