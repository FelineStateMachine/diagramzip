import { StreamLanguage } from '@codemirror/language'
import { json } from '@codemirror/lang-json'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'

const DIAGRAM_TYPES = [
  ['plantuml', 'PlantUML'],
  ['mermaid', 'Mermaid'],
  ['graphviz', 'GraphViz'],
  ['d2', 'D2'],
  ['c4plantuml', 'C4 PlantUML'],
  ['blockdiag', 'BlockDiag'],
  ['seqdiag', 'SeqDiag'],
  ['actdiag', 'ActDiag'],
  ['nwdiag', 'NwDiag'],
  ['packetdiag', 'PacketDiag'],
  ['rackdiag', 'RackDiag'],
  ['bpmn', 'BPMN'],
  ['bytefield', 'Bytefield'],
  ['dbml', 'DBML'],
  ['diagramsnet', 'Diagrams.net'],
  ['ditaa', 'Ditaa'],
  ['erd', 'ERD'],
  ['excalidraw', 'Excalidraw'],
  ['goat', 'GoAT'],
  ['nomnoml', 'Nomnoml'],
  ['pikchr', 'Pikchr'],
  ['structurizr', 'Structurizr'],
  ['svgbob', 'Svgbob'],
  ['symbolator', 'Symbolator'],
  ['tikz', 'TikZ'],
  ['umlet', 'UMLet'],
  ['vega', 'Vega'],
  ['vegalite', 'Vega-Lite'],
  ['wavedrom', 'WaveDrom'],
  ['wireviz', 'WireViz'],
]

export const diagramTypes = DIAGRAM_TYPES.map(([id, label]) => ({ id, label }))

const keywords = new Set([
  'actor', 'alt', 'and', 'as', 'class', 'component', 'database', 'direction', 'else', 'end',
  'endnote', 'endif', 'endwhile', 'flowchart', 'graph', 'group', 'if', 'interface', 'loop',
  'namespace', 'node', 'note', 'package', 'participant', 'rectangle', 'return', 'skinparam',
  'start', 'state', 'stop', 'subgraph', 'then', 'title', 'while',
])

const diagramLanguage = StreamLanguage.define({
  startState: () => ({ blockComment: false }),
  token(stream, state) {
    if (state.blockComment) {
      if (stream.skipTo('*/')) {
        stream.match('*/')
        state.blockComment = false
      } else {
        stream.skipToEnd()
      }
      return 'blockComment'
    }
    if (stream.match('/*')) {
      state.blockComment = true
      return 'blockComment'
    }
    if (stream.match(/^\s*(?:%%|\/\/|'|#).*/)) return 'lineComment'
    if (stream.match(/^@(?:start|end)[a-z0-9_]*/i)) return 'keyword'
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string'
    if (stream.match(/^(?:--?>|<--?|==>|<==|\.\.>|<\.\.|->|<-|=>|<=|--|\.\.)/)) return 'operator'
    if (stream.match(/^#[0-9a-f]{3,8}\b/i)) return 'color'
    if (stream.match(/^\b\d+(?:\.\d+)?\b/)) return 'number'
    if (stream.match(/^\b[a-z_][\w-]*\b/i)) {
      return keywords.has(stream.current().toLowerCase()) ? 'keyword' : 'variableName'
    }
    stream.next()
    return null
  },
})

const jsonTypes = new Set(['bytefield', 'excalidraw', 'vega', 'vegalite', 'wavedrom'])
const xmlTypes = new Set(['bpmn', 'diagramsnet', 'umlet'])

export function languageFor(type) {
  if (jsonTypes.has(type)) return json()
  if (xmlTypes.has(type)) return xml()
  if (type === 'wireviz') return yaml()
  if (type === 'dbml') return sql()
  return diagramLanguage
}

export function isKnownDiagramType(type) {
  return diagramTypes.some(diagramType => diagramType.id === type)
}

/** Return the known diagram type from a URL query string, or null. */
export function diagramTypeFromQuery(search = '') {
  const params = new URLSearchParams(search)
  const type = params.get('type')
  return isKnownDiagramType(type) ? type : null
}

export function urlWithDiagramType(url, type) {
  if (!isKnownDiagramType(type)) throw new Error('Unsupported diagram type.')
  const next = new URL(url, 'https://diagram.zip')
  next.searchParams.set('type', type)
  return `${next.pathname}${next.search}${next.hash}`
}
