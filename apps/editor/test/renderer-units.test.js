import assert from 'node:assert/strict'
import test from 'node:test'
import { CLIENT_RENDERER_IDS } from '../src/client-renderers.js'
import { diagramTypes } from '../src/diagram-types.js'
import { HTTP_RENDERER_UNITS, httpRendererUnitFor } from '../src/renderer-units.js'

test('gives each HTTP renderer its own subdomain', () => {
  assert.equal(Object.keys(HTTP_RENDERER_UNITS).length, 25)
  for (const [engine, endpoint] of Object.entries(HTTP_RENDERER_UNITS)) {
    assert.equal(new URL(endpoint).hostname, `${engine}.render.diagram.zip`)
    assert.equal(new URL(endpoint).pathname, '/v1/svg')
  }
})

test('does not route client renderers through an HTTP unit', () => {
  assert.equal(httpRendererUnitFor('bytefield'), 'https://bytefield.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('plantuml'), 'https://plantuml.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('mermaid'), null)
  assert.equal(httpRendererUnitFor('bpmn'), null)
  assert.equal(httpRendererUnitFor('excalidraw'), null)
  assert.equal(httpRendererUnitFor('diagramsnet'), null)
})

test('does not invent an endpoint for an unknown renderer', () => {
  assert.equal(httpRendererUnitFor('unknown'), null)
})

test('assigns exactly one final renderer path to every diagram type', () => {
  const http = Object.keys(HTTP_RENDERER_UNITS)
  const client = [...CLIENT_RENDERER_IDS]
  assert.equal(http.length, 25)
  assert.equal(client.length, 5)
  assert.deepEqual(new Set([...http, ...client]), new Set(diagramTypes.map(({ id }) => id)))
  assert.equal(http.some(engine => client.includes(engine)), false)
})
