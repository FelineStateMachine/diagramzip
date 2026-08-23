import { diagramTypes } from './diagram-types.js'

// The launcher is deliberately data-only. Keep this catalog independent from
// the DOM so it can be used by both the initial launcher and the command
// palette without duplicating format metadata.
const GROUP_DEFINITIONS = [
  {
    id: 'flow-sequence',
    label: 'Flow & sequence',
    description: 'Processes, interactions, and timelines.',
    types: ['plantuml', 'mermaid', 'seqdiag', 'actdiag', 'blockdiag', 'bpmn', 'trn'],
  },
  {
    id: 'architecture',
    label: 'Architecture',
    description: 'Systems, components, relationships, and software structure.',
    types: ['c4plantuml', 'structurizr', 'd2', 'graphviz', 'nomnoml', 'umlet'],
  },
  {
    id: 'data-charts',
    label: 'Data & charts',
    description: 'Data models, plots, and technical visualizations.',
    types: ['dbml', 'erd', 'vega', 'vegalite'],
  },
  {
    id: 'network-hardware',
    label: 'Network & hardware',
    description: 'Networks, packets, wiring, and low-level hardware layouts.',
    types: ['nwdiag', 'packetdiag', 'rackdiag', 'bytefield', 'wavedrom', 'symbolator', 'wireviz'],
  },
  {
    id: 'drawing-ascii',
    label: 'Drawing & ASCII',
    description: 'Freeform drawings, markup diagrams, and text-based art.',
    types: ['excalidraw', 'diagramsnet', 'ditaa', 'goat', 'svgbob', 'pikchr', 'tikz'],
  },
]

const DESCRIPTIONS = {
  plantuml: 'Text-based UML and software diagrams.',
  mermaid: 'Markdown-friendly flowcharts and diagrams.',
  graphviz: 'Graphs and relationship diagrams using DOT.',
  d2: 'Declarative diagrams with a modern, readable syntax.',
  c4plantuml: 'C4 architecture diagrams in PlantUML syntax.',
  blockdiag: 'Block and dependency diagrams.',
  seqdiag: 'Simple sequence diagrams.',
  actdiag: 'Activity and process diagrams.',
  nwdiag: 'Network topology diagrams.',
  packetdiag: 'Packet and protocol layout diagrams.',
  rackdiag: 'Rack and infrastructure diagrams.',
  bpmn: 'Business process model and notation diagrams.',
  bytefield: 'Structured byte and protocol field diagrams.',
  dbml: 'Database schemas from DBML.',
  diagramsnet: 'Diagrams.net editable drawings.',
  ditaa: 'ASCII art converted into diagrams.',
  erd: 'Entity-relationship database diagrams.',
  excalidraw: 'Hand-drawn style editable diagrams.',
  goat: 'ASCII-art diagrams using the GoAT syntax.',
  nomnoml: 'UML-style diagrams with a lightweight syntax.',
  pikchr: 'Text-based technical illustrations.',
  structurizr: 'C4 architecture diagrams from a workspace model.',
  svgbob: 'ASCII diagrams rendered as SVG.',
  symbolator: 'HDL and digital logic symbol diagrams.',
  tikz: 'Precise TeX-based technical drawings.',
  trn: 'Tabular recipes with ingredient rows and operation columns.',
  umlet: 'Lightweight UML diagrams.',
  vega: 'Programmable data visualizations with Vega.',
  vegalite: 'Concise declarative data visualizations.',
  wavedrom: 'Digital timing and signal diagrams.',
  wireviz: 'Cables and wiring harness diagrams.',
}

const EXTENSIONS = {
  plantuml: ['.puml', '.pu'], mermaid: ['.mmd'], graphviz: ['.dot', '.gv'], d2: ['.d2'],
  c4plantuml: ['.puml'], blockdiag: ['.diag'], seqdiag: ['.diag'], actdiag: ['.diag'],
  nwdiag: ['.diag'], packetdiag: ['.diag'], rackdiag: ['.diag'], bpmn: ['.bpmn'],
  bytefield: ['.bf'], dbml: ['.dbml'], diagramsnet: ['.drawio'], ditaa: ['.ditaa'],
  erd: ['.erd'], excalidraw: ['.excalidraw'], goat: ['.goat'], nomnoml: ['.nomnoml'],
  pikchr: ['.pikchr'], structurizr: ['.dsl'], svgbob: ['.bob'], symbolator: ['.sv'],
  tikz: ['.tex'], trn: ['.trn'], umlet: ['.uxf'], vega: ['.json'], vegalite: ['.json'], wavedrom: ['.json'],
  wireviz: ['.yaml', '.yml'],
}

const labels = new Map(diagramTypes.map(type => [type.id, type.label]))

function normalizeEntry(type, group) {
  return Object.freeze({
    id: type,
    label: labels.get(type),
    description: DESCRIPTIONS[type],
    extensions: Object.freeze([...(EXTENSIONS[type] ?? [])]),
    groupId: group.id,
    groupLabel: group.label,
  })
}

export const launcherCatalogGroups = Object.freeze(GROUP_DEFINITIONS.map(group => Object.freeze({
  id: group.id,
  label: group.label,
  description: group.description,
  items: Object.freeze(group.types.map(type => normalizeEntry(type, group))),
})))

const entriesById = new Map(launcherCatalogGroups.flatMap(group => group.items).map(entry => [entry.id, entry]))

// Flat data follows diagramTypes order, which keeps keyboard and URL ordering
// stable even though the launcher presents formats by category.
export const launcherCatalog = Object.freeze(diagramTypes.map(type => entriesById.get(type.id)))

export function launcherEntryFor(id) {
  return entriesById.get(id) ?? null
}

export function filterLauncherCatalog(query = '') {
  const needle = String(query).trim().toLocaleLowerCase()
  if (!needle) return launcherCatalog
  return launcherCatalog.filter(entry => [entry.id, entry.label, entry.description, ...entry.extensions]
    .some(value => value.toLocaleLowerCase().includes(needle)))
}

// Short aliases make the module convenient for callers that do not need the
// launcher-specific name while retaining the explicit exports above.
export const catalogGroups = launcherCatalogGroups
export const flatCatalog = launcherCatalog
export const catalogEntryFor = launcherEntryFor
export const filterCatalog = filterLauncherCatalog
