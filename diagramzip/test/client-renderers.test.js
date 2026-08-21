import assert from 'node:assert/strict'
import test from 'node:test'
import { CLIENT_RENDERERS, CLIENT_RENDERER_IDS, RendererFrame, clientAdapterFor } from '../src/client-renderers.js'

const CHANNEL = 'diagram.zip:renderer:v1'

function fakeBrowser() {
  let listener
  const attributes = new Map()
  const contentWindow = {
    postMessage(message) {
      queueMicrotask(() => listener({
        source: contentWindow,
        data: {
          channel: CHANNEL,
          type: 'result',
          requestId: message.requestId,
          ok: true,
          svg: '<svg/>',
          version: 'mermaid@test',
          build: 'mermaid-test-unit-1',
          pipeline: ['mermaid'],
        },
      }))
    },
  }
  const frame = {
    style: {},
    contentWindow,
    setAttribute(name, value) { attributes.set(name, value) },
    addEventListener() {},
  }
  const windowObject = { addEventListener(_name, callback) { listener = callback } }
  const documentObject = {
    createElement() { return frame },
    body: { append() { queueMicrotask(() => listener({ source: contentWindow, data: { channel: CHANNEL, type: 'ready' } })) } },
  }
  return { attributes, documentObject, frame, windowObject }
}

test('registers the client-native renderers', () => {
  assert.deepEqual(CLIENT_RENDERER_IDS, ['mermaid', 'bpmn', 'excalidraw', 'diagramsnet', 'tikz'])
  assert.equal(CLIENT_RENDERERS.mermaid.frameUrl, 'https://mermaid.render.diagram.zip/index.html?v=1')
  assert.equal(CLIENT_RENDERERS.bpmn.frameUrl, 'https://bpmn.render.diagram.zip/index.html?v=1')
  assert.equal(CLIENT_RENDERERS.excalidraw.frameUrl, 'https://excalidraw.render.diagram.zip/index.html?v=3')
  assert.equal(CLIENT_RENDERERS.diagramsnet.frameUrl, 'https://diagramsnet.render.diagram.zip/index.html?v=1')
  assert.equal(CLIENT_RENDERERS.tikz.frameUrl, 'https://tikz.render.diagram.zip/index.html?v=2')
  assert.equal(clientAdapterFor('graphviz'), null)
})

test('renders through a script-only unique-origin frame', async () => {
  const browser = fakeBrowser()
  const renderer = new RendererFrame(browser)
  const result = await renderer.render('mermaid', 'flowchart LR\nA-->B', new AbortController().signal)
  assert.equal(result.body, '<svg/>')
  assert.equal(result.runtime, 'client')
  assert.equal(result.version, 'mermaid@test')
  assert.equal(result.build, 'mermaid-test-unit-1')
  assert.deepEqual(result.pipeline, ['mermaid'])
  assert.equal(browser.attributes.get('sandbox'), 'allow-scripts')
  assert.equal(browser.attributes.has('allow-same-origin'), false)
})

test('ignores renderer messages from any other window', async () => {
  const browser = fakeBrowser()
  const renderer = new RendererFrame(browser)
  const render = renderer.render('mermaid', 'flowchart LR\nA-->B', new AbortController().signal)
  renderer.receive({ source: {}, data: { channel: CHANNEL, type: 'result', requestId: 'forged', ok: true, svg: '<script/>' } })
  assert.equal((await render).body, '<svg/>')
})
