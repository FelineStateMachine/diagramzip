import { basicSetup } from 'codemirror'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { diagramTypes, isKnownDiagramType, languageFor } from './diagram-types.js'
import { exampleStateFor } from './examples.js'
import {
  DEFAULT_DIAGRAM_TYPE,
  normalizeMetadata,
  normalizePresentation,
} from './state.js'
import {
  aliasIdFromPath,
  editAliasUrl,
  PersistenceClient,
  PersistenceError,
  readAliasUrl,
  stableRenderUrl,
  writeCapabilityFromHash,
} from './persistence.js'
import {
  createLockedState,
  encryptLockedRender,
  encryptLockedState,
  MIN_PASSWORD_LENGTH,
  unlockLockedAlias,
  wrapBundleKey,
} from './encryption.js'
import { PreviewController } from './preview.js'
import './style.css'

const LOCAL_DRAFT_KEY = 'diagram.zip:draft:local:v2'
const ALIAS_DRAFT_PREFIX = 'diagram.zip:draft:alias:v1:'
const WRITE_CAPABILITY_PREFIX = 'diagram.zip:write:v1:'
// TODO: Reintroduce dark mode once every renderer has a native or renderer-specific dark theme.
const language = new Compartment()
const persistence = new PersistenceClient()
let renderTimer
let applyingExternalState = false
let activeType
let saving = false
let initialLoadError = ''
let remote = {
  aliasId: null,
  contentId: null,
  renderId: null,
  revision: null,
  mode: 'open',
  savedMode: null,
  writeCapability: null,
  savedState: null,
  savedSnapshot: null,
  bundleKey: null,
  keyEnvelope: null,
  encryptedContent: null,
  encryptedMetadata: null,
  keyEnvelopeDirty: false,
  dirty: true,
}
const typeDrafts = new Map()

document.querySelector('#app').innerHTML = `
  <main class="app-shell">
    <header class="app-header">
      <a class="brand" href="/" aria-label="New diagram"><img class="brand-mark" src="/diagram.zip/icon.svg" alt=""><span>diagram.zip</span></a>
      <div class="header-meta">
        <span class="render-status" data-state="idle" role="status">Ready</span>
        <label class="type-picker">
          <span class="sr-only">Diagram type</span>
          <select id="diagram-type"></select>
        </label>
        <button class="secondary-action" id="details" type="button">Details</button>
        <button class="secondary-action" id="save" type="button">Save</button>
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

  <dialog id="details-dialog" aria-labelledby="details-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="details-title">Diagram details</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <div class="details-fields">
        <label>
          <span>Title</span>
          <input id="diagram-title" maxlength="200" placeholder="Untitled diagram">
        </label>
        <label>
          <span>Description</span>
          <textarea id="diagram-description" maxlength="2000" rows="4" placeholder="What does this diagram show?"></textarea>
        </label>
        <fieldset class="presentation-fields">
          <legend>Presentation</legend>
          <label>
            <span>Canvas</span>
            <select id="diagram-background">
              <option value="">Renderer default</option>
              <option value="#ffffff">White</option>
              <option value="#f4f4f4">Soft gray</option>
            </select>
          </label>
          <label>
            <span>Padding</span>
            <div class="number-field"><input id="diagram-padding" type="number" min="0" max="256" step="4"><span>px</span></div>
          </label>
          <label class="checkbox-field"><input id="diagram-frame" type="checkbox"><span>Frame</span></label>
        </fieldset>
        <fieldset class="privacy-fields">
          <legend>Privacy</legend>
          <div>
            <strong id="privacy-label">Open</strong>
            <p id="privacy-description">Anyone with the read link can open and embed this diagram.</p>
          </div>
          <div class="privacy-actions">
            <button class="secondary-action" id="lock-diagram" type="button">Lock with password</button>
            <button class="secondary-action" id="change-password" type="button" hidden>Change password</button>
            <button class="secondary-action" id="unlock-diagram" type="button" hidden>Remove password</button>
          </div>
        </fieldset>
      </div>
      <div class="dialog-actions">
        <button class="primary-action" value="done">Done</button>
      </div>
    </form>
  </dialog>

  <dialog id="share-dialog" aria-labelledby="share-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="share-title">Share diagram</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <p class="share-status" id="share-status"></p>
      <div class="share-options">
        <label><span>Read link</span><div><input id="viewer-link" readonly><button type="button" data-copy="viewer-link">Copy</button></div></label>
        <label><span>Edit link</span><div><input id="editor-link" readonly><button type="button" data-copy="editor-link">Copy</button></div><small id="editor-link-note">Anyone with this link can update the diagram.</small></label>
        <label><span>SVG image</span><div><input id="image-link" readonly><button type="button" data-copy="image-link">Copy</button></div><small id="image-link-note"></small></label>
        <label><span>Markdown</span><div><input id="markdown-link" readonly><button type="button" data-copy="markdown-link">Copy</button></div></label>
      </div>
      <div class="dialog-actions share-actions">
        <button class="primary-action" id="share-save" type="button">Save</button>
      </div>
    </form>
  </dialog>

  <dialog id="conflict-dialog" aria-labelledby="conflict-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="conflict-title">Save conflict</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <p class="dialog-copy">Reload the saved version, or keep your work by saving it as a new diagram.</p>
      <div class="dialog-actions conflict-actions">
        <button class="secondary-action" value="reload">Reload saved</button>
        <button class="primary-action" value="copy">Save as new</button>
      </div>
    </form>
  </dialog>

  <dialog id="password-dialog" aria-labelledby="password-title">
    <form class="dialog-card" id="password-form">
      <div class="dialog-header">
        <h1 id="password-title">Enter password</h1>
        <button class="icon-button" id="password-cancel" type="button" aria-label="Close">×</button>
      </div>
      <p class="dialog-copy" id="password-copy"></p>
      <div class="details-fields">
        <label><span>Password</span><input id="diagram-password" type="password" autocomplete="current-password" required></label>
        <label id="password-confirm-field" hidden><span>Confirm password</span><input id="diagram-password-confirm" type="password" autocomplete="new-password"></label>
      </div>
      <p class="form-error" id="password-error" role="alert"></p>
      <div class="dialog-actions">
        <button class="primary-action" id="password-submit" type="submit">Unlock</button>
      </div>
    </form>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`

