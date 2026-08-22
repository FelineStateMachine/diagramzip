import assert from 'node:assert/strict'
import test from 'node:test'
import { createLauncherPreviewRenderer, previewKey } from '../src/launcher-previews.js'

const state = { type: 'd2', source: 'a -> b', options: { theme: 0 }, meta: { title: 'Example' } }

test('renders an HTTP preview once and caches its object URL', async () => {
  const requests = []
  const renderer = createLauncherPreviewRenderer({
    endpointFor: type => `https://${type}.example/render`,
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

test('accepts renderer SVGs with an XML declaration', async () => {
  const renderer = createLauncherPreviewRenderer({
    endpointFor: () => 'https://symbolator.example/render',
    fetchImpl: async () => ({ ok: true, text: async () => '<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 1 1"></svg>' }),
    createObjectURL: () => 'blob:xml-svg',
    transformSvg: rendered => rendered.body,
  })

  assert.equal(await renderer.render({ type: 'symbolator', source: 'module demo; endmodule' }), 'blob:xml-svg')
})

test('rejects malformed renderer output and includes source in cache identity', async () => {
  const renderer = createLauncherPreviewRenderer({
    endpointFor: () => 'https://bad.example/render',
    fetchImpl: async () => ({ ok: true, text: async () => '<html></html>' }),
    transformSvg: rendered => rendered.body,
  })
  await assert.rejects(renderer.render({ type: 'bad', source: 'bad' }), /did not return an SVG/)
  assert.notEqual(previewKey(state), previewKey({ ...state, source: 'b -> c' }))
})
