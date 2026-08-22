import { diagramTypeFromQuery, diagramTypes, isKnownDiagramType, urlWithDiagramType } from './diagram-types.js'
import { exampleStateFor } from './examples.js'
import { exampleStateForTheme } from './example-defaults.js'
import {
  DETAILS_MODEL_URI,
  detailsStateWithTitle,
  parseDetailsDocument,
  serializeDetailsDocument,
} from './details-document.js'
import { createSourceEditor } from './source-editor.js'
import { stateForTypeChange } from './type-drafts.js'
import { workingStateIsDirty, workingStateSnapshot } from './working-state.js'
import {
  DEFAULT_DIAGRAM_TYPE,
  documentTitle,
  normalizeMetadata,
  normalizePresentation,
  packedSvgUrl,
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
import { exportEditableSvg } from './editable-svg.js'
import { importEditableSvgFile, importEditableSvgInput } from './editable-svg-input.js'
import { createCommandPaletteModel } from './command-palette.js'
import { launcherCatalogGroups } from './launcher-catalog.js'
import { createLocalDocuments } from './local-documents.js'
import { mobilePanelSwitchState } from './mobile-panel.js'
import './style.css'

const ALIAS_DRAFT_PREFIX = 'diagram.zip:draft:alias:v1:'
const WRITE_CAPABILITY_PREFIX = 'diagram.zip:write:v1:'
const persistence = new PersistenceClient()
const localDocuments = createLocalDocuments()
const systemColorScheme = matchMedia('(prefers-color-scheme: dark)')
const initialTemplateTheme = systemColorScheme.matches ? 'dark' : 'light'
document.documentElement.dataset.theme = systemColorScheme.matches ? 'dark' : 'light'
let renderTimer
let detailsCommitTimer
let activeType
let saving = false
let lastFileSnapshot = null
let localDocumentId = new URLSearchParams(location.search).get('doc')
let initialLoadError = ''
let restoredDetailsSource = null
let remote = emptyRemoteState()

function templateStateFor(type) {
  return exampleStateForTheme(exampleStateFor(type), initialTemplateTheme)
}

document.querySelector('#app').innerHTML = `
  <main class="app-shell">
    <header class="app-header">
      <a class="brand" href="/" aria-label="Open launcher" title="Open launcher"><img class="brand-mark" src="/icon.svg?v=4" alt=""></a>
      <div class="document-identity">
        <input class="document-title" id="diagram-title" type="text" maxlength="200" placeholder="Untitled" aria-label="Diagram title" autocomplete="off" spellcheck="false">
        <button class="document-reset" id="quick-reset" type="button" data-visible="false" aria-hidden="true" tabindex="-1">
          <span class="unsaved-indicator" id="unsaved-indicator" aria-hidden="true"></span>
          <svg class="document-reset-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 9a8 8 0 1 1-.1 6M4 9V4m0 5h5"/>
          </svg>
        </button>
      </div>
      <span class="header-spacer"></span>
      <span class="render-status" data-state="idle" role="status">Ready</span>
      <select id="diagram-type" hidden aria-hidden="true"></select>
      <button class="type-command" id="command-type" type="button" aria-haspopup="dialog" aria-controls="command-dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 8h13m-3-3 3 3-3 3M20 16H7m3-3-3 3 3 3"/></svg>
        <span id="command-type-label">Diagram</span>
      </button>
      <button class="command-trigger" id="command-trigger" type="button" aria-haspopup="dialog" aria-controls="command-dialog" aria-label="Open command palette">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
        <kbd>⌘K</kbd>
      </button>
    </header>

    <aside class="draft-bar" id="draft-bar" aria-live="polite" hidden>
      <p>This device has changes that are not part of the published share link.</p>
      <div>
        <button class="secondary-action" id="restore-saved" type="button">
          <span>Restore published</span>
          <svg class="draft-reset-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4.5 9V4.5H9"/>
            <path d="M5.2 7.2A8 8 0 1 1 4.6 16"/>
          </svg>
        </button>
        <button class="primary-action" id="make-copy" type="button">Make a copy</button>
      </div>
    </aside>

    <div class="workspace" data-mobile-panel="editor">
      <section class="editor-panel" id="editor-panel" aria-label="Diagram input">
        <div class="editor-tabs" role="tablist" aria-label="Diagram input">
          <button id="source-tab" type="button" role="tab" aria-selected="true" aria-controls="editor" tabindex="0">Source</button>
          <button id="details-tab" type="button" role="tab" aria-selected="false" aria-controls="details-editor" tabindex="-1">Details</button>
        </div>
        <div class="editor-surfaces">
          <div id="editor" role="tabpanel" aria-labelledby="source-tab"></div>
          <div id="details-editor" role="tabpanel" aria-labelledby="details-tab" hidden></div>
        </div>
        <div class="syntax-dock" id="syntax-dock" aria-label="Diagnostics" data-severity="none">
          <span class="syntax-dock-summary" id="syntax-dock-summary" aria-label="No diagnostics" title="No diagnostics">
            <svg class="diagnostic-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <g data-diagnostic-icon="none"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.2 2.2 4.8-5"/></g>
              <g data-diagnostic-icon="error"><circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6m0-6-6 6"/></g>
              <g data-diagnostic-icon="warning"><path d="M12 3.5 21 20H3L12 3.5Z"/><path d="M12 9v5m0 2.7v.1"/></g>
              <g data-diagnostic-icon="info"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5V16m0-8.5v.1"/></g>
            </svg>
            <span id="syntax-message-count">0</span>
          </span>
          <span class="details-validation" id="details-validation" role="status">No problems</span>
        </div>
      </section>
      <section class="preview-panel" id="preview-panel" aria-label="Diagram preview">
        <div class="preview-stage" id="preview-stage">
          <img id="preview-image" alt="Rendered diagram" draggable="false" hidden>
          <p class="preview-empty">Your diagram will appear here.</p>
          <div class="preview-toolbar" aria-label="Preview controls">
            <div class="preview-zoom-controls" role="group" aria-label="Zoom">
              <button type="button" data-preview-action="zoom-out" aria-label="Zoom out">−</button>
              <button type="button" data-preview-action="zoom-in" aria-label="Zoom in">+</button>
              <button type="button" data-preview-action="fit">Fit</button>
              <button type="button" data-preview-action="one-to-one">1:1</button>
            </div>
            <span class="preview-toolbar-divider" aria-hidden="true"></span>
            <div class="preview-appearance-controls" aria-label="Preview appearance">
              <button id="preview-raw" type="button" aria-pressed="false" title="Show the renderer's original appearance">Raw</button>
              <button id="preview-theme-toggle" type="button" data-preview-theme="light" aria-pressed="false" aria-label="Preview theme: Light" title="Preview theme: Light · click for dark">
                <svg class="preview-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="12" r="8"/>
                  <path class="preview-theme-fill" d="M12 4a8 8 0 0 1 0 16Z"/>
                </svg>
              </button>
              <button id="preview-transparent" type="button" aria-pressed="true" aria-label="Transparent background" title="Transparent background">
                <svg class="preview-control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="4" y="4" width="16" height="16" rx="1.5"/>
                  <path class="preview-transparency-fill" d="M4 4h8v8H4zM12 12h8v8h-8z"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="minimap" id="minimap" aria-label="Preview minimap" hidden>
            <img id="minimap-image" alt="" draggable="false">
            <span id="minimap-viewport" aria-hidden="true"></span>
          </div>
        </div>
      </section>
    </div>
    <button class="mobile-panel-switch" type="button" data-target-panel="preview" aria-controls="preview-panel" aria-label="Show preview" title="Show preview">
      <svg data-panel-icon="preview" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6Z"/>
        <circle cx="12" cy="12" r="2.6"/>
      </svg>
      <svg data-panel-icon="editor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>
      </svg>
    </button>
  </main>

  <dialog id="share-dialog" aria-labelledby="share-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="share-title">Share diagram</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <p class="share-status" id="share-status"></p>
      <div class="share-action-list">
        <button class="primary-action" type="button" data-share-action="publish">Publish</button>
        <button class="secondary-action" type="button" data-share-action="encrypt-publish">Encrypt &amp; Publish</button>
        <button class="secondary-action" type="button" data-share-action="file">Save as File</button>
        <button class="secondary-action" type="button" data-share-action="svg-url">Copy SVG URL</button>
        <button class="secondary-action" type="button" data-share-action="markdown">Copy as Markdown</button>
      </div>
      <fieldset class="privacy-fields share-privacy-fields">
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
      <div class="share-options">
        <label><span>Read link</span><div><input id="viewer-link" readonly><button type="button" data-copy="viewer-link">Copy</button></div></label>
        <label><span>Edit link</span><div><input id="editor-link" readonly><button type="button" data-copy="editor-link">Copy</button></div><small id="editor-link-note">Anyone with this link can update the diagram.</small></label>
      </div>
    </form>
  </dialog>

  <dialog id="open-dialog" aria-labelledby="open-title">
    <form class="dialog-card" id="open-form">
      <div class="dialog-header">
        <h1 id="open-title">Open editable SVG</h1>
        <button class="icon-button" id="open-cancel" type="button" aria-label="Close">×</button>
      </div>
      <p class="dialog-copy">Choose a Diagram.zip SVG file, or paste its SVG markup or URL. Other SVG images are not treated as source.</p>
      <input id="open-file-input" type="file" accept=".svg,image/svg+xml" hidden>
      <button class="secondary-action open-file-action" id="open-file" type="button">Choose SVG File</button>
      <div class="details-fields open-input-fields">
        <label><span>SVG markup or URL</span><textarea id="open-svg-input" inputmode="url" placeholder="&lt;svg …&gt; or https://example.com/diagram.svg"></textarea></label>
      </div>
      <p class="form-error" id="open-error" role="alert"></p>
      <div class="dialog-actions">
        <button class="primary-action" id="open-submit" type="submit">Open</button>
      </div>
    </form>
  </dialog>

  <dialog id="conflict-dialog" aria-labelledby="conflict-title">
    <form method="dialog" class="dialog-card">
      <div class="dialog-header">
        <h1 id="conflict-title">Publish conflict</h1>
        <button class="icon-button" value="cancel" aria-label="Close">×</button>
      </div>
      <p class="dialog-copy">Reload the published version, or keep your work by publishing it as a new diagram.</p>
      <div class="dialog-actions conflict-actions">
        <button class="secondary-action" value="reload">Reload published</button>
        <button class="primary-action" value="copy">Publish as new</button>
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

  <dialog class="command-dialog" id="command-dialog" aria-label="Command palette">
    <div class="command-card">
      <label class="command-search">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
        <span class="command-scope" id="command-scope" hidden>Change format</span>
        <span class="sr-only">Filter commands</span>
        <input id="command-input" type="search" placeholder="Type a command" autocomplete="off" spellcheck="false" aria-controls="command-results" aria-autocomplete="list">
        <kbd>esc</kbd>
      </label>
      <div class="command-results" id="command-results" role="listbox" aria-label="Commands"></div>
      <footer class="command-footer">
        <span><kbd>↑↓</kbd> navigate</span>
        <span><kbd>↵</kbd> run</span>
        <span id="command-footer-note"><kbd>⌘K</kbd> anywhere</span>
      </footer>
    </div>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite" popover="manual"></div>
`

const typePicker = document.querySelector('#diagram-type')
const titleInput = document.querySelector('#diagram-title')
const previewRawButton = document.querySelector('#preview-raw')
const previewTransparentButton = document.querySelector('#preview-transparent')
const previewThemeButton = document.querySelector('#preview-theme-toggle')
let supportedPreviewAppearances = new Set(['raw'])
let previewTheme = systemColorScheme.matches ? 'dark' : 'light'
let previewTransparent = true
let detailsValid = true
let detailsError = ''
let detailsState
let detailsEditor = null
let sourceEditor = null
let previewHasBeenRevealed = false
for (const { id, label } of diagramTypes) {
  typePicker.add(new Option(label, id))
}

const initialState = await loadInitialState()
detailsState = {
  meta: normalizeMetadata(initialState.meta),
  presentation: normalizePresentation(initialState.presentation),
}
typePicker.value = initialState.type
updateTypeCommand()
syncPreviewAppearanceControls()
updateDocumentMetadata()
activeType = initialState.type

sourceEditor = await createSourceEditor({
  element: document.querySelector('#editor'),
  source: initialState.source,
  diagramType: initialState.type,
  onChange: scheduleUpdate,
  onSave: performPrimarySaveAction,
})

detailsEditor = await createSourceEditor({
  element: document.querySelector('#details-editor'),
  source: restoredDetailsSource ?? serializeDetailsDocument(initialState),
  diagramType: initialState.type,
  language: 'json',
  modelUri: DETAILS_MODEL_URI,
  ariaLabel: 'Diagram details editor',
  onChange: scheduleDetailsUpdate,
  onSave: performPrimarySaveAction,
})
validateDetailsDocument(false)
applySystemTheme()

const preview = new PreviewController({
  stage: document.querySelector('#preview-stage'),
  image: document.querySelector('#preview-image'),
  status: document.querySelector('.render-status'),
  minimap: document.querySelector('#minimap'),
  minimapImage: document.querySelector('#minimap-image'),
  minimapViewport: document.querySelector('#minimap-viewport'),
  autoTheme: previewTheme,
  onAppearances: updateAppearanceOptions,
  onError: message => showToast(message, 4000),
})
systemColorScheme.addEventListener('change', () => {
  applySystemTheme()
  if (detailsState.presentation.appearance.startsWith('auto-')) {
    preview.setAutoTheme(systemColorScheme.matches ? 'dark' : 'light')
    syncPreviewAppearanceControls()
  }
})

typePicker.addEventListener('change', () => {
  changeDiagramType(typePicker.value)
})

document.querySelector('#lock-diagram').addEventListener('click', lockDiagram)
document.querySelector('#change-password').addEventListener('click', changeDiagramPassword)
document.querySelector('#unlock-diagram').addEventListener('click', unlockDiagram)
document.querySelector('#restore-saved').addEventListener('click', restoreSavedDiagram)
document.querySelector('#quick-reset').addEventListener('click', quickResetDocument)
document.querySelector('#make-copy').addEventListener('click', makeDraftCopy)
document.querySelector('#command-trigger').addEventListener('click', () => openCommandPalette())
document.querySelector('#command-type').addEventListener('click', () => openCommandPalette('format'))
titleInput.addEventListener('focus', beginTitleEdit)
titleInput.addEventListener('input', updateTitleFromHeader)
titleInput.addEventListener('blur', finishTitleEdit)
titleInput.addEventListener('keydown', handleTitleKeydown)
document.querySelectorAll('[data-share-action]').forEach(button => {
  button.addEventListener('click', () => performShareAction(button.dataset.shareAction))
})
document.querySelector('#open-form').addEventListener('submit', submitEditableSvgInput)
document.querySelector('#open-cancel').addEventListener('click', () => document.querySelector('#open-dialog').close())
document.querySelector('#open-file').addEventListener('click', () => document.querySelector('#open-file-input').click())
document.querySelector('#open-file-input').addEventListener('change', openSelectedEditableSvgFile)
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault()
  requestNewDiagram()
})

