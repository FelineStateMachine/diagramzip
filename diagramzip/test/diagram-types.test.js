import assert from 'node:assert/strict'
import test from 'node:test'
import { diagramTypeFromQuery, urlWithDiagramType } from '../src/diagram-types.js'

test('reads a known diagram type from the query string', () => {
  assert.equal(diagramTypeFromQuery('?type=mermaid'), 'mermaid')
  assert.equal(diagramTypeFromQuery('type=vega-lite'), null)
})

test('rejects missing, unknown, and empty type values', () => {
  assert.equal(diagramTypeFromQuery(''), null)
  assert.equal(diagramTypeFromQuery('?type='), null)
  assert.equal(diagramTypeFromQuery('?type=not-a-diagram'), null)
})

test('writes the active diagram type without removing other URL state', () => {
  assert.equal(urlWithDiagramType('https://diagram.zip/?view=fit', 'd2'), '/?view=fit&type=d2')
  assert.equal(
    urlWithDiagramType('https://diagram.zip/d/AbCdEfGhIjKlMnOp?type=d2#w=secret', 'mermaid'),
    '/d/AbCdEfGhIjKlMnOp?type=mermaid#w=secret',
  )
  assert.throws(() => urlWithDiagramType('https://diagram.zip/', 'unknown'), /Unsupported/)
})
