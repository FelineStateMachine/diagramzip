import assert from 'node:assert/strict'
import test from 'node:test'
import { stateForTypeChange } from '../src/type-drafts.js'

test('keeps draft source and selector type paired across engine switches', () => {
  const drafts = new Map()
  const example = type => ({ type, source: `${type} example` })

  const graphviz = stateForTypeChange(
    drafts,
    'mermaid',
    'graphviz',
    { type: 'graphviz', source: 'edited mermaid' },
    example,
  )
  const d2 = stateForTypeChange(
    drafts,
    'graphviz',
    'd2',
    { ...graphviz, type: 'd2' },
    example,
  )
  const restoredGraphviz = stateForTypeChange(
    drafts,
    'd2',
    'graphviz',
    { ...d2, type: 'graphviz' },
    example,
  )

  assert.deepEqual(drafts.get('mermaid'), { type: 'mermaid', source: 'edited mermaid' })
  assert.deepEqual(drafts.get('d2'), { type: 'd2', source: 'd2 example' })
  assert.deepEqual(restoredGraphviz, { type: 'graphviz', source: 'graphviz example' })
})
