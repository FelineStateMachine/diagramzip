import { basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { diagramTypes, isKnownDiagramType, languageFor } from './diagram-types.js'
import { exampleFor } from './examples.js'
import {
  DEFAULT_DIAGRAM_TYPE,
  DEFAULT_SOURCE,
  MAX_IMAGE_URL_LENGTH,
  decodeEditorHash,
  encodeEditorHash,
  imageUrl,
} from './state.js'
import { PreviewController } from './preview.js'
import './style.css'

const DRAFT_KEY = 'diagram.zip:draft:v1'
// TODO: Reintroduce dark mode once every renderer has a native or renderer-specific dark theme.
const language = new Compartment()
let renderTimer
let applyingExternalState = false
let activeType
const typeDrafts = new Map()

document.querySelector('#app').innerHTML = `
  <main class="app-shell">
    <header class="app-header">
      <a class="brand" href="#" aria-label="New diagram"><img class="brand-mark" src="/diagram.zip/icon.svg" alt=""><span>diagram.zip</span></a>
      <div class="header-meta">
        <span class="render-status" data-state="idle" role="status">Ready</span>
        <label class="type-picker">
          <span class="sr-only">Diagram type</span>
          <select id="diagram-type"></select>
        </label>
        <button class="primary-action" id="share" type="button">Share</button>
      </div>
    </header>

    <div class="mobile-tabs" role="tablist" aria-label="Workspace panel">
      <button type="button" role="tab" aria-selected="true" data-panel="editor">Edit</button>
      <button type="button" role="tab" aria-selected="false" data-panel="preview">Preview</button>
    </div>

    <div class="workspace" data-mobile-panel="editor">
      <section class="editor-panel" aria-label="Diagram source">
        <div id="editor"></div>
      </section>
      <section class="preview-panel" aria-label="Diagram preview">
        <div class="preview-stage" id="preview-stage">
          <img id="preview-image" alt="Rendered diagram" draggable="false" hidden>
          <p class="preview-empty">Your diagram will appear here.</p>
          <div class="preview-toolbar" aria-label="Preview controls">
            <button type="button" data-preview-action="zoom-out" aria-label="Zoom out">−</button>
            <button type="button" data-preview-action="zoom-in" aria-label="Zoom in">+</button>
            <button type="button" data-preview-action="fit">Fit</button>
            <button type="button" data-preview-action="one-to-one">1:1</button>
          </div>
          <div class="minimap" id="minimap" aria-label="Preview minimap" hidden>
            <img id="minimap-image" alt="" draggable="false">
            <span id="minimap-viewport" aria-hidden="true"></span>
          </div>
        </div>
      </section>
    </div>
  </main>

  <dialog id="share-dialog" aria-labelledby="share-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <div><p class="dialog-eyebrow">Share</p><h1 id="share-title">Take the diagram with you.</h1></div>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <div class="share-options">
        <label><span>Editable diagram</span><div><input id="editable-link" readonly><button type="button" data-copy="editable-link">Copy</button></div></label>
        <label><span>SVG image</span><div><input id="image-link" readonly><button type="button" data-copy="image-link">Copy</button></div><small id="image-link-note"></small></label>
        <label><span>Markdown</span><div><input id="markdown-link" readonly><button type="button" data-copy="markdown-link">Copy</button></div></label>
      </div>
    </form>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`

const typePicker = document.querySelector('#diagram-type')
for (const { id, label } of diagramTypes) {
  typePicker.add(new Option(label, id))
}

const initialState = loadInitialState()
typePicker.value = initialState.type
activeType = initialState.type
typeDrafts.set(initialState.type, initialState.source)

const syntaxColors = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--syntax-keyword)', fontWeight: '650' },
  { tag: tags.string, color: 'var(--syntax-string)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: [tags.number, tags.bool], color: 'var(--syntax-number)' },
  { tag: [tags.operator, tags.punctuation], color: 'var(--syntax-operator)' },
  { tag: [tags.variableName, tags.typeName], color: 'var(--syntax-variable)' },
])

const editor = new EditorView({
  state: EditorState.create({
    doc: initialState.source,
    extensions: [
      basicSetup,
      language.of(languageFor(initialState.type)),
      syntaxHighlighting(syntaxColors),
      EditorView.theme({
        '&': { height: '100%', backgroundColor: 'transparent' },
        '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
        '.cm-content': { padding: '28px 10px 80px' },
        '.cm-gutters': { backgroundColor: 'transparent', border: '0', paddingLeft: '12px' },
        '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--editor-active-line)' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--ink)' },
        '&.cm-focused': { outline: 'none' },
      }),
      EditorView.updateListener.of(update => {
        if (update.docChanged && !applyingExternalState) scheduleUpdate()
      }),
    ],
  }),
  parent: document.querySelector('#editor'),
})

