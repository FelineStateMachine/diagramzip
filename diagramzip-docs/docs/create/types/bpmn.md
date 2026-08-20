---
id: create-bpmn
slug: /create/types/bpmn
title: BPMN
description: Create a BPMN diagram in diagram.zip.
sidebar_label: BPMN
---

import DiagramExample from '@site/src/components/DiagramExample';

# BPMN

BPMN renders a BPMN 2.0 process definition from XML.

## Use this type

Use BPMN for formal business processes, decisions, events, tasks, and message flows.

## Source format

The source format is **BPMN 2.0 XML**. Enter the source in the diagram.zip editor.

## Syntax essentials

- Use a BPMN `definitions` root element.
- Put process elements in a `process` element.
- Give each referenced element a unique ID.
- Include diagram interchange data when the XML must define positions.

### Source structure

This source shows the document structure. It is not a complete document.

```xml
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_1">
    <bpmn:startEvent id="Start" />
    <bpmn:task id="Create" name="Create diagram" />
    <bpmn:endEvent id="End" />
  </bpmn:process>
</bpmn:definitions>
```

The rendered view uses a complete project example for this diagram type.

<DiagramExample engine="bpmn" label="BPMN" sourceUrl="/examples/bpmn.json" />

## Related pages

- [Style BPMN](/style/types/bpmn)
- [General presentation settings](/style/presentation)
- [Open BPMN in the editor](https://diagram.zip/?type=bpmn)

## Upstream reference

[BPMN documentation](https://www.omg.org/spec/BPMN/2.0/)
