import bpmn from '../../ci/tests/diagrams/example.bpmn?raw'
import bytefield from '../../ci/tests/diagrams/bytefield.bf?raw'
import d2 from '../../ci/tests/diagrams/connections.d2?raw'
import dbml from '../../ci/tests/diagrams/dbml.dbml?raw'
import diagramsnet from '../../ci/tests/diagrams/diagramsnet-venn.xml?raw'
import ditaa from '../../ci/tests/diagrams/components.ditaa?raw'
import erd from '../../ci/tests/diagrams/schema.erd?raw'
import excalidraw from '../../ci/tests/diagrams/venn.excalidraw?raw'
import goat from '../../ci/tests/diagrams/components.goat?raw'
import nomnoml from '../../ci/tests/diagrams/pirate.nomnoml?raw'
import nwdiag from '../../ci/tests/diagrams/network.diag?raw'
import packetdiag from '../../ci/tests/diagrams/packet.diag?raw'
import pikchr from '../../ci/tests/diagrams/diamond.pikchr?raw'
import rackdiag from '../../ci/tests/diagrams/rack.diag?raw'
import svgbob from '../../ci/tests/diagrams/cloud.bob?raw'
import symbolator from '../../ci/tests/diagrams/component.sv?raw'
import tikz from '../../ci/tests/diagrams/periodic-table.tex?raw'
import umlet from '../../ci/tests/diagrams/umlet.xml?raw'
import vega from '../../ci/tests/diagrams/bar-chart.vega?raw'
import vegalite from '../../ci/tests/diagrams/discretizing-scale.vlite?raw'
import wavedrom from '../../ci/tests/diagrams/wavedrom.json5?raw'
import wireviz from '../../ci/tests/diagrams/wireviz.yaml?raw'
import { DEFAULT_SOURCE } from './state.js'

const EXAMPLES = {
  // Narrative formats share one story: Alice and Bob are building Tandem, a
  // tiny shared to-do app, with help from Alice Agent and Bob Agent.
  plantuml: DEFAULT_SOURCE,
  mermaid: `flowchart LR
  Alice([Alice]) -->|describes the shared list| AliceAgent["Alice Agent"]
  AliceAgent -->|drafts the experience| Tandem["Tandem App"]
  Bob([Bob]) -->|reviews the plan| BobAgent["Bob Agent"]
  BobAgent -->|builds and tests the API| Tandem
  Tandem -->|keeps tasks in sync| Alice
  Tandem -->|keeps tasks in sync| Bob`,
  graphviz: `digraph Tandem {
  rankdir=LR
  node [shape=box, style="rounded,filled", fillcolor="#eef2ff"]
  Alice [shape=oval, fillcolor="#fef3c7"]
  Bob [shape=oval, fillcolor="#dcfce7"]
  AliceAgent [label="Alice Agent"]
  BobAgent [label="Bob Agent"]
  Tandem [label="Tandem App", fillcolor="#ddd6fe"]
  Alice -> AliceAgent [label="shares an idea"]
  AliceAgent -> Tandem [label="proposes the flow"]
  Bob -> BobAgent [label="asks for an API"]
  BobAgent -> Tandem [label="ships + tests"]
  Tandem -> { Alice Bob } [label="syncs tasks"]
}`,
  c4plantuml: `@startuml
!include <C4/C4_Context>

Person(alice, "Alice", "Plans the product and creates shared tasks")
Person(bob, "Bob", "Builds the app and completes shared tasks")
System(aliceAgent, "Alice Agent", "Turns Alice's ideas into product flows")
System(bobAgent, "Bob Agent", "Implements and tests Bob's changes")
System(tandem, "Tandem App", "A tiny shared to-do list")

Rel(alice, aliceAgent, "Explains what friends need")
Rel(aliceAgent, tandem, "Proposes task flows")
Rel(bob, bobAgent, "Requests implementation help")
Rel(bobAgent, tandem, "Builds and verifies")
Rel(alice, tandem, "Creates tasks")
Rel(bob, tandem, "Completes tasks")
@enduml`,
  blockdiag: `blockdiag {
  orientation = portrait
  Alice -> "Alice Agent" -> "Tandem App";
  Bob -> "Bob Agent" -> "Tandem App";
  "Tandem App" -> "Shared task list";

  Alice [color = "#fde68a"];
  Bob [color = "#bbf7d0"];
  "Alice Agent" [color = "#bfdbfe"];
  "Bob Agent" [color = "#bfdbfe"];
  "Tandem App" [color = "#ddd6fe"];
  "Shared task list" [color = "#fecdd3"];
}`,
  seqdiag: `seqdiag {
  Alice; "Alice Agent"; "Tandem App"; "Bob Agent"; Bob;
  Alice -> "Alice Agent" [label = "Sketch our shared errands"];
  "Alice Agent" -> "Tandem App" [label = "Create task: Buy paint"];
  "Tandem App" -> "Bob Agent" [label = "Task assigned to Bob"];
  "Bob Agent" -> Bob [label = "Offer a reminder"];
  Bob -> "Tandem App" [label = "Mark task complete"];
  "Tandem App" -> Alice [label = "List synced"];
}`,
  actdiag: `actdiag {
  describe -> shape -> implement -> verify -> share

  lane Alice {
    label = "Alice"
    describe [label = "Describe shared tasks"];
    share [label = "Try Tandem with Bob"];
  }
  lane "Alice Agent" {
    shape [label = "Shape the task flow"];
  }
  lane "Bob Agent" {
    implement [label = "Build Tandem"];
    verify [label = "Test task sync"];
  }
}`,
  structurizr: `workspace "Tandem" "Alice and Bob build a shared to-do app with their agents" {
  model {
    alice = person "Alice" "Plans Tandem and creates tasks"
    bob = person "Bob" "Builds Tandem and completes tasks"
    aliceAgent = softwareSystem "Alice Agent" "Shapes Alice's ideas into product flows"
    bobAgent = softwareSystem "Bob Agent" "Implements and tests Bob's changes"
    tandem = softwareSystem "Tandem App" "Keeps Alice and Bob's tasks in sync"

    alice -> aliceAgent "Describes the experience"
    aliceAgent -> tandem "Proposes task flows"
    bob -> bobAgent "Requests implementation help"
    bobAgent -> tandem "Builds and tests"
    alice -> tandem "Creates tasks"
    bob -> tandem "Completes tasks"
  }
  views {
    systemLandscape "TandemLandscape" {
      include *
      autolayout lr
    }
    theme default
  }
}`,

  // Domain-specific examples stay intact so they remain useful references for
  // packet layouts, hardware, data visualization, wiring, and renderer syntax.
  d2,
  nwdiag,
  packetdiag,
  rackdiag,
  bpmn: bpmn
    .replaceAll('Examine Situation', 'Bob Agent tests Tandem')
    .replaceAll('Things OK?', 'Tests pass?')
    .replaceAll('Notification Sent', 'Alice and Bob share tasks')
    .replaceAll('Error Propagated', 'Alice Agent revises flow')
    .replaceAll('Klaus', 'Alice')
    .replaceAll('Walter', 'Bob'),
  bytefield,
  dbml,
  diagramsnet,
  ditaa,
  erd,
  excalidraw,
  goat,
  nomnoml,
  pikchr,
  svgbob,
  symbolator,
  tikz,
  umlet,
  vega,
  vegalite,
  wavedrom,
  wireviz,
}

export function exampleFor(type) {
  return EXAMPLES[type] ?? DEFAULT_SOURCE
}
