import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultExampleAppearance,
  exampleVariant,
  grayCode,
  refreshMatchingExampleMetadata,
} from '../src/example-variants.js'

test('uses adaptive normalized appearances for catalog examples', () => {
  assert.equal(defaultExampleAppearance('d2'), 'auto-transparent')
  assert.equal(defaultExampleAppearance('diagramsnet'), 'auto-framed')
})

test('changes one example axis at a time across the catalog', () => {
  for (let index = 1; index < 30; index++) {
    const changedBits = grayCode(index) ^ grayCode(index - 1)
    assert.equal(changedBits > 0 && (changedBits & (changedBits - 1)) === 0, true)
  }
})

test('names every example while varying descriptions and padding', () => {
  const context = { title: 'Title', description: 'Description' }
  const variants = Array.from({ length: 30 }, (_, index) => exampleVariant(index, context))
  assert.ok(variants.every(variant => variant.meta.title === context.title))
  assert.ok(variants.some(variant => variant.meta.description))
  assert.ok(variants.some(variant => !variant.meta.description))
  assert.ok(variants.some(variant => variant.presentation.padding))
  assert.ok(variants.every(variant => variant.presentation.background === ''))
  assert.ok(variants.every(variant => variant.presentation.frame === false))
})

test('refreshes metadata for an untitled draft matching its bundled example', () => {
  const state = {
    type: 'd2',
    source: 'a -> b',
    meta: { title: '', description: '' },
    presentation: { padding: 24 },
  }
  const example = {
    type: 'd2',
    source: 'a -> b',
    meta: { title: 'Connection styles', description: 'D2 syntax.' },
  }

  assert.deepEqual(refreshMatchingExampleMetadata(state, example), {
    ...state,
    meta: { title: 'Connection styles', description: 'D2 syntax.' },
  })
})

test('preserves named and edited drafts', () => {
  const example = {
    source: 'a -> b',
    meta: { title: 'Connection styles', description: 'D2 syntax.' },
  }
  const named = { source: example.source, meta: { title: 'Mine', description: '' } }
  const edited = { source: 'a -> b: edited', meta: { title: '', description: '' } }

  assert.equal(refreshMatchingExampleMetadata(named, example), named)
  assert.equal(refreshMatchingExampleMetadata(edited, example), edited)
})