previewRawButton.addEventListener('click', () => {
  if (detailsState.presentation.appearance === 'raw') {
    setPreviewAppearance(`${previewTheme}-${previewTransparent ? 'transparent' : 'framed'}`)
  } else {
    setPreviewAppearance('raw')
  }
})
previewTransparentButton.addEventListener('click', () => {
  const prefix = appearancePrefix(detailsState.presentation.appearance)
  const transparent = !previewTransparent
  setPreviewAppearance(`${prefix}-${transparent ? 'transparent' : 'framed'}`)
})
previewThemeButton.addEventListener('click', () => {
  const theme = previewTheme === 'light' ? 'dark' : 'light'
  setPreviewAppearance(`${theme}-${previewTransparent ? 'transparent' : 'framed'}`)
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

wireTabs(document.querySelector('.editor-tabs'), button => {
  const details = button.id === 'details-tab'
  document.querySelector('#editor').hidden = details
  document.querySelector('#details-editor').hidden = !details
  if (details) detailsEditor.layout()
  else sourceEditor.layout()
})

document.querySelector('.mobile-panel-switch').addEventListener('click', () => {
  setMobilePanel(document.querySelector('.mobile-panel-switch').dataset.targetPanel)
})

function setMobilePanel(panel) {
  const state = mobilePanelSwitchState(panel)
  const switchButton = document.querySelector('.mobile-panel-switch')
  document.querySelector('.workspace').dataset.mobilePanel = state.panel
  switchButton.dataset.targetPanel = state.targetPanel
  switchButton.setAttribute('aria-controls', state.controls)
  switchButton.setAttribute('aria-label', state.label)
  switchButton.title = state.label
  if (state.panel === 'preview') {
    if (!previewHasBeenRevealed) {
      previewHasBeenRevealed = true
      requestAnimationFrame(() => preview.fit())
    }
  } else {
    activeInputEditor().layout()
  }
}

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const input = document.querySelector(`#${button.dataset.copy}`)
    if (!input.value) return
    try {
      await copy(input.value)
      showToast('Copied')
    } catch {
      showToast('Could not copy to the clipboard.', 4000)
    }
  })
})

