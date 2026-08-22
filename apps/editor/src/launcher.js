import { exampleStateFor } from './examples.js'
import { importEditableSvgFile } from './editable-svg-input.js'
import {
  filterLauncherCatalog,
  launcherCatalogGroups,
  launcherEntryFor,
} from './launcher-catalog.js'
import { formatIconMarkup } from './format-icons.js'
import { createLauncherPreviewRenderer } from './launcher-previews.js'
import { createLocalDocuments } from './local-documents.js'
import { DEFAULT_DIAGRAM_TYPE } from './state.js'

const systemColorScheme = matchMedia('(prefers-color-scheme: dark)')
const localDocuments = createLocalDocuments()
const previewRenderer = createLauncherPreviewRenderer()
document.documentElement.dataset.theme = systemColorScheme.matches ? 'dark' : 'light'
document.querySelector('meta[name="theme-color"]').content = systemColorScheme.matches ? '#18191b' : '#ffffff'

const requestedType = new URLSearchParams(location.search).get('type') ?? ''
let recents = localDocuments.loadRecents()
let selected = recents[0]
  ? { kind: 'recent', id: recentId(recents[0]) }
  : { kind: 'format', id: DEFAULT_DIAGRAM_TYPE }
let activeGroup = 'all'
let listMode = false

document.querySelector('#app').innerHTML = `
  <main class="launcher-shell">
    <header class="launcher-header">
      <a class="launcher-brand" href="/" aria-label="Diagram.zip home"><img src="/icon.svg?v=4" alt=""><span>diagram.zip</span></a>
      <span class="header-spacer"></span>
      <a class="launcher-docs" href="https://docs.diagram.zip/" aria-label="Documentation" title="Documentation">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5c3.25-.75 6-.1 8.5 2v12c-2.5-2.1-5.25-2.75-8.5-2V5.5Zm17 0c-3.25-.75-6-.1-8.5 2v12c2.5-2.1 5.25-2.75 8.5-2V5.5Z"/><path d="M12 7.5v12"/></svg>
      </a>
    </header>
    <div class="launcher-layout">
      <aside class="launcher-rail" aria-label="Launcher navigation">
        <div class="launcher-rail-scroll">
          <h2>Start</h2>
          <button type="button" data-launcher-action="new"><span class="launcher-action-icon">＋</span><span>New diagram</span><kbd>⌘N</kbd></button>
          <button type="button" data-launcher-action="open"><span class="launcher-action-icon">⌑</span><span>Open file…</span><kbd>⌘O</kbd></button>
          <button type="button" data-launcher-action="paste"><span class="launcher-action-icon">▤</span><span>Paste source</span><kbd>⌘V</kbd></button>
          <h2>Formats</h2>
          <div id="launcher-groups"></div>
          <h2>Recent</h2>
          <div class="launcher-recents" id="launcher-recents"></div>
        </div>
        <div class="launcher-storage" id="launcher-storage"></div>
      </aside>
      <section class="launcher-catalog-pane" aria-label="Diagram formats">
        <div class="launcher-filter-bar">
          <label class="launcher-filter">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
            <span class="sr-only">Filter formats</span>
            <input id="launcher-filter" type="search" placeholder="Filter formats" autocomplete="off" spellcheck="false">
            <kbd>/</kbd>
          </label>
          <div class="launcher-view-toggle" role="group" aria-label="Format view">
            <button type="button" data-view="grid" aria-pressed="true">Grid</button>
            <button type="button" data-view="list" aria-pressed="false">List</button>
          </div>
        </div>
        <div class="launcher-catalog-scroll" id="launcher-catalog"></div>
      </section>
      <aside class="launcher-detail" id="launcher-detail" aria-live="polite"></aside>
    </div>
  </main>
  <input id="launcher-file" type="file" accept=".svg,image/svg+xml" hidden>
  <dialog class="paste-dialog" id="paste-dialog" aria-labelledby="paste-title">
    <form class="dialog-card" id="paste-form">
      <div class="dialog-header"><h1 id="paste-title">Paste diagram source</h1><button class="icon-button" type="button" data-paste-cancel aria-label="Close">×</button></div>
      <p class="dialog-copy">Paste source and we’ll pick the most likely format. You can correct it before creating the diagram.</p>
      <div class="details-fields">
        <label><span>Source</span><textarea id="paste-source" required spellcheck="false"></textarea></label>
        <label><span>Format</span><select id="paste-type"></select></label>
      </div>
      <div class="dialog-actions"><button class="primary-action" type="submit">Create diagram</button></div>
    </form>
  </dialog>
`