const typePicker = document.querySelector('#diagram-type')
const titleInput = document.querySelector('#diagram-title')
const descriptionInput = document.querySelector('#diagram-description')
const backgroundInput = document.querySelector('#diagram-background')
const paddingInput = document.querySelector('#diagram-padding')
const frameInput = document.querySelector('#diagram-frame')
for (const { id, label } of diagramTypes) {
  typePicker.add(new Option(label, id))
}

const initialState = await loadInitialState()
const initialMetadata = normalizeMetadata(initialState.meta)
const initialPresentation = normalizePresentation(initialState.presentation)
typePicker.value = initialState.type
titleInput.value = initialMetadata.title
descriptionInput.value = initialMetadata.description
backgroundInput.value = initialPresentation.background
paddingInput.value = String(initialPresentation.padding)
frameInput.checked = initialPresentation.frame
updateDocumentMetadata()
activeType = initialState.type
typeDrafts.set(initialState.type, initialState)

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
  typeDrafts.set(activeType, currentState())
  const type = typePicker.value
  applyState(typeDrafts.get(type) ?? exampleStateFor(type))
})

document.querySelector('#details').addEventListener('click', () => {
  document.querySelector('#details-dialog').showModal()
  titleInput.focus()
})
for (const input of [titleInput, descriptionInput, backgroundInput, paddingInput, frameInput]) {
  input.addEventListener('input', () => {
    updateDocumentMetadata()
    clearTimeout(commitDetails.timeout)
    commitDetails.timeout = setTimeout(commitDetails, 220)
  })
}
document.querySelector('#details-dialog').addEventListener('close', commitDetails)
document.querySelector('#lock-diagram').addEventListener('click', lockDiagram)
document.querySelector('#change-password').addEventListener('click', changeDiagramPassword)
document.querySelector('#unlock-diagram').addEventListener('click', unlockDiagram)
document.querySelector('#save').addEventListener('click', () => saveDiagram())
document.querySelector('#share').addEventListener('click', openShareDialog)
document.querySelector('#share-save').addEventListener('click', async () => {
  await saveDiagram()
  populateShareDialog()
})
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault()
  if (!confirm('Start a new diagram?')) return
  startNewDiagram()
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
    if (!input.value) return
    await copy(input.value)
    showToast('Copied')
  })
})