window.addEventListener('popstate', () => location.reload())
window.addEventListener('dragover', event => {
  if ([...event.dataTransfer?.items ?? []].some(item => item.kind === 'file')) event.preventDefault()
})
window.addEventListener('drop', event => {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  event.preventDefault()
  openEditableSvgFile(file)
})

window.addEventListener('keydown', event => {
  if (event.defaultPrevented) return
  const primary = event.metaKey || event.ctrlKey
  const key = event.key.toLowerCase()
  if (primary && key === 'k') {
    event.preventDefault()
    const dialog = document.querySelector('#command-dialog')
    if (dialog.open) dialog.close()
    else openCommandPalette()
  } else if (primary && event.shiftKey && key === 'f') {
    event.preventDefault()
    openCommandPalette('format')
  } else if (primary && event.shiftKey && key === 'p') {
    event.preventDefault()
    saveDiagram()
  } else if (primary && event.shiftKey && key === 's') {
    event.preventDefault()
    openShareDialog()
  } else if (primary && key === 's') {
    event.preventDefault()
    saveEditableFile()
  } else if (primary && key === 'o') {
    event.preventDefault()
    openEditableSvgDialog()
  } else if (primary && key === 'n') {
    event.preventDefault()
    requestNewDiagram()
  } else if (!primary && event.shiftKey && key === '0') {
    event.preventDefault()
    preview.fit()
  }
})

document.querySelector('#command-input').addEventListener('input', renderCommandPalette)
document.querySelector('#command-input').addEventListener('keydown', event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (event.key === 'ArrowDown') commandPaletteModel?.next()
    else commandPaletteModel?.previous()
    renderCommandPalette(false)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    runSelectedCommand()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    document.querySelector('#command-dialog').close()
  }
})
document.querySelector('#command-dialog').addEventListener('click', event => {
  if (event.target === event.currentTarget) event.currentTarget.close()
})
document.querySelector('#command-dialog').addEventListener('close', () => commandPaletteInvoker?.focus())
document.querySelector('#command-results').addEventListener('click', event => {
  const option = event.target.closest('[data-command-id]')
  if (!option || option.disabled) return
  commandPaletteModel?.selectById(option.dataset.commandId)
  runSelectedCommand()
})

function wireTabs(tablist, onSelect) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')]
  const activate = button => {
    for (const tab of tabs) {
      const selected = tab === button
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
    }
    onSelect(button)
  }
  tablist.activateTab = activate
  for (const tab of tabs) {
    tab.addEventListener('click', () => activate(tab))
    tab.addEventListener('keydown', event => {
      let index
      if (event.key === 'ArrowRight') index = (tabs.indexOf(tab) + 1) % tabs.length
      else if (event.key === 'ArrowLeft') index = (tabs.indexOf(tab) - 1 + tabs.length) % tabs.length
      else if (event.key === 'Home') index = 0
      else if (event.key === 'End') index = tabs.length - 1
      else return
      event.preventDefault()
      tabs[index].focus()
      activate(tabs[index])
    })
  }
}

function selectTab(button) {
  button.closest('[role="tablist"]')?.activateTab?.(button)
}

function activeInputEditor() {
  return document.querySelector('#details-tab').getAttribute('aria-selected') === 'true'
    ? detailsEditor
    : sourceEditor
}

let commandPaletteMode = 'root'
let commandPaletteModel = null
let commandPaletteInvoker = null

