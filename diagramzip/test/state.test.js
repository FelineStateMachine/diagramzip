import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  decodeText,
  encodeText,
  imageUrl,
  MAX_IMAGE_URL_LENGTH,
  normalizeMetadata,
  normalizePresentation,
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
  assert.deepEqual(normalizePresentation(), { background: '', padding: 0, frame: false })
  assert.throws(() => normalizePresentation({ background: 'red' }), /presentation/)
  assert.throws(() => normalizePresentation({ padding: 257 }), /presentation/)
})

test('validates metadata values', () => {
  assert.deepEqual(normalizeMetadata(), { title: '', description: '' })
  assert.throws(() => normalizeMetadata({ title: 42 }), /metadata/)
})

test('builds an encoded image URL with options', () => {
  const url = new URL(imageUrl('https://diagram.zip', {
    type: 'd2',
    source: 'a -> b',
    options: { theme: 200 },
  }))
  assert.match(url.pathname, /^\/d2\/svg\/[A-Za-z0-9_-]+$/)
  assert.equal(url.searchParams.get('theme'), '200')
})

test('carries metadata in a compact static SVG query payload', () => {
  const url = new URL(imageUrl('https://diagram.zip', {
    type: 'd2',
    source: 'a -> b',
    meta: { title: 'A to B', description: 'A points to B.' },
  }))
  assert.deepEqual(JSON.parse(decodeText(url.searchParams.get('dz'))), {
    meta: { title: 'A to B', description: 'A points to B.' },
  })
})

test('carries presentation in the static SVG payload', () => {
  const url = new URL(imageUrl('https://diagram.zip', {
    type: 'd2',
    source: 'a -> b',
    presentation: { background: '#f4f4f4', padding: 24, frame: true },
  }))
  assert.deepEqual(JSON.parse(decodeText(url.searchParams.get('dz'))), {
    presentation: { background: '#f4f4f4', padding: 24, frame: true },
  })
})

test('keeps shared image URLs below the edge request limit', () => {
  assert.equal(MAX_IMAGE_URL_LENGTH, 15_000)
})

test('fits the bundled periodic-table example in a shared image URL', () => {
  const source = readFileSync(new URL('../../ci/tests/diagrams/periodic-table.tex', import.meta.url), 'utf8')
  const url = imageUrl('https://diagram.zip', { type: 'tikz', source })
  assert.ok(url.length > 4096)
  assert.ok(url.length <= MAX_IMAGE_URL_LENGTH)
})
