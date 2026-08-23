import assert from 'node:assert/strict'
import test from 'node:test'
import {
  detailsDocumentFor,
  detailsStateWithTitle,
  parseDetailsDocument,
  serializeDetailsDocument,
} from '../src/details-document.js'

const state = {
  meta: { title: 'Connections', description: 'A small D2 example.' },
  options: { scale: 2, sketch: false },
  presentation: { appearance: 'dark-transparent', background: '', padding: 0, frame: false },
}

test('round trips the schema-backed details document', () => {
  assert.deepEqual(parseDetailsDocument(serializeDetailsDocument(state)), {
    meta: state.meta,
    options: state.options,
    presentation: state.presentation,
  })
  assert.deepEqual(detailsDocumentFor(state), {
    title: 'Connections',
    description: 'A small D2 example.',
    options: state.options,
    presentation: state.presentation,
  })
})

test('rejects malformed, incomplete, and extended details documents', () => {
  assert.throws(() => parseDetailsDocument('{'), /valid JSON/)
  assert.throws(() => parseDetailsDocument('{}'), /missing required property "title"/)
  assert.throws(() => parseDetailsDocument(JSON.stringify({
    ...detailsDocumentFor(state),
    extra: true,
  })), /unknown property "extra"/)
})

test('communicates metadata and presentation restrictions', () => {
  assert.throws(() => parseDetailsDocument(JSON.stringify({
    ...detailsDocumentFor(state),
    title: 'x'.repeat(201),
  })), /at most 200/)
  assert.throws(() => parseDetailsDocument(JSON.stringify({
    ...detailsDocumentFor(state),
    presentation: { ...state.presentation, padding: 257 },
  })), /invalid appearance/)
  assert.throws(() => parseDetailsDocument(JSON.stringify({
    ...detailsDocumentFor(state),
    options: { layout: { mode: 'individual' } },
  })), /must be a string, number, or boolean/)
})

test('updates the title without changing other details', () => {
  assert.deepEqual(detailsStateWithTitle(state, 'Renamed'), {
    meta: { title: 'Renamed', description: state.meta.description },
    options: state.options,
    presentation: state.presentation,
  })
  assert.throws(() => detailsStateWithTitle(state, 'x'.repeat(201)), /at most 200/)
})
