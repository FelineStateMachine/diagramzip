import assert from 'node:assert/strict';
import test from 'node:test';
import {fitView, zoomView} from '../src/components/DiagramExample/viewMath.mjs';
import {httpRendererUrlFor} from '../src/components/DiagramExample/rendererRouting.mjs';
import {canonicalizeHttpRendererSvg, rendererVersionFromHeaders} from '../src/components/DiagramExample/httpSvg.mjs';
import {materializeSvg} from '../../../shared/svg/index.js';

test('routes HTTP examples to their dedicated renderer unit', () => {
  assert.equal(httpRendererUrlFor('graphviz'), 'https://graphviz.render.diagram.zip/v1/svg');
  assert.equal(httpRendererUrlFor('mermaid'), 'https://mermaid.render.diagram.zip/v1/svg');
  assert.equal(httpRendererUrlFor('bpmn'), 'https://bpmn.render.diagram.zip/v1/svg');
  assert.equal(httpRendererUrlFor('excalidraw'), 'https://excalidraw.render.diagram.zip/v1/svg');
  assert.equal(httpRendererUrlFor('diagramsnet'), 'https://diagramsnet.render.diagram.zip/v1/svg');
  assert.equal(httpRendererUrlFor('tikz'), 'https://tikz.render.diagram.zip/v1/svg');
});

test('canonicalizes raw HTTP renderer SVG before docs appearance materialization', () => {
  const headers = new Headers({
    'X-Diagram-Engine-Version': '3.4.2',
    'X-Renderer-Build': 'blockdiag-3.4.2-family-python-1',
  });
  const raw = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><rect x="2" y="2" width="36" height="16" fill="white" stroke="black"></rect><text x="8" y="14" fill="black">block</text></svg>';
  const canonical = canonicalizeHttpRendererSvg(raw, 'blockdiag', headers);

  assert.equal(rendererVersionFromHeaders(headers), '3.4.2 blockdiag-3.4.2-family-python-1');
  assert.match(canonical, /data-dz-schema="1"/);
  assert.match(canonical, /data-dz-profile="neutral-svg-semantic-2"/);
  assert.match(materializeSvg(canonical, 'auto-transparent'), /data-dz-appearance="auto-transparent"/);
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