const filterInput = document.querySelector('#launcher-filter')
filterInput.value = requestedType
for (const entry of filterLauncherCatalog()) document.querySelector('#paste-type').add(new Option(entry.label, entry.id))

document.querySelector('[data-launcher-action="new"]').addEventListener('click', selectDefaultFormat)
document.querySelector('[data-launcher-action="open"]').addEventListener('click', () => document.querySelector('#launcher-file').click())
document.querySelector('[data-launcher-action="paste"]').addEventListener('click', openPasteDialog)
document.querySelector('#launcher-file').addEventListener('change', openEditableFile)
document.querySelector('[data-paste-cancel]').addEventListener('click', () => document.querySelector('#paste-dialog').close())
document.querySelector('#paste-form').addEventListener('submit', createPastedDiagram)
document.querySelector('#paste-source').addEventListener('input', event => {
  const detected = detectDiagramType(event.target.value)
  if (detected) document.querySelector('#paste-type').value = detected
})
filterInput.addEventListener('input', () => {
  activeGroup = 'all'
  const matches = visibleFormats()
  if (matches.length) selected = { kind: 'format', id: matches[0].id }
  render()
})
document.querySelector('#launcher-groups').addEventListener('click', event => {
  const button = event.target.closest('[data-group]')
  if (!button) return
  activeGroup = button.dataset.group
  filterInput.value = ''
  const first = visibleFormats()[0]
  if (first) selected = { kind: 'format', id: first.id }
  render()
})
document.querySelector('#launcher-recents').addEventListener('click', event => {
  const button = event.target.closest('[data-recent-id]')
  if (!button) return
  selected = { kind: 'recent', id: button.dataset.recentId }
  render()
})
document.querySelector('#launcher-catalog').addEventListener('click', event => {
  const button = event.target.closest('[data-format-id]')
  if (!button) return
  selected = { kind: 'format', id: button.dataset.formatId }
  render()
})
document.querySelector('.launcher-view-toggle').addEventListener('click', event => {
  const button = event.target.closest('[data-view]')
  if (!button) return
  listMode = button.dataset.view === 'list'
  render()
})
document.querySelector('#launcher-detail').addEventListener('click', handleDetailAction)
document.querySelector('#launcher-storage').addEventListener('click', event => {
  if (!event.target.closest('[data-clear-recents]')) return
  if (!confirm('Clear the recent list and delete its local-only diagrams from this browser? Published edit links will be kept.')) return
  localDocuments.clearRecents()
  recents = []
  selected = { kind: 'format', id: DEFAULT_DIAGRAM_TYPE }
  render()
})

window.addEventListener('keydown', event => {
  if (document.querySelector('#paste-dialog').open) return
  const primary = event.metaKey || event.ctrlKey
  const key = event.key.toLowerCase()
  const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName)
  if (event.key === '/' && !typing) {
    event.preventDefault()
    filterInput.focus()
  } else if (primary && key === 'n') {
    event.preventDefault()
    selectDefaultFormat()
  } else if (primary && key === 'o') {
    event.preventDefault()
    document.querySelector('#launcher-file').click()
  } else if (primary && key === 'v' && !typing) {
    event.preventDefault()
    openPasteDialog()
  } else if (event.key === 'Escape' && filterInput.value) {
    event.preventDefault()
    filterInput.value = ''
    render()
  } else if (event.key.startsWith('Arrow') && !typing) {
    event.preventDefault()
    moveFormatSelection(event.key)
  } else if (event.key === 'Enter' && !typing) {
    event.preventDefault()
    activateSelection()
  }
})

