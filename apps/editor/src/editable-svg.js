import {
  EDITABLE_SVG_SCHEMA,
  attachEditableDocument,
  extractEditableDocument,
  materializePresentation,
  materializeSvg,
} from '../../../shared/svg/index.js'
import { isKnownDiagramType } from './diagram-types.js'
import { normalizeMetadata, normalizePresentation } from './state.js'

const MAX_SOURCE_BYTES = 768 * 1024
const MAX_METADATA_TITLE = 200
const MAX_METADATA_DESCRIPTION = 2000
const encoder = new TextEncoder()

export class EditableSvgError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'EditableSvgError'
    this.code = code
  }
}

function fail(code, message) {
  throw new EditableSvgError(code, message)
}

function record(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail('invalid_document', `${label} must be an object.`)
  return value
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort()
  const allowed = [...expected].sort()
  if (actual.length !== allowed.length || actual.some((key, index) => key !== allowed[index])) {
    fail('invalid_document', `${label} has unsupported or missing fields.`)
  }
}

function normalizedJson(value, label, depth = 0) {
  if (depth > 20) fail('invalid_document', `${label} is nested too deeply.`)
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.map(item => normalizedJson(item, label, depth + 1))
  const input = record(value, label)
  return Object.fromEntries(Object.keys(input).sort().map(key => [key, normalizedJson(input[key], label, depth + 1)]))
}

export function normalizeEditableState(value) {
  const manifest = record(value, 'Editable SVG document')
  exactKeys(manifest, ['schema', 'diagram', 'metadata'], 'Editable SVG document')
  if (manifest.schema !== Number(EDITABLE_SVG_SCHEMA)) fail('unsupported_schema', 'Editable SVG uses an unsupported document schema.')

  const diagram = record(manifest.diagram, 'diagram')
  exactKeys(diagram, ['type', 'source', 'options', 'presentation'], 'diagram')
  if (typeof diagram.type !== 'string' || !isKnownDiagramType(diagram.type)) fail('unsupported_type', 'Editable SVG uses an unsupported diagram type.')
  if (typeof diagram.source !== 'string') fail('invalid_document', 'diagram.source must be a string.')
  if (encoder.encode(diagram.source).byteLength > MAX_SOURCE_BYTES) fail('source_too_large', 'Editable SVG source is too large.')
  const options = normalizedJson(diagram.options, 'diagram.options')
  if (Array.isArray(options) || typeof options !== 'object' || options === null) fail('invalid_document', 'diagram.options must be an object.')

  const metadataValue = record(manifest.metadata, 'metadata')
  exactKeys(metadataValue, ['title', 'description'], 'metadata')
  const meta = normalizeMetadata(metadataValue)
  if (meta.title.length > MAX_METADATA_TITLE || meta.description.length > MAX_METADATA_DESCRIPTION) {
    fail('invalid_document', 'Editable SVG metadata is too large.')
  }

  const presentationValue = record(diagram.presentation, 'diagram.presentation')
  exactKeys(presentationValue, ['background', 'padding', 'frame', 'appearance'], 'diagram.presentation')
  let presentation
  try {
    presentation = normalizePresentation(presentationValue)
  } catch (error) {
    fail('invalid_document', error instanceof Error ? error.message : 'Editable SVG presentation is invalid.')
  }

  return { type: diagram.type, source: diagram.source, options, meta, presentation }
}

export function editableDocumentFor(state) {
  const normalized = normalizeEditableState({
    schema: Number(EDITABLE_SVG_SCHEMA),
    diagram: {
      type: state.type,
      source: state.source,
      options: state.options ?? {},
      presentation: normalizePresentation(state.presentation),
    },
    metadata: normalizeMetadata(state.meta),
  })
  return {
    schema: Number(EDITABLE_SVG_SCHEMA),
    diagram: {
      type: normalized.type,
      source: normalized.source,
      options: normalized.options,
      presentation: normalized.presentation,
    },
    metadata: normalized.meta,
  }
}

export function exportEditableSvg(canonical, state) {
  const document = editableDocumentFor(state)
  const { appearance, background, padding, frame } = document.diagram.presentation
  const materialized = appearance === 'raw'
    ? materializePresentation(canonical, { background, padding, frame })
    : materializeSvg(canonical, appearance)
  return attachEditableDocument(materialized, document)
}

export function importEditableSvg(source) {
  return normalizeEditableState(extractEditableDocument(source))
}
