import bpmn from '../../../examples/diagrams/example.bpmn?raw'
import bytefield from '../../../examples/diagrams/bytefield.bf?raw'
import d2 from '../../../examples/diagrams/connections.d2?raw'
import dbml from '../../../examples/diagrams/dbml.dbml?raw'
import diagramsnet from '../../../examples/diagrams/diagramsnet-venn.xml?raw'
import erd from '../../../examples/diagrams/schema.erd?raw'
import excalidraw from '../../../examples/diagrams/excalidraw.excalidraw?raw'
import goat from '../../../examples/diagrams/components.goat?raw'
import nomnoml from '../../../examples/diagrams/pirate.nomnoml?raw'
import nwdiag from '../../../examples/diagrams/network.diag?raw'
import packetdiag from '../../../examples/diagrams/packet.diag?raw'
import pikchr from '../../../examples/diagrams/diamond.pikchr?raw'
import rackdiag from '../../../examples/diagrams/rack.diag?raw'
import svgbob from '../../../examples/diagrams/cloud.bob?raw'
import symbolator from '../../../examples/diagrams/component.sv?raw'
import tikz from '../../../examples/diagrams/tikz.tex?raw'
import umlet from '../../../examples/diagrams/umlet.xml?raw'
import vega from '../../../examples/diagrams/bar-chart.vega?raw'
import vegalite from '../../../examples/diagrams/discretizing-scale.vlite?raw'
import wavedrom from '../../../examples/diagrams/wavedrom.json5?raw'
import wireviz from '../../../examples/diagrams/wireviz.yaml?raw'
import { diagramTypes } from './diagram-types.js'
import { defaultExampleAppearance, exampleVariant } from './example-variants.js'
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
  ditaa: `+-------------+                       +-------------+
|             |                       |             |
|    Alice    |                       |     Bob     |
|             |                       |             |
+------+------+                       +------+------+
       | product idea                        | implementation
       v                                     v
+------+------+                       +------+------+
|             |                       |             |
| Alice Agent |                       |  Bob Agent  |
|             |                       |             |
+------+------+                       +------+------+
       | task flow                           | tested build
       |                                     |
       +------------------+   +--------------+
                          |   |
                          v   v
                   +------+---+------+
                   |                 |
                   |   Tandem App    |
                   |                 |
                   +--------+--------+
                            |
                            | persist and sync
                            v
                   +--------+--------+
                   |  Shared Tasks   |
                   |                 |
                   +-----------------+`,

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

const EXAMPLE_CONTEXT = {
  plantuml: ['Tandem task sync', 'Alice and Bob coordinate shared tasks through their agents.'],
  mermaid: ['Shared task flow', 'A compact view of ideas moving through the Tandem team.'],
  graphviz: ['Tandem collaboration graph', 'People and agents converge on one synchronized task list.'],
  d2: ['Connection styles', 'D2 connection, arrowhead, shape, and animation syntax.'],
  c4plantuml: ['Tandem system context', 'The people and software systems surrounding Tandem.'],
  blockdiag: ['Tandem block flow', 'A block-oriented view of the shared task workflow.'],
  seqdiag: ['Tandem task sequence', 'A task moves from Alice to Bob and back through Tandem.'],
  actdiag: ['Tandem delivery activities', 'Work crosses Alice, Alice Agent, and Bob Agent lanes.'],
  nwdiag: ['Network layout', 'A sample network topology and its connected address ranges.'],
  packetdiag: ['TCP packet structure', 'The bit-level layout of a TCP packet header.'],
  rackdiag: ['Rack layout', 'A sample equipment rack rendered from rackdiag syntax.'],
  bpmn: ['Agent-assisted review', 'A BPMN review flow that branches on test results.'],
  bytefield: ['Byte field layout', 'A compact byte-oriented protocol field example.'],
  dbml: ['Database schema', 'Tables and relationships expressed with DBML.'],
  diagramsnet: ['Venn diagram', 'An overlapping-set example imported from diagrams.net.'],
  ditaa: ['Tandem ASCII architecture', 'An ASCII sketch becomes a rendered system diagram.'],
  erd: ['Data model', 'Entities and relationships in a small relational schema.'],
  excalidraw: ['Venn sketch', 'A hand-drawn overlapping-set diagram.'],
  goat: ['Component shapes', 'GoAT exercises boxes, connectors, curves, and symbols.'],
  nomnoml: ['Pirate class diagram', 'A playful class diagram demonstrating Nomnoml syntax.'],
  pikchr: ['Cardinal points', 'A diamond marks north, east, south, and west.'],
  structurizr: ['Tandem landscape', 'A software landscape linking people, agents, and Tandem.'],
  svgbob: ['Cloud network', 'An ASCII cloud connects clients and services.'],
  symbolator: ['Hardware component', 'A component symbol generated from interface declarations.'],
  tikz: ['Periodic table', 'A color-coded periodic table rendered with TikZ.'],
  umlet: ['UML example', 'A UMLet document rendered directly from its XML form.'],
  vega: ['Bar chart', 'A declarative bar chart expressed with Vega.'],
  vegalite: ['Discretizing scale', 'A Vega-Lite example comparing discretized values.'],
  wavedrom: ['Timing diagram', 'Digital signals and timing relationships rendered by WaveDrom.'],
  wireviz: ['Wiring harness', 'Connections, cables, and pins described with WireViz.'],
}

export function exampleFor(type) {
  return EXAMPLES[type] ?? DEFAULT_SOURCE
}

export function exampleStateFor(type) {
  const index = diagramTypes.findIndex(diagramType => diagramType.id === type)
  const [title, description] = EXAMPLE_CONTEXT[type] ?? ['Diagram example', 'A diagram.zip catalog example.']
  const variant = exampleVariant(Math.max(index, 0), { title, description })
  return {
    type,
    source: exampleFor(type),
    options: {},
    ...variant,
    presentation: {
      ...variant.presentation,
      appearance: defaultExampleAppearance(type),
    },
  }
}
