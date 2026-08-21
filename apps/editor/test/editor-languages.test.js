import assert from 'node:assert/strict'
import test from 'node:test'
import { diagramTypes } from '../src/diagram-types.js'
import {
  editorLanguageFor,
  GENERIC_LANGUAGE_ID,
  JSON5_LANGUAGE_ID,
} from '../src/editor-languages.js'

test('routes structured diagram sources to their Monaco languages', () => {
  for (const type of ['excalidraw', 'vega', 'vegalite']) {
    assert.equal(editorLanguageFor(type), 'json')
  }
  for (const type of ['bpmn', 'diagramsnet', 'umlet']) {
    assert.equal(editorLanguageFor(type), 'xml')
  }
  assert.equal(editorLanguageFor('wireviz'), 'yaml')
  assert.equal(editorLanguageFor('dbml'), 'sql')
  assert.equal(editorLanguageFor('bytefield'), 'clojure')
  assert.equal(editorLanguageFor('wavedrom'), JSON5_LANGUAGE_ID)
})

test('routes every remaining known type to the generic diagram language', () => {
  const specialized = new Set([
    'excalidraw', 'vega', 'vegalite', 'bpmn', 'diagramsnet', 'umlet',
    'wireviz', 'dbml', 'bytefield', 'wavedrom',
  ])
  const genericTypes = diagramTypes
    .map(({ id }) => id)
    .filter(type => !specialized.has(type))

  assert.equal(diagramTypes.length, 30)
  assert.ok(genericTypes.length > 0)
  for (const type of genericTypes) {
    assert.equal(editorLanguageFor(type), GENERIC_LANGUAGE_ID)
  }
})
