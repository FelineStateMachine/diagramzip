import assert from 'node:assert/strict'
import test from 'node:test'
import { exampleVariant, grayCode } from '../src/example-variants.js'

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