window.addEventListener('popstate', () => location.reload())

window.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    saveDiagram()
  }
})

function currentState() {
  const padding = Math.min(256, Math.max(0, Number.parseInt(paddingInput.value, 10) || 0))
  return {
    type: typePicker.value,
    source: editor.state.doc.toString(),
    options: {},
    meta: normalizeMetadata({ title: titleInput.value, description: descriptionInput.value }),
    presentation: normalizePresentation({
      background: backgroundInput.value,
      padding,
      frame: frameInput.checked,
    }),
  }
}

function scheduleUpdate(delay = 1200) {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(commitState, delay)
}

function commitState(render = true) {
  const state = currentState()
  storeDraft(state)
  remote.dirty = remote.keyEnvelopeDirty || remote.savedSnapshot !== stateSnapshot(state, remote.mode)
  updateSaveButton()
  updatePrivacyControls()
  if (render) preview.render(state)
}

function commitDetails() {
  clearTimeout(commitDetails.timeout)
  commitState()
}

async function loadInitialState() {
  const aliasId = aliasIdFromPath(location.pathname)
  if (aliasId) {
    const importedCapability = writeCapabilityFromHash(location.hash)
    if (importedCapability) {
      storeWriteCapability(aliasId, importedCapability)
    }
    if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`)
    try {
      const alias = await persistence.getAlias(aliasId)
      const writeCapability = importedCapability ?? loadWriteCapability(aliasId)
      if (alias.mode === 'locked') {
        const unlocked = await promptToUnlock(alias)
        if (!unlocked) {
          initialLoadError = 'A password is required to open this diagram.'
          return exampleStateFor(DEFAULT_DIAGRAM_TYPE)
        }
        setRemoteAlias(alias, writeCapability, unlocked.state, unlocked.bundleKey)
        return unlocked.state
      }
      setRemoteAlias(alias, writeCapability, alias.state)
      const draft = loadDraft(`${ALIAS_DRAFT_PREFIX}${aliasId}`)
      if (draft?.revision === alias.revision) return draft.state
      return alias.state
    } catch (error) {
      initialLoadError = error instanceof PersistenceError
        ? error.message
        : 'This saved diagram could not be loaded.'
    }
  }
  if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`)
  const draft = loadDraft(LOCAL_DRAFT_KEY)
  if (draft) return draft.state
  return exampleStateFor(DEFAULT_DIAGRAM_TYPE)
}

function applyState(state, commit = true) {
  if (!isKnownDiagramType(state.type)) throw new Error('Unsupported diagram type.')
  const meta = normalizeMetadata(state.meta)
  const presentation = normalizePresentation(state.presentation)
  applyingExternalState = true
  activeType = state.type
  typeDrafts.set(state.type, { ...state, meta, presentation })
  typePicker.value = state.type
  titleInput.value = meta.title
  descriptionInput.value = meta.description
  backgroundInput.value = presentation.background
  paddingInput.value = String(presentation.padding)
  frameInput.checked = presentation.frame
  updateDocumentMetadata()
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
  populateShareDialog()
  document.querySelector('#share-dialog').showModal()
}