render()
if (requestedType) filterInput.focus()
window.addEventListener('pagehide', () => previewRenderer.dispose(), { once: true })

function render() {
  renderGroups()
  renderRecents()
  renderCatalog()
  renderDetail()
  renderStorage()
  for (const button of document.querySelectorAll('[data-view]')) {
    button.setAttribute('aria-pressed', String((button.dataset.view === 'list') === listMode))
  }
}

function renderGroups() {
  const root = document.querySelector('#launcher-groups')
  root.replaceChildren(groupButton('all', 'All', filterLauncherCatalog().length))
  for (const group of launcherCatalogGroups) root.append(groupButton(group.id, group.label, group.items.length))
}

function groupButton(id, label, count) {
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.group = id
  button.className = 'launcher-group'
  button.dataset.selected = String(activeGroup === id)
  button.innerHTML = '<span></span><small></small>'
  button.querySelector('span').textContent = label
  button.querySelector('small').textContent = count
  return button
}

function renderRecents() {
  const root = document.querySelector('#launcher-recents')
  root.replaceChildren()
  if (!recents.length) {
    const empty = document.createElement('p')
    empty.className = 'launcher-empty'
    empty.textContent = 'Nothing on this device yet'
    root.append(empty)
    return
  }
  for (const entry of recents) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.recentId = recentId(entry)
    button.dataset.selected = String(selected.kind === 'recent' && selected.id === recentId(entry))
    button.innerHTML = '<span class="recent-glyph"></span><span class="recent-copy"><strong></strong><small></small></span><span class="recent-dot" hidden></span>'
    button.querySelector('.recent-glyph').textContent = formatMonogram(entry.type)
    button.querySelector('strong').textContent = entry.title || 'Locked diagram'
    button.querySelector('small').textContent = `${entry.mode === 'locked' ? 'encrypted' : diagramLabel(entry.type)} · ${relativeTime(entry.updatedAt)}`
    button.querySelector('.recent-dot').hidden = !entry.dirty
    root.append(button)
  }
}

function renderCatalog() {
  const root = document.querySelector('#launcher-catalog')
  root.dataset.view = listMode ? 'list' : 'grid'
  root.replaceChildren()
  const visible = new Set(visibleFormats().map(entry => entry.id))
  if (!visible.size) {
    const empty = document.createElement('div')
    empty.className = 'launcher-no-match'
    const title = document.createElement('strong')
    title.textContent = `No format called “${filterInput.value}”`
    const copy = document.createElement('p')
    copy.textContent = `Diagram.zip renders ${filterLauncherCatalog().length} formats. Clear the filter to see them all.`
    const clear = document.createElement('button')
    clear.type = 'button'
    clear.textContent = 'Clear filter'
    clear.addEventListener('click', () => { filterInput.value = ''; filterInput.focus(); render() })
    empty.append(title, copy, clear)
    root.append(empty)
    return
  }
  for (const group of launcherCatalogGroups) {
    const items = group.items.filter(entry => visible.has(entry.id))
    if (!items.length) continue
    const heading = document.createElement('div')
    heading.className = 'launcher-catalog-heading'
    heading.innerHTML = '<h2></h2><span></span>'
    heading.querySelector('h2').textContent = group.label
    root.append(heading)
    const grid = document.createElement('div')
    grid.className = 'launcher-format-grid'
    for (const entry of items) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.formatId = entry.id
      button.dataset.selected = String(selected.kind === 'format' && selected.id === entry.id)
      button.innerHTML = '<span class="format-icon"></span><span class="format-copy"><strong></strong><small></small></span>'
      button.querySelector('.format-icon').innerHTML = formatIconMarkup(entry.id)
      button.querySelector('strong').textContent = entry.label
      button.querySelector('small').textContent = entry.description
      grid.append(button)
    }
    root.append(grid)
  }
}