const preview = new PreviewController({
  stage: document.querySelector('#preview-stage'),
  image: document.querySelector('#preview-image'),
  status: document.querySelector('.render-status'),
  minimap: document.querySelector('#minimap'),
  minimapImage: document.querySelector('#minimap-image'),
  minimapViewport: document.querySelector('#minimap-viewport'),
})

typePicker.addEventListener('change', () => {
  typeDrafts.set(activeType, editor.state.doc.toString())
  const type = typePicker.value
  const source = typeDrafts.get(type) ?? exampleFor(type)
  applyState({ type, source, options: {} })
})

document.querySelector('#share').addEventListener('click', openShareDialog)
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault()
  if (!confirm('Start a new diagram?')) return
  applyState({ type: DEFAULT_DIAGRAM_TYPE, source: DEFAULT_SOURCE, options: {} })
})

document.querySelectorAll('[data-preview-action]').forEach(button => {
  button.addEventListener('click', () => {
    const action = button.dataset.previewAction
    if (action === 'zoom-out') preview.zoom(0.8)
    if (action === 'zoom-in') preview.zoom(1.25)
    if (action === 'fit') preview.fit()
    if (action === 'one-to-one') preview.oneToOne()
  })
})

document.querySelectorAll('.mobile-tabs button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.workspace').dataset.mobilePanel = button.dataset.panel
    document.querySelectorAll('.mobile-tabs button').forEach(tab => {
      tab.setAttribute('aria-selected', String(tab === button))
    })
    if (button.dataset.panel === 'preview') preview.fit()
  })
})

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const input = document.querySelector(`#${button.dataset.copy}`)
    await copy(input.value)
    showToast('Copied')
  })
})

window.addEventListener('hashchange', () => {
  try {
    applyState(decodeEditorHash(location.hash), false)
  } catch {
    showToast('This diagram link could not be opened.')
  }
})

window.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    openShareDialog()
  }
})

function currentState() {
  return { type: typePicker.value, source: editor.state.doc.toString(), options: {} }
}

function scheduleUpdate(delay = 1200) {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(commitState, delay)
}

function commitState() {
  const state = currentState()
  const hash = encodeEditorHash(state)
  if (location.hash !== hash) history.replaceState(null, '', hash)
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state))
  preview.render(state)
}

function loadInitialState() {
  if (location.hash.startsWith('#v1/')) {
    try {
      const state = decodeEditorHash(location.hash)
      if (isKnownDiagramType(state.type)) return state
    } catch {
      // Fall back to the local draft or starter document.
    }
  }
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY))
    if (draft && isKnownDiagramType(draft.type) && typeof draft.source === 'string') return { ...draft, options: draft.options ?? {} }
  } catch {
    // Ignore invalid local data.
  }
  return { type: DEFAULT_DIAGRAM_TYPE, source: DEFAULT_SOURCE, options: {} }
}

function applyState(state, commit = true) {
  if (!isKnownDiagramType(state.type)) throw new Error('Unsupported diagram type.')
  applyingExternalState = true
  activeType = state.type
  typeDrafts.set(state.type, state.source)
  typePicker.value = state.type
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: state.source },
    effects: language.reconfigure(languageFor(state.type)),
  })
  applyingExternalState = false
  if (commit) commitState()
  else preview.render(currentState())
}

function openShareDialog() {
  commitState()
  const state = currentState()
  const editableLink = `${location.origin}${location.pathname}${encodeEditorHash(state)}`
  const svgLink = imageUrl(location.origin, state)
  const imageLinkTooLong = svgLink.length > MAX_IMAGE_URL_LENGTH
  const imageLink = document.querySelector('#image-link')
  const markdownLink = document.querySelector('#markdown-link')
  const imageCopy = document.querySelector('[data-copy="image-link"]')
  const markdownCopy = document.querySelector('[data-copy="markdown-link"]')
  document.querySelector('#editable-link').value = editableLink
  imageLink.value = imageLinkTooLong ? '' : svgLink
  imageLink.placeholder = imageLinkTooLong ? 'Unavailable for this diagram' : ''
  markdownLink.value = imageLinkTooLong ? '' : `![Diagram](${svgLink})`
  markdownLink.placeholder = imageLinkTooLong ? 'Unavailable for this diagram' : ''
  imageCopy.disabled = imageLinkTooLong
  markdownCopy.disabled = imageLinkTooLong
  document.querySelector('#image-link-note').textContent = imageLinkTooLong
    ? 'This diagram exceeds the safe image URL limit. Share the editable link instead.'
    : ''
  document.querySelector('#share-dialog').showModal()
}

async function copy(value) {
  if (navigator.clipboard) return navigator.clipboard.writeText(value)
  const textarea = document.createElement('textarea')
  textarea.value = value
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

function showToast(message) {
  const toast = document.querySelector('#toast')
  toast.textContent = message
  toast.dataset.visible = 'true'
  clearTimeout(showToast.timeout)
  showToast.timeout = setTimeout(() => delete toast.dataset.visible, 1800)
}

commitState()
