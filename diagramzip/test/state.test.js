import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  decodeEditorHash,
  decodeText,
  encodeEditorHash,
  encodeText,
  imageUrl,
  MAX_IMAGE_URL_LENGTH,
} from '../src/state.js'

test('uses the Kroki-compatible zlib + base64url encoding', () => {
  const source = 'digraph G {Hello->World}\n'
  assert.equal(encodeText(source), 'eNpLyUwvSizIUHBXqPZIzcnJ17ULzy_KSanlAgB1EAjQ')
})

test('round trips Unicode text', () => {
  const source = 'Alice -> Bob: Grüezi 👋 こんにちは'
  assert.equal(decodeText(encodeText(source)), source)
})

test('round trips a versioned editor hash', () => {
  const state = {
    type: 'mermaid',
    source: 'flowchart LR\n  A --> B',
    options: { theme: 'neutral' },
  }
  assert.deepEqual(decodeEditorHash(encodeEditorHash(state)), state)
})

test('rejects unsupported and malformed hashes', () => {
  assert.throws(() => decodeEditorHash('#v2/mermaid/nope'), /Unsupported/)
  assert.throws(() => decodeEditorHash('#v1/mermaid/nope'))
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

test('keeps shared image URLs below the edge request limit', () => {
  assert.equal(MAX_IMAGE_URL_LENGTH, 15_000)
})

test('fits the bundled periodic-table example in a shared image URL', () => {
  const source = readFileSync(new URL('../../ci/tests/diagrams/periodic-table.tex', import.meta.url), 'utf8')
  const url = imageUrl('https://diagram.zip', { type: 'tikz', source })
  assert.ok(url.length > 4096)
  assert.ok(url.length <= MAX_IMAGE_URL_LENGTH)
})
