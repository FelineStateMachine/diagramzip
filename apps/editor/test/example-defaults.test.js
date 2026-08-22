import assert from 'node:assert/strict'
import test from 'node:test'
import { diagramTypes } from '../src/diagram-types.js'
import {
  exampleStateForTheme,
  namedExample,
  refreshMatchingExampleMetadata,
} from '../src/example-defaults.js'

test('names every example without adding description or presentation styling', () => {
  for (const { id } of diagramTypes) {
    const example = namedExample(id)
    assert.ok(example.meta.title)
    assert.equal(example.meta.title, example.meta.title.trim())
    assert.equal(example.meta.description, '')
    assert.deepEqual(example.presentation, {
      background: '',
      padding: 0,
      frame: false,
      appearance: 'raw',
    })
  }
})

test('applies the app theme as transparent presentation without changing template source', () => {
  const template = {
    type: 'ditaa',
    source: '+---+',
    meta: { title: 'ASCII', description: '' },
    presentation: { appearance: 'raw', background: '#ffffff', padding: 24, frame: true },
  }

  const dark = exampleStateForTheme(template, 'dark')
  assert.equal(dark.source, template.source)
  assert.equal(dark.meta, template.meta)
  assert.deepEqual(dark.presentation, {
    appearance: 'dark-transparent',
    background: '',
    padding: 0,
    frame: false,
  })
  assert.equal(exampleStateForTheme(template, 'light').presentation.appearance, 'light-transparent')
  assert.throws(() => exampleStateForTheme(template, 'auto'), /light or dark/)
})

test('names an untitled draft matching its bundled example', () => {
  const state = {
    type: 'd2',
    source: 'a -> b',
    meta: { title: '', description: '' },
    presentation: { padding: 24 },
  }
  const example = {
    type: 'd2',
    source: 'a -> b',
    meta: { title: 'Connection styles', description: '' },
  }

  assert.deepEqual(refreshMatchingExampleMetadata(state, example), {
    ...state,
    meta: { title: 'Connection styles', description: '' },
  })
})

test('preserves named and edited drafts', () => {
  const example = {
    source: 'a -> b',
    meta: { title: 'Connection styles', description: '' },
  }
  const named = { source: example.source, meta: { title: 'Mine', description: '' } }
  const edited = { source: 'a -> b: edited', meta: { title: '', description: '' } }

  assert.equal(refreshMatchingExampleMetadata(named, example), named)
  assert.equal(refreshMatchingExampleMetadata(edited, example), edited)
})