function commandGroups(mode = 'root') {
  if (mode === 'format') {
    return launcherCatalogGroups.map(group => ({
      id: group.id,
      label: group.label,
      commands: group.items.map(entry => ({
        id: `format:${entry.id}`,
        label: entry.label,
        description: `${entry.description} - ${entry.extensions.join(', ')}`,
        keywords: [entry.id, ...entry.extensions],
        disabled: entry.id === typePicker.value,
        run: () => changeDiagramType(entry.id),
      })),
    }))
  }

  const recents = localDocuments.loadRecents().slice(0, 6).map(entry => ({
    id: entry.kind === 'local' ? `recent:local:${entry.localId}` : `recent:alias:${entry.aliasId}`,
    label: entry.title || 'Locked diagram',
    description: `${entry.type ? diagramTypeLabel(entry.type) : 'Encrypted'} · ${relativeTime(entry.updatedAt)}${entry.kind === 'alias' ? ' - published' : ''}`,
    keywords: [entry.type, entry.kind],
    run: () => openRecent(entry),
  }))
  const publishedEmbedAvailable = remote.aliasId
    ? Boolean(remote.savedMode !== 'locked' && remote.savedState)
    : remote.mode !== 'locked'
  return [
    ...(recents.length ? [{ id: 'recent', label: 'Recent', commands: recents }] : []),
    {
      id: 'format',
      label: 'Format',
      commands: [{
        id: 'change-format',
        label: 'Change format…',
        description: `${diagramTypeLabel(typePicker.value)} → 29 others`,
        keywords: ['renderer', 'syntax', 'language'],
        shortcut: '⌘⇧F',
        run: () => openCommandPalette('format'),
      }],
    },
    {
      id: 'save-share',
      label: 'Save & share',
      commands: [
        { id: 'save-file', label: 'Save as file', description: 'Editable .svg', keywords: ['download', 'export'], shortcut: '⌘S', disabled: saving, run: saveEditableFile },
        { id: 'publish', label: 'Publish', description: 'Create or update a short link', shortcut: '⌘⇧P', disabled: saving, run: saveDiagram },
        { id: 'encrypt-publish', label: 'Encrypt & publish', description: 'Password protected, client-side', keywords: ['lock', 'private'], disabled: saving, run: encryptAndPublish },
        { id: 'copy-svg', label: 'Copy SVG URL', keywords: ['embed', 'link'], disabled: !publishedEmbedAvailable, run: () => performShareAction('svg-url') },
        { id: 'copy-markdown', label: 'Copy as Markdown', keywords: ['embed', 'image'], disabled: !publishedEmbedAvailable, run: () => performShareAction('markdown') },
        { id: 'share', label: 'Share…', description: 'Links, privacy, and publishing', shortcut: '⌘⇧S', run: openShareDialog },
      ],
    },
    {
      id: 'view',
      label: 'View',
      commands: [
        { id: 'fit', label: 'Fit to window', shortcut: '⇧0', run: () => preview.fit() },
        { id: 'one-to-one', label: 'Actual size', description: 'Show at 1:1', keywords: ['zoom'], run: () => preview.oneToOne() },
        { id: 'raw', label: detailsState.presentation.appearance === 'raw' ? 'Use themed renderer output' : 'Use raw renderer output', keywords: ['appearance', 'theme'], run: () => previewRawButton.click() },
      ],
    },
    {
      id: 'document',
      label: 'Document',
      commands: [
        { id: 'new', label: 'Create new…', description: 'Choose a template in the launcher', shortcut: '⌘N', run: requestNewDiagram },
        { id: 'open', label: 'Open editable SVG…', shortcut: '⌘O', run: openEditableSvgDialog },
        { id: 'docs', label: 'Documentation', description: 'Open docs.diagram.zip', keywords: ['help', 'reference'], run: () => location.assign('https://docs.diagram.zip/') },
      ],
    },
  ]
}

function openCommandPalette(mode = 'root') {
  const dialog = document.querySelector('#command-dialog')
  if (dialog.open) dialog.close()
  commandPaletteInvoker = document.activeElement
  commandPaletteMode = mode
  commandPaletteModel = createCommandPaletteModel(commandGroups(mode))
  const input = document.querySelector('#command-input')
  input.value = ''
  input.placeholder = mode === 'format' ? 'Filter formats' : 'Type a command'
  document.querySelector('#command-scope').hidden = mode !== 'format'
  document.querySelector('#command-footer-note').textContent = mode === 'format'
    ? 'Source and document details stay unchanged'
    : '⌘K anywhere'
  if (mode === 'root') commandPaletteModel.selectById('change-format')
  else commandPaletteModel.selectFirst()
  renderCommandPalette(false)
  dialog.showModal()
  input.focus()
}

function renderCommandPalette(resetSelection = true) {
  if (!commandPaletteModel) return
  const input = document.querySelector('#command-input')
  if (resetSelection) commandPaletteModel.selectFirst(input.value)
  const results = commandPaletteModel.results()
  const resultSet = new Set(results.map(command => command.id))
  const container = document.querySelector('#command-results')
  container.replaceChildren()
  for (const group of commandPaletteModel.groups) {
    const commands = group.commands.filter(command => resultSet.has(command.id))
    if (!commands.length) continue
    const heading = document.createElement('div')
    heading.className = 'command-section'
    heading.textContent = group.label
    container.append(heading)
    for (const command of commands) {
      const option = document.createElement('button')
      option.type = 'button'
      option.className = 'command-option'
      option.id = `command-option-${command.id.replace(/[^a-z0-9_-]/gi, '-')}`
      option.dataset.commandId = command.id
      option.disabled = command.disabled === true
      option.setAttribute('role', 'option')
      const selected = command.id === commandPaletteModel.selectedId
      option.setAttribute('aria-selected', String(selected))
      option.innerHTML = `<span class="command-option-copy"><strong></strong>${command.description ? '<small></small>' : ''}</span><span class="command-option-spacer"></span>${command.shortcut ? '<kbd></kbd>' : ''}`
      option.querySelector('strong').textContent = command.label
      if (command.description) option.querySelector('small').textContent = command.description
      if (command.shortcut) option.querySelector('kbd').textContent = command.shortcut
      container.append(option)
    }
  }
  if (!results.length) {
    const empty = document.createElement('p')
    empty.className = 'command-empty'
    empty.textContent = commandPaletteMode === 'format' ? 'No matching formats.' : 'No matching commands.'
    container.append(empty)
  }
  const selected = container.querySelector('[aria-selected="true"]')
  input.setAttribute('aria-activedescendant', selected?.id ?? '')
  selected?.scrollIntoView({ block: 'nearest' })
}

function runSelectedCommand() {
  const command = commandPaletteModel?.selected
  if (!command || command.disabled) return
  const dialog = document.querySelector('#command-dialog')
  dialog.close()
  queueMicrotask(() => command.run())
}

function changeDiagramType(type) {
  if (!isKnownDiagramType(type)) return
  if (!ensureValidDetails()) {
    typePicker.value = activeType
    updateTypeCommand()
    return
  }
  history.replaceState(null, '', urlWithDiagramType(location.href, type))
  applyState(stateForTypeChange(currentState(), type))
}

function updateTypeCommand() {
  const label = diagramTypeLabel(typePicker.value)
  const button = document.querySelector('#command-type')
  document.querySelector('#command-type-label').textContent = label
  button.setAttribute('aria-label', `Change format. Current format: ${label}`)
  button.title = `Change format - Current: ${label}`
}

function diagramTypeLabel(type) {
  return diagramTypes.find(item => item.id === type)?.label ?? type ?? 'Diagram'
}

function relativeTime(timestamp) {
  const elapsed = Math.max(0, Date.now() - Number(timestamp || 0))
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (elapsed < minute) return 'just now'
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m ago`
  if (elapsed < day) return `${Math.floor(elapsed / hour)}h ago`
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)}d ago`
  return new Date(timestamp).toLocaleDateString()
}

