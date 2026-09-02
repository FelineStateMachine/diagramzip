import assert from 'node:assert/strict'
import test from 'node:test'
import { diagramTypes } from '../src/diagram-types.js'
import { HTTP_RENDERER_UNITS, httpRendererUnitFor } from '../src/renderer-units.js'

test('gives each HTTP renderer its own subdomain', () => {
  assert.equal(Object.keys(HTTP_RENDERER_UNITS).length, 32)
  for (const [engine, endpoint] of Object.entries(HTTP_RENDERER_UNITS)) {
    assert.equal(new URL(endpoint).hostname, `${engine}.render.diagram.zip`)
    assert.equal(new URL(endpoint).pathname, '/v1/svg')
  }
})

test('routes every formerly client-rendered engine through its HTTP unit', () => {
  assert.equal(httpRendererUnitFor('bytefield'), 'https://bytefield.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('plantuml'), 'https://plantuml.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('mermaid'), 'https://mermaid.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('bpmn'), 'https://bpmn.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('excalidraw'), 'https://excalidraw.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('diagramsnet'), 'https://diagramsnet.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('tikz'), 'https://tikz.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('trn'), 'https://trn.render.diagram.zip/v1/svg')
})

test('does not invent an endpoint for an unknown renderer', () => {
  assert.equal(httpRendererUnitFor('unknown'), null)
})

test('assigns exactly one final renderer path to every diagram type', () => {
  const http = Object.keys(HTTP_RENDERER_UNITS)
  assert.equal(http.length, 32)
  assert.deepEqual(new Set(http), new Set(diagramTypes.map(({ id }) => id)))
})