function populateShareDialog() {
  const hasAlias = Boolean(remote.aliasId)
  const savedLocked = hasAlias && remote.savedMode === 'locked'
  const viewerLink = hasAlias ? readAliasUrl(location.origin, remote.aliasId) : ''
  const editorLink = hasAlias && remote.writeCapability
    ? editAliasUrl(location.origin, remote.aliasId, remote.writeCapability)
    : ''
  const savedState = savedLocked ? null : remote.savedState
  const svgLink = savedState ? stableRenderUrl(location.origin, remote.aliasId, 'svg') : ''
  const imageLink = document.querySelector('#image-link')
  const markdownLink = document.querySelector('#markdown-link')
  const markdownTitle = savedState?.meta.title.trim().replace(/[\[\]\r\n]/g, ' ') || 'Diagram'

  setShareField('viewer-link', viewerLink, 'Save to create a read link')
  setShareField('editor-link', editorLink, hasAlias ? 'No write capability on this device' : 'Save to create an edit link')
  const embedPlaceholder = savedLocked
    ? 'Encrypted diagrams cannot be embedded'
    : hasAlias ? 'Unavailable for this diagram' : 'Save to create an image link'
  setShareField('image-link', svgLink, embedPlaceholder)
  setShareField('markdown-link', !svgLink ? '' : `![${markdownTitle}](${svgLink})`, savedLocked ? 'Encrypted diagrams cannot be embedded' : hasAlias ? 'Unavailable for this diagram' : 'Save to create Markdown')

  document.querySelector('#editor-link-note').textContent = editorLink
    ? 'Anyone with this link can update the diagram.'
    : hasAlias
      ? 'This device has read-only access. Save a copy to create a new edit link.'
      : 'The edit link is a bearer credential and appears after saving.'
  document.querySelector('#image-link-note').textContent = savedLocked
    ? 'This diagram is encrypted in your browser. Image embeds are disabled because they cannot ask for its password.'
    : ''
  imageLink.dataset.state = savedLocked ? 'unavailable' : 'ready'
  markdownLink.dataset.state = savedLocked ? 'unavailable' : 'ready'

  const shareStatus = document.querySelector('#share-status')
  const shareSave = document.querySelector('#share-save')
  shareSave.hidden = hasAlias && !remote.dirty
  if (!hasAlias) {
    shareStatus.textContent = 'Save this diagram to create stable share links.'
    shareSave.textContent = 'Save diagram'
  } else if (remote.dirty && remote.writeCapability) {
    shareStatus.textContent = 'These links show the last saved version. Save your changes before sharing.'
    shareSave.textContent = 'Save changes'
  } else if (remote.dirty) {
    shareStatus.textContent = 'You are editing a read-only diagram. Save a copy to share your changes.'
    shareSave.textContent = 'Save as new'
  } else if (savedLocked) {
    shareStatus.textContent = remote.writeCapability
      ? 'The read link asks for the password. The edit link also grants permission to save changes.'
      : 'The read link asks for the password. This device has read-only access.'
  } else {
    shareStatus.textContent = remote.writeCapability
      ? 'Copy a read link, or share the edit capability carefully.'
      : 'This diagram is read-only on this device.'
  }
}

function setShareField(id, value, placeholder) {
  const input = document.querySelector(`#${id}`)
  const button = document.querySelector(`[data-copy="${id}"]`)
  input.value = value
  input.placeholder = value ? '' : placeholder
  button.disabled = !value
}

async function saveDiagram() {
  if (saving) return false
  commitState(false)
  const state = currentState()
  if (remote.aliasId && !remote.dirty) {
    showToast('Already saved')
    return true
  }

  saving = true
  updateSaveButton()
  try {
    if (remote.aliasId && remote.writeCapability) {
      const alias = remote.mode === 'locked'
        ? await persistence.updateLockedAlias(
            remote.aliasId,
            await lockedPayloadForState(state),
            remote.revision,
            remote.writeCapability,
          )
        : await persistence.updateAlias(
            remote.aliasId,
            state,
            remote.revision,
            remote.writeCapability,
          )
      setRemoteAlias(alias, remote.writeCapability, state, remote.mode === 'locked' ? remote.bundleKey : null)
      removeDraft(`${ALIAS_DRAFT_PREFIX}${remote.aliasId}`)
      await cacheSavedRenders(state)
      showToast('Saved')
      return true
    }
    const savedAsCopy = Boolean(remote.aliasId)
    await createNewAlias(state)
    showToast(savedAsCopy ? 'Saved as a new diagram' : 'Saved')
    return true
  } catch (error) {
    if (error instanceof PersistenceError && error.status === 412 && remote.aliasId) {
      return await resolveConflict(state)
    }
    showToast(error instanceof Error ? error.message : 'Could not save this diagram.')
    return false
  } finally {
    saving = false
    updateSaveButton()
  }
}