function openRecent(entry) {
  if (entry.kind === 'local') location.assign(`/?doc=${encodeURIComponent(entry.localId)}`)
  else if (entry.mode === 'locked') location.assign(`/d/${entry.aliasId}`)
  else location.assign(urlWithDiagramType(`/d/${entry.aliasId}`, entry.type || DEFAULT_DIAGRAM_TYPE))
}

function requestNewDiagram() {
  if (remote.dirty && !confirm('Leave these local changes and open the launcher? They remain on this device.')) return
  location.assign('/')
}

function currentState() {
  return {
    type: typePicker.value,
    source: sourceEditor.getValue(),
    options: {},
    meta: detailsState.meta,
    presentation: detailsState.presentation,
  }
}

function applySystemTheme() {
  const resolved = systemColorScheme.matches ? 'dark' : 'light'
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]').content = resolved === 'dark' ? '#18191b' : '#ffffff'
  sourceEditor.setTheme?.()
  detailsEditor.setTheme?.()
}

function appearancePrefix(appearance) {
  if (appearance.startsWith('auto-')) return 'auto'
  if (appearance.startsWith('dark-')) return 'dark'
  if (appearance.startsWith('light-')) return 'light'
  return previewTheme
}

function setPreviewAppearance(appearance) {
  if (!ensureValidDetails()) return
  if (!supportedPreviewAppearances.has(appearance)) {
    showToast('This renderer does not support that appearance.')
    return
  }
  setDetailsState({
    ...detailsState,
    presentation: { ...detailsState.presentation, appearance },
  })
  syncPreviewAppearanceControls()
  commitState()
}

function syncPreviewAppearanceControls() {
  const appearance = detailsState.presentation.appearance
  const raw = appearance === 'raw'
  if (!raw) {
    const prefix = appearancePrefix(appearance)
    previewTheme = prefix === 'auto' ? (systemColorScheme.matches ? 'dark' : 'light') : prefix
    previewTransparent = appearance.endsWith('-transparent')
  }

  previewRawButton.setAttribute('aria-pressed', String(raw))
  previewRawButton.disabled = raw && supportedPreviewAppearances.size === 1
  previewTransparentButton.setAttribute('aria-pressed', String(!raw && previewTransparent))
  previewTransparentButton.disabled = raw || !supportedPreviewAppearances.has(
    `${appearancePrefix(appearance)}-${previewTransparent ? 'framed' : 'transparent'}`,
  )
  const oppositeTheme = previewTheme === 'light' ? 'dark' : 'light'
  previewThemeButton.dataset.previewTheme = previewTheme
  previewThemeButton.setAttribute('aria-pressed', String(!raw && previewTheme === 'dark'))
  previewThemeButton.setAttribute('aria-label', `Preview theme: ${previewTheme === 'dark' ? 'Dark' : 'Light'}`)
  previewThemeButton.title = `Preview theme: ${previewTheme === 'dark' ? 'Dark' : 'Light'} · click for ${oppositeTheme}`
  previewThemeButton.disabled = raw || !supportedPreviewAppearances.has(
    `${oppositeTheme}-${previewTransparent ? 'transparent' : 'framed'}`,
  )
}

function updateAppearanceOptions(appearances, appliedAppearance) {
  supportedPreviewAppearances = new Set(appearances)
  if (!detailsValid) {
    syncPreviewAppearanceControls()
    return
  }
  const requested = detailsState.presentation.appearance
  if (!supportedPreviewAppearances.has(requested)) {
    const prefix = appearancePrefix(requested)
    const alternateSurface = requested.endsWith('-transparent') ? 'framed' : 'transparent'
    const alternate = `${prefix}-${alternateSurface}`
    setDetailsState({
      ...detailsState,
      presentation: {
        ...detailsState.presentation,
        appearance: supportedPreviewAppearances.has(alternate) ? alternate : appliedAppearance,
      },
    })
  }
  syncPreviewAppearanceControls()
  if (detailsState.presentation.appearance !== requested) queueMicrotask(commitState)
}

function scheduleUpdate(delay = 1200) {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(commitState, delay)
}

function commitState(render = true) {
  const state = currentState()
  remote.dirty = !detailsValid || workingStateIsDirty(state, {
    mode: remote.mode,
    keyEnvelopeDirty: remote.keyEnvelopeDirty,
    savedSnapshot: remote.savedSnapshot,
    defaultStateFor: templateStateFor,
  })
  syncStoredDraft(state)
  updateSaveButton()
  updatePrivacyControls()
  if (render) preview.render(state)
}

function scheduleDetailsUpdate() {
  clearTimeout(detailsCommitTimer)
  validateDetailsDocument(false)
  detailsCommitTimer = setTimeout(() => {
    if (detailsValid) commitState()
    else commitState(false)
  }, 220)
}

let titleEditBaseline = ''

function beginTitleEdit() {
  if (!detailsValid) {
    titleInput.blur()
    ensureValidDetails()
    return
  }
  titleEditBaseline = detailsState.meta.title
}

function updateTitleFromHeader() {
  if (!detailsValid) return
  clearTimeout(detailsCommitTimer)
  setDetailsState(detailsStateWithTitle(detailsState, titleInput.value))
  detailsCommitTimer = setTimeout(commitState, 220)
}

function finishTitleEdit() {
  if (!detailsValid || titleInput.value === titleEditBaseline) return
  clearTimeout(detailsCommitTimer)
  commitState()
}

function handleTitleKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    titleInput.blur()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    clearTimeout(detailsCommitTimer)
    setDetailsState(detailsStateWithTitle(detailsState, titleEditBaseline))
    titleInput.blur()
  }
}

function validateDetailsDocument(showError = false) {
  try {
    detailsState = parseDetailsDocument(detailsEditor.getValue())
    detailsValid = true
    detailsError = ''
    updateDetailsValidation()
    updateDocumentMetadata()
    syncPreviewAppearanceControls()
    return true
  } catch (error) {
    detailsValid = false
    detailsError = error instanceof Error ? error.message : 'Details are invalid.'
    updateDetailsValidation()
    if (showError) showToast(detailsError, 4000)
    return false
  }
}

function ensureValidDetails() {
  if (validateDetailsDocument(true)) return true
  selectTab(document.querySelector('#details-tab'))
  detailsEditor.focus()
  return false
}

function setDetailsState(nextDetails) {
  detailsState = {
    meta: normalizeMetadata(nextDetails.meta),
    presentation: normalizePresentation(nextDetails.presentation),
  }
  detailsValid = true
  detailsError = ''
  detailsEditor.setDocument({
    source: serializeDetailsDocument(detailsState),
    diagramType: typePicker.value,
    language: 'json',
  })
  updateDetailsValidation()
  updateDocumentMetadata()
}