function renderDetail() {
  const root = document.querySelector('#launcher-detail')
  root.replaceChildren()
  const recent = selected.kind === 'recent' ? recents.find(entry => recentId(entry) === selected.id) : null
  if (recent) renderRecentDetail(root, recent)
  else renderFormatDetail(root, launcherEntryFor(selected.id) ?? launcherEntryFor(DEFAULT_DIAGRAM_TYPE))
}

function renderFormatDetail(root, entry) {
  const state = exampleStateFor(entry.id)
  root.append(detailPreview(entry, state), detailBody({
    title: entry.label,
    description: entry.description,
    tags: [entry.groupLabel, ...entry.extensions],
    facts: [['Extension', entry.extensions.join(', ') || 'text'], ['Starts from', state.meta.title || `${entry.label} example`]],
    source: state.source,
  }), detailFooter([
    ['create', 'Create', true],
  ]))
}

function renderRecentDetail(root, entry) {
  const document = entry.kind === 'local' ? localDocuments.loadLocalDocument(entry.localId) : null
  const title = entry.title || 'Locked diagram'
  root.append(detailPreview(launcherEntryFor(entry.type), document?.state, {
    unavailableLabel: entry.mode === 'locked' ? 'Encrypted preview' : 'Open to load preview',
  }), detailBody({
    title,
    tags: [entry.kind === 'alias' ? 'published' : 'local only', entry.dirty ? 'unsaved' : '', entry.mode === 'locked' ? 'locked' : diagramLabel(entry.type)].filter(Boolean),
    facts: [['Edited', relativeTime(entry.updatedAt)], ['Size', entry.bytes ? formatBytes(entry.bytes) : 'remote'], ['Stored', entry.kind === 'local' ? 'this browser only' : 'published link']],
    source: document?.state.source ?? (entry.mode === 'locked' ? 'Encrypted source is never stored in recents.' : 'Open this diagram to load its latest published source.'),
  }), detailFooter([
    ['open', 'Open', true],
    ...(entry.kind === 'local' ? [['duplicate', 'Duplicate', false]] : []),
    ['delete', 'Remove', false],
  ]))
}

function detailPreview(entry, state, { unavailableLabel = 'Preview unavailable' } = {}) {
  return createPreviewFrame({
    className: 'launcher-detail-preview',
    state,
    alt: state ? `${entry?.label ?? 'Diagram'} template preview` : '',
    unavailableLabel,
  })
}

function createPreviewFrame({ className, state, alt, unavailableLabel = 'Preview unavailable' }) {
  const frame = document.createElement('span')
  frame.className = `launcher-preview-frame ${className}`
  frame.dataset.previewState = state ? 'loading' : 'unavailable'
  frame.innerHTML = `
    <span class="launcher-preview-placeholder" aria-hidden="true">
      <svg viewBox="0 0 48 32" focusable="false">
        <rect x="3" y="5" width="13" height="8" rx="2"></rect>
        <rect x="32" y="19" width="13" height="8" rx="2"></rect>
        <path d="M16 9h7a5 5 0 0 1 5 5v5h4m-7-2 3 3 3-3"></path>
      </svg>
      <small></small>
    </span>
    <img draggable="false" hidden>
  `
  frame.querySelector('img').alt = alt
  frame.querySelector('small').textContent = state ? 'Rendering preview…' : unavailableLabel
  if (state) loadPreviewImage(frame, state)
  return frame
}

async function loadPreviewImage(frame, state) {
  if (frame.dataset.previewStarted) return
  const image = frame.querySelector('img')
  frame.dataset.previewStarted = 'true'
  try {
    image.src = await previewRenderer.render(state, {
      appearance: systemColorScheme.matches ? 'dark-transparent' : 'light-transparent',
      priority: true,
    })
    if (!image.isConnected) return
    await image.decode().catch(() => {})
    if (!image.isConnected) return
    image.hidden = false
    frame.dataset.previewState = 'ready'
  } catch {
    if (!image.isConnected) return
    frame.dataset.previewState = 'error'
    frame.querySelector('.launcher-preview-placeholder small').textContent = 'Preview unavailable'
  }
}

