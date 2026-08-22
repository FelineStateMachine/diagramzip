import assert from 'node:assert/strict'
import test from 'node:test'
import { stateForTypeChange } from '../src/type-drafts.js'

test('changes only the renderer and its type-specific options', () => {
  const current = {
    type: 'ditaa',
    source: '+---+\n| A |\n+---+',
    options: { scale: 2 },
    meta: { title: 'ASCII box', description: 'Keep me' },
    presentation: { appearance: 'dark-transparent', background: '', padding: 0, frame: false },
  }

  const goat = stateForTypeChange(current, 'goat')

  assert.deepEqual(goat, { ...current, type: 'goat', options: {} })
  assert.equal(goat.source, current.source)
  assert.equal(goat.meta, current.meta)
  assert.equal(goat.presentation, current.presentation)
  assert.equal(current.type, 'ditaa')
})