async function createNewAlias(state) {
  const previousAliasId = remote.aliasId
  const previousDraftKey = previousAliasId ? `${ALIAS_DRAFT_PREFIX}${previousAliasId}` : LOCAL_DRAFT_KEY
  const bundleKey = remote.bundleKey
  const alias = remote.mode === 'locked'
    ? await persistence.createLockedAlias(await lockedPayloadForState(state))
    : await persistence.createAlias(state)
  setRemoteAlias(alias, alias.writeCapability, state, remote.mode === 'locked' ? bundleKey : null)
  storeWriteCapability(alias.aliasId, alias.writeCapability)
  removeDraft(previousDraftKey)
  history.pushState(null, '', `/d/${alias.aliasId}`)
  await cacheSavedRenders(state)
}

async function lockedPayloadForState(state) {
  if (!(remote.bundleKey instanceof Uint8Array) || !remote.keyEnvelope) {
    throw new Error('This diagram is missing its browser encryption key.')
  }
  const contentIsUnchanged = remote.savedMode === 'locked'
    && remote.savedSnapshot === stateSnapshot(state, 'locked')
    && remote.encryptedContent
    && remote.encryptedMetadata
  if (contentIsUnchanged) {
    return {
      mode: 'locked',
      encryptedContent: remote.encryptedContent,
      encryptedMetadata: remote.encryptedMetadata,
      keyEnvelope: remote.keyEnvelope,
    }
  }
  return encryptLockedState(state, remote.bundleKey, remote.keyEnvelope)
}

async function cacheSavedRenders(state) {
  if (!remote.aliasId || !remote.writeCapability) return
  await preview.render(state)
  const svg = preview.svgBlobFor(state)
  if (!svg) return

  const renders = [['svg', svg]]
  try {
    renders.push(['png', await svgToPngBlob(svg)])
  } catch {
    // SVG remains the canonical cached render when this browser cannot rasterize it.
  }

  const uploads = renders.map(async ([format, blob]) => {
    const render = remote.mode === 'locked'
      ? await encryptLockedRender(blob, remote.bundleKey, format)
      : blob
    return persistence.uploadRender({
      aliasId: remote.aliasId,
      renderId: remote.renderId,
      revision: remote.revision,
      writeCapability: remote.writeCapability,
      format,
      mode: remote.mode,
      render,
    })
  })
  const results = await Promise.allSettled(uploads)
  if (results.every(result => result.status === 'rejected')) {
    preview.setStatus('Saved; render cache unavailable', 'ready')
  }
}

async function svgToPngBlob(svg) {
  const objectUrl = URL.createObjectURL(svg)
  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()
    const maxDimension = 4096
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable.')
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Could not create a PNG render.')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function lockDiagram() {
  const password = await askPassword({
    title: 'Lock diagram',
    copy: 'The source, metadata, and saved render will be encrypted in this browser. The password cannot be recovered.',
    submitLabel: 'Lock diagram',
    confirm: true,
  })
  if (password === null) return
  try {
    const { bundleKey, payload } = await createLockedState(currentState(), password)
    remote.mode = 'locked'
    remote.bundleKey = bundleKey
    remote.keyEnvelope = payload.keyEnvelope
    remote.encryptedContent = payload.encryptedContent
    remote.encryptedMetadata = payload.encryptedMetadata
    remote.keyEnvelopeDirty = true
    removeDraft(remote.aliasId ? `${ALIAS_DRAFT_PREFIX}${remote.aliasId}` : LOCAL_DRAFT_KEY)
    commitState(false)
    showToast('Locked in this browser — save to persist')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not lock this diagram.')
  }
}

async function changeDiagramPassword() {
  if (remote.mode !== 'locked' || !(remote.bundleKey instanceof Uint8Array)) return
  const password = await askPassword({
    title: 'Change password',
    copy: 'Only the encrypted bundle key will be rewrapped. The diagram content does not need to be re-encrypted.',
    submitLabel: 'Change password',
    confirm: true,
  })
  if (password === null) return
  try {
    remote.keyEnvelope = await wrapBundleKey(remote.bundleKey, password)
    remote.keyEnvelopeDirty = true
    commitState(false)
    showToast('Password changed — save to persist')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not change the password.')
  }
}

