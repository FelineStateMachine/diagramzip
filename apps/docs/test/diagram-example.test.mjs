import assert from 'node:assert/strict';
import test from 'node:test';
import {fitView, zoomView} from '../src/components/DiagramExample/viewMath.mjs';
import {clientFrameUrlFor, httpRendererUrlFor} from '../src/components/DiagramExample/rendererRouting.mjs';

test('routes client examples to their isolated renderer frame', () => {
  assert.equal(clientFrameUrlFor('tikz'), 'https://tikz.render.diagram.zip/index.html?v=1');
  assert.equal(clientFrameUrlFor('graphviz'), null);
});

test('routes HTTP examples to their dedicated renderer unit', () => {
  assert.equal(httpRendererUrlFor('graphviz'), 'https://graphviz.render.diagram.zip/v1/svg');
});

test('fits a wide diagram without assuming a fixed aspect ratio', () => {
  assert.deepEqual(fitView(800, 400, 1600, 200, 40), {scale: 0.45, x: 40, y: 155});
});

test('fits a tall diagram without assuming a fixed aspect ratio', () => {
  assert.deepEqual(fitView(800, 400, 200, 1600, 40), {scale: 0.2, x: 380, y: 40});
});

test('keeps the diagram point below the pointer while zooming', () => {
  const next = zoomView({scale: 1, x: 10, y: 20}, 2, 110, 220);
  assert.deepEqual(next, {scale: 2, x: -90, y: -180});
});
