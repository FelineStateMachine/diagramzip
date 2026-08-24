import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { attachEditableDocument, canonicalizeSvg, materializeSvg } from '../../../shared/svg/index.js'
import {
  EditableSvgError,
  editableDocumentFor,
  exportEditableSvg,
  importEditableSvg,
} from '../src/editable-svg.js'

const fixture = name => readFile(fileURLToPath(new URL(`./fixtures/editable-svg/${name}.svg`, import.meta.url)), 'utf8')

const cases = [
  {
    name: 'graphviz',
    version: 'graphviz@15.1.1',
    state: {
      type: 'graphviz',
      source: 'digraph G { A -> B [label="café ☕"] }',
      options: { engine: 'dot' },
      meta: { title: 'Café flow', description: 'Unicode survives: こんにちは' },
      presentation: { appearance: 'raw', background: '#ffffff', padding: 8, frame: true },
    },
  },
  {
    name: 'mermaid',
    version: 'mermaid@11.17.0',
    state: {
      type: 'mermaid',
      source: 'flowchart LR\n  idea[Idea] --> shipped[Shipped]',
      options: {},
      meta: { title: 'Idea flow', description: 'A client-rendered diagram.' },
      presentation: { appearance: 'dark-transparent', background: '', padding: 0, frame: false },
    },
  },
  {
    name: 'diagramsnet',
    version: 'diagrams.net@29.6.1',
    state: {
      type: 'diagramsnet',
      source: '<mxGraphModel><root/></mxGraphModel>',
      options: {},
      meta: { title: 'Authored drawing', description: '' },
      presentation: { appearance: 'auto-framed', background: '', padding: 0, frame: false },
    },
  },
  {
    name: 'safe-raw',
    engine: 'pikchr',
    version: 'pikchr@future',
    state: {
      type: 'pikchr',
      source: 'box "raw fallback"',
      options: { scale: 1 },
      meta: { title: '', description: 'Unknown renderer builds remain round-trippable as raw SVG.' },
      presentation: { appearance: 'raw', background: '', padding: 0, frame: false },
    },
  },
]

test('uses the embedded presentation as the packed SVG palette selector', async () => {
  const state = cases[1].state
  const rendered = await fixture('mermaid')
  const canonical = canonicalizeSvg(rendered, state.meta, state.type, cases[1].version)
  const light = materializeSvg(canonical, 'light-transparent')
  const packed = attachEditableDocument(light, editableDocumentFor(state))

  assert.match(packed, /data-dz-appearance=\"dark-transparent\"/)
  assert.ok(packed.includes('data-dz-appearance^=\"light-\"'))
  assert.ok(packed.includes('data-dz-appearance^=\"dark-\"'))
})

test('exports and reimports a deterministic golden set of renderer SVGs', async () => {
  for (const entry of cases) {
    const state = entry.state
    const rendered = await fixture(entry.name)
    const canonical = canonicalizeSvg(rendered, state.meta, entry.engine ?? state.type, entry.version)
    const first = exportEditableSvg(canonical, state)
    const repeated = exportEditableSvg(canonical, state)
    const imported = importEditableSvg(first)
    const reexported = exportEditableSvg(canonical, imported)

    assert.equal(first, repeated, `${entry.name} export must be deterministic`)
    assert.equal(first, reexported, `${entry.name} import/export must be byte-stable`)
    assert.deepEqual(imported, state, `${entry.name} state must round trip exactly`)
    assert.ok(first.includes("data-dz-appearance=\"" + state.presentation.appearance + "\""))
    assert.match(first, /data-dz-document="1"/)
    assert.equal((first.match(/<metadata data-dz-kind="document"/g) ?? []).length, 1)
  }
})

test('canonicalizes option keys before writing the editable document', () => {
  const state = {
    ...cases[0].state,
    options: { z: 1, a: { second: true, first: false } },
  }
  assert.deepEqual(editableDocumentFor(state).diagram.options, {
    a: { first: false, second: true },
    z: 1,
  })
})

test('rejects ordinary, ambiguous, unsupported, and lossy SVG documents', async () => {
  const plain = await fixture('safe-raw')
  assert.throws(() => importEditableSvg(plain), error => error.code === 'not_editable')

  const state = cases[3].state
  const canonical = canonicalizeSvg(plain, state.meta, state.type, cases[3].version)
  const editable = exportEditableSvg(canonical, state)
  assert.throws(
    () => importEditableSvg(editable.replace('data-dz-document="1"', 'data-dz-document="2"')),
    error => error.code === 'not_editable',
  )
  assert.throws(
    () => importEditableSvg(editable.replace('</svg>', '<metadata data-dz-kind="document" data-dz-schema="1">{}</metadata></svg>')),
    error => error.code === 'invalid_editable_document',
  )
  assert.throws(
    () => importEditableSvg(editable.replace('"type":"pikchr"', '"type":"unknown"')),
    error => error instanceof EditableSvgError && error.code === 'unsupported_type',
  )
  assert.throws(
    () => importEditableSvg(editable.replace('"appearance":"raw"', '"appearance":"invented"')),
    error => error instanceof EditableSvgError && error.code === 'invalid_document',
  )
})