function unlockDiagram() {
  if (remote.mode !== 'locked') return
  if (!confirm('Remove password protection? The next save will store the diagram in plaintext.')) return
  remote.mode = 'open'
  remote.keyEnvelopeDirty = false
  commitState(false)
  showToast('Password removed — save to persist')
}

async function promptToUnlock(alias) {
  while (true) {
    const password = await askPassword({
      title: 'Unlock diagram',
      copy: 'Decryption happens only in this browser. The password is never sent to diagram.zip.',
      submitLabel: 'Unlock',
      confirm: false,
    })
    if (password === null) return null
    try {
      return await unlockLockedAlias(alias, password)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not unlock this diagram.')
    }
  }
}

function askPassword({ title, copy: copyText, submitLabel, confirm: shouldConfirm }) {
  const dialog = document.querySelector('#password-dialog')
  const form = document.querySelector('#password-form')
  const passwordInput = document.querySelector('#diagram-password')
  const confirmInput = document.querySelector('#diagram-password-confirm')
  const confirmField = document.querySelector('#password-confirm-field')
  const error = document.querySelector('#password-error')
  document.querySelector('#password-title').textContent = title
  document.querySelector('#password-copy').textContent = copyText
  document.querySelector('#password-submit').textContent = submitLabel
  confirmField.hidden = !shouldConfirm
  passwordInput.autocomplete = shouldConfirm ? 'new-password' : 'current-password'
  passwordInput.value = ''
  confirmInput.value = ''
  error.textContent = ''

  return new Promise(resolve => {
    let settled = false
    const finish = value => {
      if (settled) return
      settled = true
      form.removeEventListener('submit', submit)
      document.querySelector('#password-cancel').removeEventListener('click', cancel)
      dialog.removeEventListener('cancel', cancel)
      dialog.removeEventListener('close', closed)
      resolve(value)
    }
    const submit = event => {
      event.preventDefault()
      const password = passwordInput.value
      if (shouldConfirm && password.length < MIN_PASSWORD_LENGTH) {
        error.textContent = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        passwordInput.focus()
        return
      }
      if (shouldConfirm && password !== confirmInput.value) {
        error.textContent = 'The passwords do not match.'
        confirmInput.focus()
        return
      }
      dialog.close()
      finish(password)
    }
    const cancel = event => {
      event.preventDefault()
      dialog.close()
      finish(null)
    }
    const closed = () => finish(null)
    form.addEventListener('submit', submit)
    document.querySelector('#password-cancel').addEventListener('click', cancel)
    dialog.addEventListener('cancel', cancel)
    dialog.addEventListener('close', closed)
    dialog.showModal()
    passwordInput.focus()
  })
}

async function resolveConflict(localState) {
  const choice = await askConflict()
  if (choice === 'reload') {
    const aliasId = remote.aliasId
    const writeCapability = remote.writeCapability
    try {
      const alias = await persistence.getAlias(aliasId)
      let state = alias.state
      let bundleKey = null
      if (alias.mode === 'locked') {
        const unlocked = await promptToUnlock(alias)
        if (!unlocked) return false
        state = unlocked.state
        bundleKey = unlocked.bundleKey
      }
      setRemoteAlias(alias, writeCapability, state, bundleKey)
      removeDraft(`${ALIAS_DRAFT_PREFIX}${aliasId}`)
      applyState(state, false)
      updateSaveButton()
      showToast('Reloaded saved diagram')
      return true
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not reload this diagram.')
      return false
    }
  }
  if (choice === 'copy') {
    await createNewAlias(localState)
    showToast('Saved as a new diagram')
    return true
  }
  return false
}

function askConflict() {
  const dialog = document.querySelector('#conflict-dialog')
  dialog.returnValue = ''
  dialog.showModal()
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue), { once: true })
  })
}

function stateSnapshot(state, mode = 'open') {
  return JSON.stringify({
    mode,
    type: state.type,
    source: state.source,
    options: state.options ?? {},
    meta: normalizeMetadata(state.meta),
    presentation: normalizePresentation(state.presentation),
  })
}

