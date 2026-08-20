import assert from 'node:assert/strict'
import test from 'node:test'
import { CLIENT_RENDERER_IDS, RendererFrame, clientAdapterFor } from '../src/client-renderers.js'

const CHANNEL = 'diagram.zip:renderer:v1'

function fakeBrowser() {
  let listener
  const attributes = new Map()
  const contentWindow = {
    postMessage(message) {
      queueMicrotask(() => listener({
        source: contentWindow,
        data: { channel: CHANNEL, type: 'result', requestId: message.requestId, ok: true, svg: '<svg/>', version: 'mermaid@test' },
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

test('registers the first client-native renderer cohort', () => {
  assert.deepEqual(CLIENT_RENDERER_IDS, ['mermaid', 'bpmn'])
  assert.equal(clientAdapterFor('graphviz'), null)
})

test('renders through a script-only unique-origin frame', async () => {
  const browser = fakeBrowser()
  const renderer = new RendererFrame(browser)
  const result = await renderer.render('mermaid', 'flowchart LR\nA-->B', new AbortController().signal)
  assert.equal(result.body, '<svg/>')
  assert.equal(result.runtime, 'client')
  assert.equal(result.version, 'mermaid@test')
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
