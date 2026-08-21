import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeText,
  documentTitle,
  encodeText,
  MAX_IMAGE_URL_LENGTH,
  normalizeMetadata,
  normalizePresentation,
  packedSvgUrl,
} from '../src/state.js'

test('uses the Kroki-compatible zlib + base64url encoding', () => {
  const source = 'digraph G {Hello->World}\n'
  assert.equal(encodeText(source), 'eNpLyUwvSizIUHBXqPZIzcnJ17ULzy_KSanlAgB1EAjQ')
})

test('round trips Unicode text', () => {
  const source = 'Alice -> Bob: Grüezi 👋 こんにちは'
  assert.equal(decodeText(encodeText(source)), source)
})

test('validates structured presentation values', () => {
  assert.deepEqual(normalizePresentation(), { background: '', padding: 0, frame: false, appearance: 'raw' })
  assert.throws(() => normalizePresentation({ background: 'red' }), /presentation/)
  assert.throws(() => normalizePresentation({ padding: 257 }), /presentation/)
  assert.throws(() => normalizePresentation({ appearance: 'sepia' }), /presentation/)
})

test('validates metadata values', () => {
  assert.deepEqual(normalizeMetadata(), { title: '', description: '' })
  assert.throws(() => normalizeMetadata({ title: 42 }), /metadata/)
})

test('packs a complete editable SVG into a self-contained image URL', () => {
  const source = '<svg xmlns="http://www.w3.org/2000/svg" data-dz-document="1"><text>hello</text></svg>'
  const url = new URL(packedSvgUrl('https://diagram.zip', source))
  assert.match(url.pathname, /^\/svg\/[A-Za-z0-9_-]+$/)
  assert.equal(decodeText(url.pathname.slice('/svg/'.length)), source)
})

test('keeps shared image URLs below the edge request limit', () => {
  assert.equal(MAX_IMAGE_URL_LENGTH, 15_000)
})

test('rejects packed SVG URLs that exceed the edge request limit', () => {
  let seed = 0x12345678
  let payload = ''
  for (let index = 0; index < 30_000; index++) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    payload += String.fromCharCode(33 + seed % 90)
  }
  assert.throws(
    () => packedSvgUrl('https://diagram.zip', `<svg xmlns="http://www.w3.org/2000/svg"><metadata>${payload}</metadata></svg>`),
    /too large for a packed SVG URL/,
  )
})

test('uses the diagram title as the unbranded zip document title', () => {
  assert.equal(documentTitle('Shared task flow'), 'Shared task flow.zip')
  assert.equal(documentTitle('   '), 'untitled.zip')
})
