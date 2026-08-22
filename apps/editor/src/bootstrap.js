import './style.css'
import { isKnownDiagramType } from './diagram-types.js'
import { createLocalDocuments } from './local-documents.js'

createLocalDocuments().migrateLegacyDraft()

const url = new URL(location.href)
const aliasRoute = /^\/d\/[A-Za-z0-9_-]{16}\/?$/.test(url.pathname)
const requestedType = url.searchParams.get('type')
const editorRoute = aliasRoute || url.searchParams.has('doc') || isKnownDiagramType(requestedType)

if (editorRoute) {
  await import('./main.js')
} else {
  await import('./launcher.js')
}
