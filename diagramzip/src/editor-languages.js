export const GENERIC_LANGUAGE_ID = 'diagram-source'
export const JSON5_LANGUAGE_ID = 'diagram-json5'

const strictJsonTypes = new Set(['excalidraw', 'vega', 'vegalite'])
const xmlTypes = new Set(['bpmn', 'diagramsnet', 'umlet'])

export function editorLanguageFor(type) {
  if (strictJsonTypes.has(type)) return 'json'
  if (xmlTypes.has(type)) return 'xml'
  if (type === 'wireviz') return 'yaml'
  if (type === 'dbml') return 'sql'
  if (type === 'bytefield') return 'clojure'
  if (type === 'wavedrom') return JSON5_LANGUAGE_ID
  return GENERIC_LANGUAGE_ID
}
