import assert from 'node:assert/strict'
import test from 'node:test'
import { HTTP_RENDERER_UNITS, httpRendererUnitFor, requiresDedicatedRenderer } from '../src/renderer-units.js'

test('gives each HTTP renderer its own origin', () => {
  assert.equal(Object.keys(HTTP_RENDERER_UNITS).length, 27)
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
})

test('requires every migrated engine to stay on its dedicated runtime', () => {
  for (const engine of [
    'mermaid', 'bpmn', 'excalidraw',
    'plantuml', 'c4plantuml',
    'bytefield', 'nomnoml', 'vega', 'vegalite', 'wavedrom',
    'blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'packetdiag', 'rackdiag',
    'graphviz', 'erd', 'dbml', 'pikchr', 'svgbob', 'wireviz',
  ]) {
    assert.equal(requiresDedicatedRenderer(engine), true)
  }
  assert.equal(requiresDedicatedRenderer('plantuml'), true)
  assert.equal(requiresDedicatedRenderer('graphviz'), true)
  assert.equal(requiresDedicatedRenderer('erd'), true)
})
