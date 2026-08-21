import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalizeSvg } from '../../../shared/svg/index.js'
import { exportEditableSvg } from '../src/editable-svg.js'
import {
  EditableSvgInputError,
  MAX_EDITABLE_SVG_INPUT_BYTES,
  importEditableSvgFile,
  importEditableSvgInput,
  importEditableSvgText,
} from '../src/editable-svg-input.js'

const state = {
  type: 'pikchr',
  source: 'box "input"',
  options: {},
  meta: { title: 'Input', description: '' },
  presentation: { background: '', padding: 0, frame: false, appearance: 'raw' },
}
const canonical = canonicalizeSvg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="1" y="1" width="18" height="18" fill="white"/></svg>',
  state.meta,
  'pikchr',
  'pikchr@85e65b9686/edge-wasm-1',
)
const editable = exportEditableSvg(canonical, state)

test('imports pasted SVG text through the editable-document importer', () => {
  assert.deepEqual(importEditableSvgText(editable), state)
})

test('imports HTTP, HTTPS, and data URLs with an injected fetch', async () => {
  const calls = []
  const fetchImpl = async url => {
    calls.push(url)
    return new Response(editable, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } })
  }
  assert.deepEqual(await importEditableSvgInput('https://example.test/diagram.svg', { fetchImpl }), state)
  assert.deepEqual(await importEditableSvgInput('data:image/svg+xml,fixture', { fetchImpl }), state)
  assert.deepEqual(calls, ['https://example.test/diagram.svg', 'data:image/svg+xml,fixture'])
})

test('imports File and Blob inputs and enforces the shared 5 MiB cap', async () => {
  assert.deepEqual(await importEditableSvgFile(new Blob([editable], { type: 'image/svg+xml' })), state)
  await assert.rejects(
    () => importEditableSvgFile({ size: MAX_EDITABLE_SVG_INPUT_BYTES + 1, arrayBuffer: async () => new ArrayBuffer(0) }),
    error => error instanceof EditableSvgInputError && error.code === 'input_too_large',
  )
})

test('rejects unsuccessful responses and non-SVG content types', async () => {
  await assert.rejects(
    () => importEditableSvgInput('https://example.test/missing.svg', {
      fetchImpl: async () => new Response('', { status: 404 }),
    }),
    error => error.code === 'fetch_failed',
  )
  await assert.rejects(
    () => importEditableSvgInput('https://example.test/page', {
      fetchImpl: async () => new Response(editable, { headers: { 'Content-Type': 'text/html' } }),
    }),
    error => error.code === 'invalid_content_type',
  )
})

test('rejects streamed responses that exceed 5 MiB before importing', async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_EDITABLE_SVG_INPUT_BYTES))
      controller.enqueue(new Uint8Array(1))
      controller.close()
    },
  })
  await assert.rejects(
    () => importEditableSvgInput('https://example.test/large.svg', {
      fetchImpl: async () => new Response(stream, { headers: { 'Content-Type': 'image/svg+xml' } }),
    }),
    error => error.code === 'input_too_large',
  )
})

