import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('loads homepage examples from the shared diagram corpus', () => {
  const moduleSource = readFileSync(new URL('../src/examples.js', import.meta.url), 'utf8')
  assert.match(moduleSource, /\.\.\/\.\.\/examples\/diagrams\//)
  assert.doesNotMatch(moduleSource, /ci\/tests\/diagrams/)
})

test('keeps example presentation neutral', () => {
  const tikz = readFileSync(new URL('../../examples/diagrams/tikz.tex', import.meta.url), 'utf8')
  const excalidraw = readFileSync(new URL('../../examples/diagrams/excalidraw.excalidraw', import.meta.url), 'utf8')
  assert.doesNotMatch(tikz, /documentclass\[[^\]]*border\s*=/i)
  assert.equal(JSON.parse(excalidraw).appState.viewBackgroundColor, undefined)
})

test('does not turn the Ditaa example into a document shape', () => {
  const moduleSource = readFileSync(new URL('../src/examples.js', import.meta.url), 'utf8')
  assert.doesNotMatch(moduleSource, /\{s\}/)
})
