import assert from 'node:assert/strict'
import test from 'node:test'
import { workingStateIsDirty, workingStateSnapshot } from '../src/working-state.js'

const exampleStateFor = type => ({
  type,
  source: `${type} example`,
  options: {},
  meta: { title: `${type} title`, description: '' },
  presentation: { appearance: 'auto-transparent' },
})

test('treats a pristine anonymous example as a clean baseline', () => {
  assert.equal(workingStateIsDirty(exampleStateFor('d2'), { defaultStateFor: exampleStateFor }), false)
  assert.equal(workingStateIsDirty({ ...exampleStateFor('d2'), source: 'edited' }, { defaultStateFor: exampleStateFor }), true)
})

test('compares aliases to their saved snapshot instead of the catalog example', () => {
  const saved = { ...exampleStateFor('d2'), source: 'saved source' }
  const options = { defaultStateFor: exampleStateFor, savedSnapshot: workingStateSnapshot(saved) }
  assert.equal(workingStateIsDirty(saved, options), false)
  assert.equal(workingStateIsDirty({ ...saved, source: 'local edit' }, options), true)
})

test('keeps encryption envelope changes dirty independently of content', () => {
  assert.equal(workingStateIsDirty(exampleStateFor('d2'), {
    defaultStateFor: exampleStateFor,
    keyEnvelopeDirty: true,
  }), true)
})
