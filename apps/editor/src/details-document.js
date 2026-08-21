import { APPEARANCES } from './client-svg.js'
import { normalizeMetadata, normalizePresentation } from './state.js'

export const DETAILS_MODEL_URI = 'inmemory://diagram.zip/details.json'
export const DETAILS_SCHEMA_URI = 'https://diagram.zip/schemas/details.v1.json'

export const DETAILS_DOCUMENT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: DETAILS_SCHEMA_URI,
  title: 'Diagram details',
  description: 'Metadata and presentation settings for the current diagram.',
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'presentation'],
  properties: {
    title: {
      type: 'string',
      maxLength: 200,
      description: 'Document title. The browser tab and shared embeds use this value.',
    },
    description: {
      type: 'string',
      maxLength: 2000,
      description: 'A plain-text description of what the diagram shows.',
    },
    presentation: {
      type: 'object',
      additionalProperties: false,
      required: ['appearance', 'background', 'padding', 'frame'],
      properties: {
        appearance: {
          type: 'string',
          enum: APPEARANCES,
          description: 'raw preserves renderer paint; themed appearances use the shared Diagram.zip palette.',
        },
        background: {
          type: 'string',
          pattern: '^(?:|#[0-9a-fA-F]{6})$',
          description: 'Renderer-default canvas color as an empty string or a six-digit hex color. Used by raw appearance.',
        },
        padding: {
          type: 'integer',
          minimum: 0,
          maximum: 256,
          description: 'Renderer-default canvas padding in pixels. Used by raw appearance.',
        },
        frame: {
          type: 'boolean',
          description: 'Add a bounded renderer-default canvas. Used by raw appearance.',
        },
      },
    },
  },
}

export function detailsDocumentFor(state = {}) {
  const meta = normalizeMetadata(state.meta)
  const presentation = normalizePresentation(state.presentation)
  return {
    title: meta.title,
    description: meta.description,
    presentation,
  }
}

export function serializeDetailsDocument(state) {
  return `${JSON.stringify(detailsDocumentFor(state), null, 2)}\n`
}

export function parseDetailsDocument(source) {
  let value
  try {
    value = JSON.parse(source)
  } catch (error) {
    throw new Error(`Details must be valid JSON. ${error instanceof Error ? error.message : ''}`.trim())
  }
  assertObject(value, 'Details must be a JSON object.')
  assertKeys(value, ['title', 'description', 'presentation'], 'details')
  assertRequired(value, ['title', 'description', 'presentation'], 'details')
  if (typeof value.title !== 'string' || value.title.length > 200) {
    throw new Error('title must be a string with at most 200 characters.')
  }
  if (typeof value.description !== 'string' || value.description.length > 2000) {
    throw new Error('description must be a string with at most 2000 characters.')
  }

  assertObject(value.presentation, 'presentation must be a JSON object.')
  assertKeys(value.presentation, ['appearance', 'background', 'padding', 'frame'], 'presentation')
  assertRequired(value.presentation, ['appearance', 'background', 'padding', 'frame'], 'presentation')
  let presentation
  try {
    presentation = normalizePresentation(value.presentation)
  } catch {
    throw new Error('presentation has an invalid appearance, background, padding, or frame value.')
  }
  return {
    meta: normalizeMetadata({ title: value.title, description: value.description }),
    presentation,
  }
}

function assertObject(value, message) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(message)
}

function assertKeys(value, allowed, label) {
  const unknown = Object.keys(value).find(key => !allowed.includes(key))
  if (unknown) throw new Error(`${label} contains unknown property "${unknown}".`)
}

function assertRequired(value, required, label) {
  const missing = required.find(key => !Object.hasOwn(value, key))
  if (missing) throw new Error(`${label} is missing required property "${missing}".`)
}
