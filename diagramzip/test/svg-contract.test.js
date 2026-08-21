import assert from 'node:assert/strict'
import test from 'node:test'
import {
  APPEARANCES,
  RAW_NORMALIZATION,
  SvgNormalizationError,
  sanitizeAndDecorateSvg,
} from '../../diagramzip-svg/index.js'

const metadata = { title: '', description: '' }
const presentation = { background: '', padding: 0, frame: false }
const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0L10 10" stroke="black"></path></svg>'

test('freezes namespaced appearance and raw capability contracts', () => {
  assert.deepEqual(APPEARANCES, [
    'raw',
    'auto-transparent',
    'light-transparent',
    'dark-transparent',
    'auto-framed',
    'light-framed',
    'dark-framed',
  ])
  assert.deepEqual(RAW_NORMALIZATION.appearances, ['raw'])
})

test('produces deterministic, idempotent raw canonical SVG', () => {
  const first = sanitizeAndDecorateSvg(source, metadata, presentation, 'pikchr')
  const repeated = sanitizeAndDecorateSvg(source, metadata, presentation, 'pikchr')
  const normalizedAgain = sanitizeAndDecorateSvg(first, metadata, presentation, 'pikchr')

  assert.equal(first, repeated)
  assert.equal(first, normalizedAgain)
  assert.match(first, /data-dz-normalizer="svg-normalizer-1"/)
  assert.match(first, /data-dz-profile="safe-raw-1"/)
  assert.match(first, /data-dz-palette="renderer"/)
  assert.match(first, /data-dz-conformance="raw"/)
  assert.doesNotMatch(first, /data-theme=/)
})

test('exposes structured normalization failures to both callers', () => {
  assert.throws(
    () => sanitizeAndDecorateSvg('<svg><style>@import "https://example.com/x";</style></svg>', metadata, presentation, 'pikchr'),
    error => error instanceof SvgNormalizationError && error.code === 'unsafe_svg' && error.status === 422,
  )
})
