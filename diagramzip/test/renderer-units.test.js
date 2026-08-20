import assert from 'node:assert/strict'
import test from 'node:test'
import { HTTP_RENDERER_UNITS, httpRendererUnitFor } from '../src/renderer-units.js'

test('gives each Worker-native renderer its own origin', () => {
  assert.deepEqual(Object.keys(HTTP_RENDERER_UNITS), ['bytefield', 'nomnoml', 'vega', 'vegalite', 'wavedrom'])
  for (const [engine, endpoint] of Object.entries(HTTP_RENDERER_UNITS)) {
    assert.equal(new URL(endpoint).hostname, `${engine}.render.diagram.zip`)
    assert.equal(new URL(endpoint).pathname, '/v1/svg')
  }
})

test('does not route compatibility renderers through an unrelated unit', () => {
  assert.equal(httpRendererUnitFor('bytefield'), 'https://bytefield.render.diagram.zip/v1/svg')
  assert.equal(httpRendererUnitFor('plantuml'), null)
})
