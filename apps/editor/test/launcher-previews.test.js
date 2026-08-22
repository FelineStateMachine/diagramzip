import assert from 'node:assert/strict'
import test from 'node:test'
import { createLauncherPreviewRenderer, previewKey } from '../src/launcher-previews.js'

const state = { type: 'd2', source: 'a -> b', options: { theme: 0 }, meta: { title: 'Example' } }

test('renders an HTTP preview once and caches its object URL', async () => {
  const requests = []
  const renderer = createLauncherPreviewRenderer({
    endpointFor: type => `https://${type}.example/render`,
    clientAdapterForImpl: () => null,
    fetchImpl: async (url, init) => {
      requests.push({ url, init })
      return { ok: true, text: async () => '<svg viewBox="0 0 1 1"></svg>' }
    },
    createObjectURL: blob => `blob:${blob.type}`,
    transformSvg: rendered => rendered.body,
  })

  const [first, second] = await Promise.all([renderer.render(state), renderer.render(state)])
  assert.equal(first, 'blob:image/svg+xml')
  assert.equal(second, first)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, 'https://d2.example/render')
  assert.equal(JSON.parse(requests[0].init.body).source, state.source)
})

test('uses a client renderer when one is registered', async () => {
  let calls = 0
  const renderer = createLauncherPreviewRenderer({
    clientAdapterForImpl: type => type === 'mermaid' ? {
      render: async () => { calls++; return { body: '<svg></svg>' } },
    } : null,
    endpointFor: () => { throw new Error('HTTP renderer should not be used') },
    createObjectURL: () => 'blob:mermaid',
    transformSvg: rendered => rendered.body,
  })

  assert.equal(await renderer.render({ type: 'mermaid', source: 'flowchart LR' }), 'blob:mermaid')
  assert.equal(calls, 1)
})

test('accepts renderer SVGs with an XML declaration', async () => {
  const renderer = createLauncherPreviewRenderer({
    clientAdapterForImpl: () => ({
      render: async () => ({ body: '<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 1 1"></svg>' }),
    }),
    createObjectURL: () => 'blob:xml-svg',
    transformSvg: rendered => rendered.body,
  })

  assert.equal(await renderer.render({ type: 'symbolator', source: 'module demo; endmodule' }), 'blob:xml-svg')
})

test('rejects malformed renderer output and includes source in cache identity', async () => {
  const renderer = createLauncherPreviewRenderer({
    clientAdapterForImpl: () => ({ render: async () => ({ body: '<html></html>' }) }),
    transformSvg: rendered => rendered.body,
  })
  await assert.rejects(renderer.render({ type: 'bad', source: 'bad' }), /did not return an SVG/)
  assert.notEqual(previewKey(state), previewKey({ ...state, source: 'b -> c' }))
})
