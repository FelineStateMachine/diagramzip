import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('keeps product examples independent from Kroki test fixtures', () => {
  const moduleSource = readFileSync(new URL('../src/examples.js', import.meta.url), 'utf8')
  assert.doesNotMatch(moduleSource, /ci\/tests\/diagrams/)
})

test('keeps example presentation neutral', () => {
  const tikz = readFileSync(new URL('../examples/tikz.tex', import.meta.url), 'utf8')
  const excalidraw = readFileSync(new URL('../examples/excalidraw.excalidraw', import.meta.url), 'utf8')
  assert.doesNotMatch(tikz, /documentclass\[[^\]]*border\s*=/i)
  assert.equal(JSON.parse(excalidraw).appState.viewBackgroundColor, undefined)
})

test('does not turn the Ditaa example into a document shape', () => {
  const moduleSource = readFileSync(new URL('../src/examples.js', import.meta.url), 'utf8')
  assert.doesNotMatch(moduleSource, /\{s\}/)
})