function normalizeStoredState(value) {
  if (!value || typeof value !== 'object' || !isKnownDiagramType(value.type) || typeof value.source !== 'string') {
    return null
  }
  try {
    return {
      type: value.type,
      source: value.source,
      options: value.options ?? {},
      meta: normalizeMetadata(value.meta),
      presentation: normalizePresentation(value.presentation),
    }
  } catch {
    return null
  }
}

function loadDraft(key) {
  try {
    const draft = JSON.parse(localStorage.getItem(key))
    const state = normalizeStoredState(draft?.state)
    if (!state) return null
    return { state, revision: draft.revision ?? null }
  } catch {
    return null
  }
}

function storeDraft(state) {
  if (remote.mode === 'locked') return
  const key = remote.aliasId ? `${ALIAS_DRAFT_PREFIX}${remote.aliasId}` : LOCAL_DRAFT_KEY
  try {
    localStorage.setItem(key, JSON.stringify({ state, revision: remote.revision }))
  } catch {
    // The editor remains usable when storage is unavailable.
  }
}

function removeDraft(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore unavailable storage.
  }
}

function storeWriteCapability(aliasId, writeCapability) {
  try {
    localStorage.setItem(`${WRITE_CAPABILITY_PREFIX}${aliasId}`, writeCapability)
  } catch {
    // The edit link can be copied even when persistent storage is unavailable.
  }
}

function loadWriteCapability(aliasId) {
  try {
    return writeCapabilityFromHash(`#w=${localStorage.getItem(`${WRITE_CAPABILITY_PREFIX}${aliasId}`) ?? ''}`)
  } catch {
    return null
  }
}

function setRemoteAlias(alias, writeCapability, state, bundleKey = null) {
  remote = {
    aliasId: alias.aliasId,
    contentId: alias.contentId,
    renderId: alias.renderId,
    revision: alias.revision,
    mode: alias.mode,
    savedMode: alias.mode,
    writeCapability,
    savedState: state,
    savedSnapshot: stateSnapshot(state, alias.mode),
    bundleKey,
    keyEnvelope: alias.mode === 'locked' ? alias.keyEnvelope : null,
    encryptedContent: alias.mode === 'locked' ? alias.encryptedContent : null,
    encryptedMetadata: alias.mode === 'locked' ? alias.encryptedMetadata : null,
    keyEnvelopeDirty: false,
    dirty: false,
  }
  updatePrivacyControls()
  updateSaveButton()
}

function updateSaveButton() {
  const button = document.querySelector('#save')
  if (saving) {
    button.textContent = 'Saving…'
    button.disabled = true
    return
  }
  if (remote.aliasId && !remote.dirty) {
    button.textContent = 'Saved'
    button.disabled = true
    return
  }
  button.textContent = remote.aliasId && !remote.writeCapability ? 'Save copy' : 'Save'
  button.disabled = false
}

function updatePrivacyControls() {
  const locked = remote.mode === 'locked'
  document.querySelector('#privacy-label').textContent = locked ? 'Password locked' : 'Open'
  document.querySelector('#privacy-description').textContent = locked
    ? 'Source, metadata, and saved renders are encrypted in your browser. Password-locked diagrams cannot be embedded.'
    : 'Anyone with the read link can open and embed this diagram.'
  document.querySelector('#lock-diagram').hidden = locked
  document.querySelector('#change-password').hidden = !locked
  document.querySelector('#unlock-diagram').hidden = !locked
}

function startNewDiagram() {
  remote = {
    aliasId: null,
    contentId: null,
    renderId: null,
    revision: null,
    mode: 'open',
    savedMode: null,
    writeCapability: null,
    savedState: null,
    savedSnapshot: null,
    bundleKey: null,
    keyEnvelope: null,
    encryptedContent: null,
    encryptedMetadata: null,
    keyEnvelopeDirty: false,
    dirty: true,
  }
  typeDrafts.clear()
  history.pushState(null, '', '/')
  applyState(exampleStateFor(DEFAULT_DIAGRAM_TYPE))
}

function updateDocumentMetadata() {
  const title = titleInput.value.trim()
  const description = descriptionInput.value.trim()
  document.title = title ? `${title} — diagram.zip` : 'diagram.zip'
  document.querySelector('meta[name="description"]').content = description || 'Create diagrams from text and share them as a link.'
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
if (initialLoadError) showToast(initialLoadError)
