import assert from 'node:assert/strict'
import test from 'node:test'
import { editorBackendFor } from '../src/source-editor.js'
import { createEditor } from '../src/editors/textarea-editor.js'

test('selects Monaco for precise pointers and textarea for coarse pointers', () => {
  assert.equal(editorBackendFor({ search: '', coarsePointer: false }), 'monaco')
  assert.equal(editorBackendFor({ search: '', coarsePointer: true }), 'textarea')
})

test('allows an explicit diagnostic editor override', () => {
  assert.equal(editorBackendFor({ search: '?editor=textarea', coarsePointer: false }), 'textarea')
  assert.equal(editorBackendFor({ search: '?editor=monaco', coarsePointer: true }), 'monaco')
  assert.equal(editorBackendFor({ search: '?editor=unknown', coarsePointer: false }), 'monaco')
})

test('textarea backend preserves source and suppresses programmatic change notifications', () => {
  const previousDocument = globalThis.document
  const textarea = new FakeTextarea()
  globalThis.document = { createElement: () => textarea }
  let changes = 0
  let saves = 0
  const element = {
    replaceChildren(child) {
      assert.equal(child, textarea)
    },
  }

  try {
    const editor = createEditor({
      element,
      source: 'alpha\n',
      diagramType: 'mermaid',
      onChange: () => { changes += 1 },
      onSave: () => { saves += 1 },
    })

    assert.equal(editor.getValue(), 'alpha\n')
    assert.equal(textarea.attributes.get('aria-label'), 'Diagram source editor')

    textarea.selectionStart = 99
    textarea.selectionEnd = 99
    editor.setDocument({ source: 'βeta', diagramType: 'graphviz' })
    assert.equal(editor.getValue(), 'βeta')
    assert.equal(textarea.dataset.language, 'graphviz')
    assert.equal(textarea.selectionStart, 4)
    assert.equal(changes, 0)

    textarea.value = 'βeta!\n'
    textarea.dispatchEvent(new Event('input'))
    assert.equal(editor.getValue(), 'βeta!\n')
    assert.equal(changes, 1)

    const saveEvent = new Event('keydown', { cancelable: true })
    Object.assign(saveEvent, { metaKey: true, ctrlKey: false, key: 's' })
    textarea.dispatchEvent(saveEvent)
    assert.equal(saveEvent.defaultPrevented, true)
    assert.equal(saves, 1)

    editor.dispose()
    textarea.dispatchEvent(new Event('input'))
    assert.equal(changes, 1)
  } finally {
    globalThis.document = previousDocument
  }
})

class FakeTextarea extends EventTarget {
  constructor() {
    super()
    this.attributes = new Map()
    this.dataset = {}
    this.selectionStart = 0
    this.selectionEnd = 0
    this.value = ''
  }

  setAttribute(name, value) {
    this.attributes.set(name, value)
  }

  setSelectionRange(start, end) {
    this.selectionStart = start
    this.selectionEnd = end
  }

  focus() {}
  remove() {}
}