function detailBody({ title, description = '', tags = [], facts = [], source = '' }) {
  const body = document.createElement('div')
  body.className = 'launcher-detail-body'
  const heading = document.createElement('h1')
  heading.textContent = title
  body.append(heading)
  if (description) {
    const copy = document.createElement('p')
    copy.textContent = description
    body.append(copy)
  }
  const tagList = document.createElement('div')
  tagList.className = 'launcher-tags'
  for (const value of tags) {
    const tag = document.createElement('span')
    tag.textContent = value
    tagList.append(tag)
  }
  body.append(tagList)
  const factsList = document.createElement('dl')
  for (const [term, value] of facts) {
    const dt = document.createElement('dt'); dt.textContent = term
    const dd = document.createElement('dd'); dd.textContent = value
    factsList.append(dt, dd)
  }
  body.append(factsList)
  const snippet = document.createElement('pre')
  snippet.textContent = source.slice(0, 1200)
  body.append(snippet)
  return body
}

function detailFooter(actions) {
  const footer = document.createElement('footer')
  footer.className = 'launcher-detail-footer'
  for (const [action, label, primary] of actions) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.detailAction = action
    button.className = primary ? 'primary-action' : 'secondary-action'
    button.textContent = label
    footer.append(button)
  }
  return footer
}

function renderStorage() {
  const count = recents.length
  const bytes = recents.reduce((total, entry) => total + (entry.bytes || 0), 0)
  const root = document.querySelector('#launcher-storage')
  root.replaceChildren()
  const summary = document.createElement('span')
  summary.textContent = count ? `${count} diagram${count === 1 ? '' : 's'} - ${formatBytes(bytes)} on this device` : 'Nothing stored on this device yet'
  root.append(summary)
  if (count) {
    const clear = document.createElement('button')
    clear.type = 'button'
    clear.dataset.clearRecents = ''
    clear.textContent = 'Clear recents…'
    root.append(clear)
  }
}

function visibleFormats() {
  const matches = new Set(filterLauncherCatalog(filterInput?.value ?? requestedType).map(entry => entry.id))
  return launcherCatalogGroups.flatMap(group => group.items).filter(entry => matches.has(entry.id) && (activeGroup === 'all' || entry.groupId === activeGroup))
}

function handleDetailAction(event) {
  const button = event.target.closest('[data-detail-action]')
  if (!button) return
  const action = button.dataset.detailAction
  const recent = selected.kind === 'recent' ? recents.find(entry => recentId(entry) === selected.id) : null
  if (action === 'create') return navigateToFormat(selected.id)
  if (!recent) return
  if (action === 'open') return openRecent(recent)
  if (action === 'duplicate' && recent.kind === 'local') return duplicateLocal(recent)
  if (action === 'delete') removeRecent(recent)
}

function activateSelection() {
  const recent = selected.kind === 'recent' ? recents.find(entry => recentId(entry) === selected.id) : null
  if (recent) openRecent(recent)
  else navigateToFormat(selected.id)
}

function navigateToFormat(type) {
  const url = new URL('/', location.origin)
  url.searchParams.set('type', type)
  location.assign(`${url.pathname}${url.search}`)
}

function openRecent(entry) {
  if (entry.kind === 'local') location.assign(`/?doc=${encodeURIComponent(entry.localId)}`)
  else location.assign(`/d/${entry.aliasId}${entry.mode !== 'locked' && entry.type ? `?type=${encodeURIComponent(entry.type)}` : ''}`)
}

function duplicateLocal(entry) {
  const document = localDocuments.loadLocalDocument(entry.localId)
  if (!document) return
  const title = `${document.state.meta?.title || entry.title || 'Untitled'} copy`
  const state = { ...document.state, meta: { ...document.state.meta, title } }
  const localId = localDocuments.saveLocalDocument({ ...document, state, title, dirty: true })
  if (localId) location.assign(`/?doc=${encodeURIComponent(localId)}`)
}

