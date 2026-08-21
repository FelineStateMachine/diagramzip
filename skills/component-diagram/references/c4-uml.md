# C4 and UML profiles

- [C4 diagrams](https://c4model.com/diagrams) and [C4 notation](https://c4model.com/diagrams/notation): C4 uses context, container, component, and code views to progressively explain software architecture. Treat “component” as a zoom level and state the boundary.
- [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/): the UML Component and Composite Structures chapters define components, provided/required interfaces, ports, connectors, and collaborations. Use those concepts when interface semantics matter; do not imply formal UML conformance from a rendered sketch.

The supported renderer choices are syntax-level choices: PlantUML, Mermaid, D2, Graphviz, BlockDiag, and C4 PlantUML are available in diagram.zip. They differ in layout and notation fidelity; preserve the user’s choice and explain any loss of interface/port semantics.