function updateDetailsValidation() {
  const status = document.querySelector('#details-validation')
  const tab = document.querySelector('#details-tab')
  const dock = document.querySelector('#syntax-dock')
  const summary = document.querySelector('#syntax-dock-summary')
  const count = document.querySelector('#syntax-message-count')
  status.textContent = detailsValid ? 'No problems' : detailsError
  status.title = detailsError
  count.textContent = detailsValid ? '0' : '1'
  dock.dataset.severity = detailsValid ? 'none' : 'error'
  summary.setAttribute('aria-label', detailsValid ? 'No diagnostics' : '1 error')
  summary.title = detailsValid ? 'No diagnostics' : '1 error'
  tab.dataset.invalid = String(!detailsValid)
  tab.setAttribute('aria-invalid', String(!detailsValid))
  if (detailsValid) {
    tab.removeAttribute('aria-describedby')
  } else {
    tab.setAttribute('aria-describedby', 'details-validation')
  }
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
          return templateStateFor(DEFAULT_DIAGRAM_TYPE)
        }
        setRemoteAlias(alias, writeCapability, unlocked.state, unlocked.bundleKey)
        return unlocked.state
      }
      setRemoteAlias(alias, writeCapability, alias.state)
      const draft = loadAliasDraft(`${ALIAS_DRAFT_PREFIX}${aliasId}`)
      if (draft?.revision === alias.revision) {
        restoredDetailsSource = draft.detailsSource
        return draft.state
      }
      return alias.state
    } catch (error) {
      initialLoadError = error instanceof PersistenceError
        ? error.message
        : 'This published diagram could not be loaded.'
    }
  }
  if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`)
  if (localDocumentId) {
    const document = localDocuments.loadLocalDocument(localDocumentId)
    const state = normalizeStoredState(document?.state)
    if (state) {
      lastFileSnapshot = document.fileSnapshot
      restoredDetailsSource = document.detailsSource
      localDocuments.touchRecent({ localId: localDocumentId })
      return state
    }
    initialLoadError = 'This local diagram is no longer stored on this device.'
    localDocumentId = null
  }
  const requestedType = diagramTypeFromQuery(location.search)
  if (requestedType) {
    const state = templateStateFor(requestedType)
    return state
  }
  return templateStateFor(DEFAULT_DIAGRAM_TYPE)
}

function applyState(state, commit = true) {
  if (!isKnownDiagramType(state.type)) throw new Error('Unsupported diagram type.')
  const meta = normalizeMetadata(state.meta)
  const presentation = normalizePresentation(state.presentation)
  activeType = state.type
  typePicker.value = state.type
  updateTypeCommand()
  setDetailsState({ meta, presentation })
  syncPreviewAppearanceControls()
  sourceEditor.setDocument({ source: state.source, diagramType: state.type })
  if (commit) commitState()
  else preview.render(currentState())
}

async function performPrimarySaveAction() {
  return saveEditableFile()
}

async function saveEditableFile() {
  if (saving || !ensureValidDetails()) return false
  if (remote.mode === 'locked' && !confirm('Save a decrypted editable SVG? The file will contain the diagram source without password protection.')) {
    return false
  }
  commitState(false)
  const state = currentState()
  saving = true
  updateSaveButton()
  try {
    await preview.render(state)
    const canonical = preview.canonicalSvgFor(state)
    if (!canonical) throw new Error('The current diagram has not finished rendering.')
    const source = exportEditableSvg(canonical, state)
    downloadEditableSvg(source, editableSvgFilename(state))
    lastFileSnapshot = workingStateSnapshot(state)
    if (!remote.aliasId) storeDraft(state)
    showToast('Saved editable SVG')
    return true
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not save this editable SVG.', 4000)
    return false
  } finally {
    saving = false
    updateSaveButton()
  }
}

function editableSvgFilename(state) {
  const requested = state.meta.title.trim() || `${state.type}-diagram`
  const basename = requested
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'diagram'
  return `${basename}.diagram.svg`
}

function downloadEditableSvg(source, filename) {
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function openEditableSvgDialog() {
  const dialog = document.querySelector('#open-dialog')
  document.querySelector('#open-svg-input').value = ''
  document.querySelector('#open-file-input').value = ''
  document.querySelector('#open-error').textContent = ''
  dialog.showModal()
}

async function submitEditableSvgInput(event) {
  event.preventDefault()
  const input = document.querySelector('#open-svg-input').value.trim()
  if (!input) {
    document.querySelector('#open-error').textContent = 'Paste SVG markup or a URL, or choose a file.'
    return
  }
  await openEditableSvgValue(() => importEditableSvgInput(input))
}

async function openSelectedEditableSvgFile(event) {
  const file = event.target.files?.[0]
  if (file) await openEditableSvgFile(file)
}

async function openEditableSvgFile(file) {
  await openEditableSvgValue(() => importEditableSvgFile(file))
}

async function openEditableSvgValue(load) {
  const error = document.querySelector('#open-error')
  error.textContent = ''
  try {
    const state = await load()
    if (remote.dirty && !confirm('Replace the current working draft with this editable SVG? Unsaved changes will be discarded.')) return
    clearTimeout(renderTimer)
    clearTimeout(detailsCommitTimer)
    lastFileSnapshot = workingStateSnapshot(state)
    localDocumentId = null
    remote = emptyRemoteState()
    history.pushState(null, '', urlWithDiagramType('/', state.type))
    applyState(state)
    const dialog = document.querySelector('#open-dialog')
    if (dialog.open) dialog.close()
    showToast('Opened editable SVG')
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Could not open this editable SVG.'
    error.textContent = message
    if (!document.querySelector('#open-dialog').open) showToast(message, 4000)
  }
}

function openShareDialog() {
  if (!ensureValidDetails()) return
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
  const savedAppearance = savedState ? normalizePresentation(savedState.presentation).appearance : 'raw'
  const svgLink = savedState ? stableRenderUrl(location.origin, remote.aliasId, 'svg', savedAppearance) : ''

  setShareField('viewer-link', viewerLink, 'Publish to create a read link')
  setShareField('editor-link', editorLink, hasAlias ? 'No write capability on this device' : 'Publish to create an edit link')

  document.querySelector('#editor-link-note').textContent = editorLink
    ? 'Anyone with this link can update the diagram.'
    : hasAlias
      ? 'This device has read-only access. Publish a copy to create a new edit link.'
      : 'The edit link is a bearer credential and appears after publishing.'
  const embedAvailable = hasAlias ? Boolean(svgLink) : remote.mode !== 'locked'
  document.querySelector('[data-share-action="svg-url"]').disabled = !embedAvailable
  document.querySelector('[data-share-action="markdown"]').disabled = !embedAvailable

  const shareStatus = document.querySelector('#share-status')
  if (!hasAlias) {
    shareStatus.textContent = 'Keep this draft in a file, or publish it when you want stable share links.'
  } else if (remote.dirty && remote.writeCapability) {
    shareStatus.textContent = 'These links show the last published version. Publish your changes before sharing.'
  } else if (remote.dirty) {
    shareStatus.textContent = 'You are editing a read-only diagram. Publish to create a new alias for your changes.'
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

async function performShareAction(action) {
  let completed = false
  if (action === 'publish') completed = await saveDiagram()
  if (action === 'encrypt-publish') completed = await encryptAndPublish()
  if (action === 'file') completed = await saveEditableFile()
  if (action === 'svg-url' || action === 'markdown') {
    try {
      const value = await embedValue(action)
      if (!value) return
      await copy(value)
      showToast(action === 'svg-url' ? 'SVG URL copied' : 'Markdown copied')
      completed = true
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not copy to the clipboard.', 4000)
    }
  }
  if (completed) populateShareDialog()
}

async function embedValue(action) {
  let state
  let svgLink
  if (remote.aliasId) {
    if (remote.savedMode === 'locked' || !remote.savedState) return ''
    state = remote.savedState
    const appearance = normalizePresentation(state.presentation).appearance
    svgLink = stableRenderUrl(location.origin, remote.aliasId, 'svg', appearance)
  } else {
    if (remote.mode === 'locked') throw new Error('Encrypted diagrams cannot use public SVG embeds.')
    if (!ensureValidDetails()) return ''
    commitState(false)
    state = currentState()
    await preview.render(state)
    const canonical = preview.canonicalSvgFor(state)
    if (!canonical) throw new Error('The current diagram has not finished rendering.')
    svgLink = packedSvgUrl(location.origin, exportEditableSvg(canonical, state))
  }
  if (action === 'svg-url') return svgLink
  const title = state.meta.title.trim().replace(/[\[\]\r\n]/g, ' ') || 'Diagram'
  return `![${title}](${svgLink})`
}

async function encryptAndPublish() {
  if (remote.mode !== 'locked' && !(await lockDiagram())) return false
  return saveDiagram()
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
  if (!ensureValidDetails()) return false
  commitState(false)
  const state = currentState()
  if (remote.aliasId && !remote.dirty) {
    showToast('Already published')
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
      showToast('Published changes')
      return true
    }
    const savedAsCopy = Boolean(remote.aliasId)
    await createNewAlias(state)
    showToast(savedAsCopy ? 'Published as a new diagram' : 'Published')
    return true
  } catch (error) {
    if (error instanceof PersistenceError && error.status === 412 && remote.aliasId) {
      return await resolveConflict(state)
    }
    showToast(error instanceof Error ? error.message : 'Could not publish this diagram.')
    return false
  } finally {
    saving = false
    updateSaveButton()
  }
}

async function createNewAlias(state) {
  const previousAliasId = remote.aliasId
  const previousDraftKey = previousAliasId ? `${ALIAS_DRAFT_PREFIX}${previousAliasId}` : null
  const previousLocalDocumentId = localDocumentId
  const bundleKey = remote.bundleKey
  const alias = remote.mode === 'locked'
    ? await persistence.createLockedAlias(await lockedPayloadForState(state))
    : await persistence.createAlias(state)
  setRemoteAlias(alias, alias.writeCapability, state, remote.mode === 'locked' ? bundleKey : null)
  storeWriteCapability(alias.aliasId, alias.writeCapability)
  if (previousDraftKey) removeDraft(previousDraftKey)
  if (previousLocalDocumentId) {
    localDocuments.deleteLocalDocument(previousLocalDocumentId)
    localDocumentId = null
  }
  history.pushState(null, '', urlWithDiagramType(`/d/${alias.aliasId}`, state.type))
  await cacheSavedRenders(state)
}

async function lockedPayloadForState(state) {
  if (!(remote.bundleKey instanceof Uint8Array) || !remote.keyEnvelope) {
    throw new Error('This diagram is missing its browser encryption key.')
  }
  const contentIsUnchanged = remote.savedMode === 'locked'
    && remote.savedSnapshot === workingStateSnapshot(state, 'locked')
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
  const renderer = preview.rendererIdentityFor(state)
  if (!svg || !renderer) return

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
      renderer,
    })
  })
  const results = await Promise.allSettled(uploads)
  if (results.every(result => result.status === 'rejected')) {
    showToast('Published, but the render cache is unavailable.', 4000)
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
  if (!ensureValidDetails()) return false
  const password = await askPassword({
    title: 'Lock diagram',
    copy: 'The source, metadata, and published render will be encrypted in this browser. The password cannot be recovered.',
    submitLabel: 'Lock diagram',
    confirm: true,
  })
  if (password === null) return false
  try {
    const { bundleKey, payload } = await createLockedState(currentState(), password)
    remote.mode = 'locked'
    remote.bundleKey = bundleKey
    remote.keyEnvelope = payload.keyEnvelope
    remote.encryptedContent = payload.encryptedContent
    remote.encryptedMetadata = payload.encryptedMetadata
    remote.keyEnvelopeDirty = true
    if (remote.aliasId) removeDraft(`${ALIAS_DRAFT_PREFIX}${remote.aliasId}`)
    else if (localDocumentId) {
      localDocuments.deleteLocalDocument(localDocumentId)
      localDocumentId = null
      history.replaceState(null, '', urlWithDiagramType('/', typePicker.value))
    }
    commitState(false)
    showToast('Encrypted in this browser — publish to persist')
    return true
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not lock this diagram.')
    return false
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
    showToast('Password changed — publish to persist')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not change the password.')
  }
}

function unlockDiagram() {
  if (remote.mode !== 'locked') return
  if (!confirm('Remove password protection? The next publish will store the diagram in plaintext.')) return
  remote.mode = 'open'
  remote.keyEnvelopeDirty = false
  commitState(false)
  showToast('Password removed — publish to persist')
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
      showToast('Reloaded published diagram')
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

function loadAliasDraft(key) {
  try {
    const draft = JSON.parse(localStorage.getItem(key))
    const state = normalizeStoredState(draft?.state)
    if (!state) return null
    return {
      state,
      revision: draft.revision ?? null,
      detailsSource: typeof draft.detailsSource === 'string' ? draft.detailsSource : null,
      fileSnapshot: typeof draft.fileSnapshot === 'string' ? draft.fileSnapshot : null,
    }
  } catch {
    return null
  }
}

function storeDraft(state) {
  if (remote.mode === 'locked') return
  if (!remote.aliasId) {
    const savedId = localDocuments.saveLocalDocument({
      state,
      detailsSource: !detailsValid && detailsEditor ? detailsEditor.getValue() : null,
      fileSnapshot: lastFileSnapshot,
      drafts: {},
      dirty: remote.dirty,
    }, localDocumentId ? { localId: localDocumentId, currentLocalId: localDocumentId } : {})
    if (!savedId) {
      showToast('This diagram could not be saved on this device.', 4000)
      return
    }
    if (!localDocumentId) {
      localDocumentId = savedId
      history.replaceState(null, '', `/?doc=${encodeURIComponent(localDocumentId)}`)
    }
    return
  }
  const key = `${ALIAS_DRAFT_PREFIX}${remote.aliasId}`
  try {
    const detailsSource = !detailsValid && detailsEditor
      ? detailsEditor.getValue()
      : null
    localStorage.setItem(key, JSON.stringify({
      state,
      revision: remote.revision,
      detailsSource,
      fileSnapshot: remote.aliasId ? null : lastFileSnapshot,
    }))
  } catch {
    // The editor remains usable when storage is unavailable.
  }
}

function syncStoredDraft(state) {
  if (remote.mode === 'locked') return
  if (!remote.aliasId) {
    if (remote.dirty || localDocumentId) storeDraft(state)
    return
  }
  const key = `${ALIAS_DRAFT_PREFIX}${remote.aliasId}`
  if (remote.dirty) storeDraft(state)
  else removeDraft(key)
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
    savedSnapshot: workingStateSnapshot(state, alias.mode),
    bundleKey,
    keyEnvelope: alias.mode === 'locked' ? alias.keyEnvelope : null,
    encryptedContent: alias.mode === 'locked' ? alias.encryptedContent : null,
    encryptedMetadata: alias.mode === 'locked' ? alias.encryptedMetadata : null,
    keyEnvelopeDirty: false,
    dirty: false,
  }
  localDocuments.upsertRecent({
    kind: 'alias',
    aliasId: alias.aliasId,
    title: alias.mode === 'locked' ? null : normalizeMetadata(state.meta).title,
    type: alias.mode === 'locked' ? '' : state.type,
    mode: alias.mode,
  })
  updatePrivacyControls()
  updateSaveButton()
}

function updateSaveButton() {
  updateDraftControls()
  const indicator = document.querySelector('#unsaved-indicator')
  const reset = document.querySelector('#quick-reset')
  const dirty = remote.dirty || remote.keyEnvelopeDirty
  indicator.dataset.dirty = String(dirty)
  reset.dataset.visible = String(dirty)
  reset.setAttribute('aria-hidden', String(!dirty))
  reset.tabIndex = dirty ? 0 : -1
  reset.disabled = saving
  const resetTarget = remote.aliasId && remote.savedState
    ? 'last cloud save'
    : `${diagramTypeLabel(typePicker.value)} template default`
  reset.setAttribute('aria-label', `Reset to ${resetTarget}`)
  reset.title = `Reset to ${resetTarget}`
  if (document.querySelector('#command-dialog').open && commandPaletteMode === 'root') {
    const query = document.querySelector('#command-input').value
    commandPaletteModel = createCommandPaletteModel(commandGroups())
    commandPaletteModel.selectFirst(query)
    renderCommandPalette(false)
  }
}

function quickResetDocument() {
  if (!(remote.dirty || remote.keyEnvelopeDirty) || saving) return
  const cloudSaved = Boolean(remote.aliasId && remote.savedState)
  const target = cloudSaved ? 'the last cloud save' : `the ${diagramTypeLabel(typePicker.value)} template default`
  if (!confirm(`Reset to ${target}? Local changes will be discarded.`)) return
  restoreSavedDiagram({ confirmed: true })
}

function updateDraftControls() {
  const bar = document.querySelector('#draft-bar')
  const restore = document.querySelector('#restore-saved')
  const makeCopy = document.querySelector('#make-copy')
  const hasAliasOverlay = Boolean(remote.aliasId && remote.savedState && remote.dirty)
  const hasAnonymousDraft = Boolean(!remote.aliasId && !localDocumentId && remote.dirty && lastFileSnapshot === null)
  bar.hidden = !hasAliasOverlay && !hasAnonymousDraft
  restore.disabled = saving
  makeCopy.disabled = saving
  makeCopy.hidden = hasAnonymousDraft
  bar.dataset.anonymous = String(hasAnonymousDraft)
  if (hasAnonymousDraft) {
    const type = typePicker.selectedOptions[0]?.textContent ?? 'diagram'
    bar.querySelector('p').textContent = `This device has changes to the ${type} example.`
    restore.querySelector('span').textContent = ''
    restore.setAttribute('aria-label', 'Reset')
    restore.title = 'Reset'
  } else {
    bar.querySelector('p').textContent = 'This device has changes that are not part of the published share link.'
    restore.querySelector('span').textContent = 'Restore published'
    restore.removeAttribute('aria-label')
    restore.removeAttribute('title')
  }
}

function restoreSavedDiagram({ confirmed = false } = {}) {
  if (!remote.aliasId) {
    resetAnonymousExample({ confirmed })
    return
  }
  if (!remote.aliasId || !remote.savedState || !(remote.dirty || remote.keyEnvelopeDirty)) return
  clearTimeout(renderTimer)
  clearTimeout(detailsCommitTimer)
  remote.mode = remote.savedMode
  remote.keyEnvelopeDirty = false
  remote.dirty = false
  removeDraft(`${ALIAS_DRAFT_PREFIX}${remote.aliasId}`)
  applyState(remote.savedState, false)
  history.replaceState(null, '', urlWithDiagramType(location.href, remote.savedState.type))
  updatePrivacyControls()
  updateSaveButton()
  showToast('Restored published diagram')
}

function resetAnonymousExample({ confirmed = false } = {}) {
  if (remote.aliasId || !remote.dirty) return
  if (!confirmed && !confirm('Discard local changes and reset this example?')) return
  clearTimeout(renderTimer)
  clearTimeout(detailsCommitTimer)
  if (localDocumentId) localDocuments.deleteLocalDocument(localDocumentId)
  localDocumentId = null
  const state = templateStateFor(typePicker.value)
  applyState(state, false)
  remote.dirty = false
  history.replaceState(null, '', urlWithDiagramType(location.href, state.type))
  updateSaveButton()
  showToast('Example reset')
}

async function makeDraftCopy() {
  if (saving || !remote.aliasId || !remote.dirty) return
  if (!ensureValidDetails()) return
  commitState(false)
  const state = currentState()
  saving = true
  updateSaveButton()
  try {
    await createNewAlias(state)
    showToast('Published as a new diagram')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not make a copy.')
  } finally {
    saving = false
    updateSaveButton()
  }
}

function updatePrivacyControls() {
  const locked = remote.mode === 'locked'
  document.querySelector('#privacy-label').textContent = locked ? 'Password locked' : 'Open'
  document.querySelector('#privacy-description').textContent = locked
    ? 'Source, metadata, and published renders are encrypted in your browser. Password-locked diagrams cannot be embedded.'
    : 'Anyone with the read link can open and embed this diagram.'
  document.querySelector('#lock-diagram').hidden = locked
  document.querySelector('#change-password').hidden = !locked
  document.querySelector('#unlock-diagram').hidden = !locked
}

function emptyRemoteState(overrides = {}) {
  return {
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
    ...overrides,
  }
}

function updateDocumentMetadata() {
  const title = detailsState.meta.title.trim()
  const description = detailsState.meta.description.trim()
  if (titleInput.value !== detailsState.meta.title) titleInput.value = detailsState.meta.title
  document.title = documentTitle(title)
  document.querySelector('meta[name="description"]').content = description || 'Create diagrams from text and share them as a link.'
}

async function copy(value) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Fall back for browsers that expose Clipboard without granting write access.
    }
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Clipboard access is unavailable.')
}

function showToast(message, duration = 1800) {
  const toast = document.querySelector('#toast')
  toast.textContent = message
  clearTimeout(showToast.hideTimeout)
  if (typeof toast.showPopover === 'function' && !toast.matches(':popover-open')) toast.showPopover()
  toast.dataset.visible = 'true'
  clearTimeout(showToast.timeout)
  showToast.timeout = setTimeout(() => {
    delete toast.dataset.visible
    showToast.hideTimeout = setTimeout(() => {
      if (typeof toast.hidePopover === 'function' && toast.matches(':popover-open')) toast.hidePopover()
    }, 160)
  }, duration)
}

commitState()
if (initialLoadError) showToast(initialLoadError)