function removeRecent(entry) {
  const label = entry.kind === 'local' ? 'Delete this local-only diagram? This cannot be undone.' : 'Remove this published diagram from recents? The published link will keep working.'
  if (!confirm(label)) return
  if (entry.kind === 'local') localDocuments.deleteLocalDocument(entry.localId)
  else localDocuments.removeRecent({ aliasId: entry.aliasId })
  recents = localDocuments.loadRecents()
  selected = recents[0] ? { kind: 'recent', id: recentId(recents[0]) } : { kind: 'format', id: DEFAULT_DIAGRAM_TYPE }
  render()
}

async function openEditableFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    const state = await importEditableSvgFile(file)
    const localId = localDocuments.saveLocalDocument({ state, detailsSource: null, fileSnapshot: null, drafts: {}, dirty: true })
    if (!localId) throw new Error('The file could not be stored on this device.')
    location.assign(`/?doc=${encodeURIComponent(localId)}`)
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Could not open this editable SVG.')
  }
}

function openPasteDialog() {
  const dialog = document.querySelector('#paste-dialog')
  document.querySelector('#paste-source').value = ''
  document.querySelector('#paste-type').value = DEFAULT_DIAGRAM_TYPE
  dialog.showModal()
  document.querySelector('#paste-source').focus()
}

function createPastedDiagram(event) {
  event.preventDefault()
  const type = document.querySelector('#paste-type').value
  const source = document.querySelector('#paste-source').value
  if (!source.trim()) return
  const state = { ...exampleStateFor(type), source, meta: { title: '', description: '' } }
  const localId = localDocuments.saveLocalDocument({ state, detailsSource: null, fileSnapshot: null, drafts: {}, dirty: true })
  if (!localId) return alert('This diagram could not be stored on this device.')
  location.assign(`/?doc=${encodeURIComponent(localId)}`)
}

function detectDiagramType(source) {
  const value = source.trim()
  if (!value) return null
  if (/^@startuml\b/m.test(value)) return 'plantuml'
  if (/^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|gantt)\b/m.test(value)) return 'mermaid'
  if (/^(?:di)?graph\s+[\w"]*\s*\{/m.test(value)) return 'graphviz'
  if (/^workspace\b/m.test(value)) return 'structurizr'
  if (/^\s*<mxfile\b|<diagram\b/.test(value)) return 'diagramsnet'
  if (/^\s*<\?xml[\s\S]*<definitions\b/.test(value)) return 'bpmn'
  if (/^\s*\{[\s\S]*"(?:signal|head|config)"\s*:/.test(value)) return 'wavedrom'
  if (/^\s*(?:Table|Project|Enum)\b/m.test(value)) return 'dbml'
  return null
}

function moveFormatSelection(key) {
  const formats = visibleFormats()
  if (!formats.length) return
  const current = Math.max(0, formats.findIndex(entry => selected.kind === 'format' && entry.id === selected.id))
  const columns = listMode ? 1 : Math.max(1, Math.floor(document.querySelector('#launcher-catalog').clientWidth / 175))
  const delta = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : key === 'ArrowDown' ? columns : -columns
  const index = (current + delta + formats.length) % formats.length
  selected = { kind: 'format', id: formats[index].id }
  render()
  document.querySelector(`[data-format-id="${formats[index].id}"]`)?.scrollIntoView({ block: 'nearest' })
}

function selectDefaultFormat() {
  activeGroup = 'all'
  filterInput.value = ''
  selected = { kind: 'format', id: DEFAULT_DIAGRAM_TYPE }
  render()
  document.querySelector(`[data-format-id="${DEFAULT_DIAGRAM_TYPE}"]`)?.focus()
}

function recentId(entry) {
  return entry.kind === 'local' ? `local:${entry.localId}` : `alias:${entry.aliasId}`
}

function diagramLabel(type) {
  return launcherEntryFor(type)?.label ?? type ?? 'Diagram'
}

function formatMonogram(type) {
  return (launcherEntryFor(type)?.label ?? '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
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

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`
}
