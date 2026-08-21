import assert from 'node:assert/strict'
import test from 'node:test'
import {
  APPEARANCES,
  RAW_NORMALIZATION,
  SvgNormalizationError,
  canonicalizeSvg,
  materializePresentation,
  materializeSvg,
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

test('keeps legacy editor presentation outside the canonical render', () => {
  const canonical = canonicalizeSvg(source, metadata, 'pikchr')
  const displayed = materializePresentation(canonical, { background: '#ffffff', padding: 8, frame: true })

  assert.match(canonical, /data-dz-bounds="0 0 10 10"/)
  assert.doesNotMatch(canonical, /fill="#ffffff"/)
  assert.doesNotMatch(canonical, /viewBox="-8 -8 26 26"/)
  assert.match(displayed, /fill="#ffffff"/)
  assert.match(displayed, /viewBox="-8 -8 26 26"/)
})

test('exposes structured normalization failures to both callers', () => {
  assert.throws(
    () => sanitizeAndDecorateSvg('<svg><style>@import "https://example.com/x";</style></svg>', metadata, presentation, 'pikchr'),
    error => error instanceof SvgNormalizationError && error.code === 'unsafe_svg' && error.status === 422,
  )
})

const semanticCanonical = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10" data-dz-schema="1" data-dz-normalizer="svg-normalizer-1" data-dz-profile="fixture-semantic-1" data-dz-palette="renderer" data-dz-engine="fixture" data-dz-appearance="raw" data-dz-conformance="semantic" data-dz-bounds="0 0 10 10" data-dz-appearances="auto-transparent light-transparent dark-transparent auto-framed light-framed dark-framed"><rect x="1" y="1" width="8" height="8" fill="white" stroke="black" data-dz-fill="surface-1" data-dz-stroke="line"></rect><text x="5" y="6" fill="black" data-dz-fill="ink">A</text></svg>'

test('materializes explicit and automatic palettes without changing diagram geometry', () => {
  const light = materializeSvg(semanticCanonical, 'light-transparent')
  const dark = materializeSvg(semanticCanonical, 'dark-transparent')
  const automatic = materializeSvg(semanticCanonical, 'auto-transparent')

  for (const output of [light, dark, automatic]) {
    assert.match(output, /data-dz-materializer="svg-materializer-1"/)
    assert.match(output, /data-dz-palette="diagramzip-palette-1"/)
    assert.match(output, /<rect x="1" y="1" width="8" height="8"/)
    assert.doesNotMatch(output, /<(?:rect|path|polygon)[^>]*data-dz-role="canvas"/)
  }
  assert.match(light, /--dz-ink:#0f172a/)
  assert.match(dark, /--dz-ink:#f8fafc/)
  assert.match(automatic, /@media\(prefers-color-scheme:dark\)/)
})

test('materializes a bounded frame and remains idempotent', () => {
  const framed = materializeSvg(semanticCanonical, 'dark-framed')
  const repeated = materializeSvg(framed, 'dark-framed')

  assert.equal(framed, repeated)
  assert.match(framed, /viewBox="-24 -24 58 58"/)
  assert.match(framed, /data-dz-role="canvas"/)
  assert.match(framed, /data-dz-role="frame"/)
  assert.match(framed, /vector-effect="non-scaling-stroke"/)
})

test('fails closed when a raw-only profile requests a themed appearance', () => {
  const raw = sanitizeAndDecorateSvg(source, metadata, presentation, 'pikchr')
  assert.throws(
    () => materializeSvg(raw, 'dark-framed'),
    error => error instanceof SvgNormalizationError && error.code === 'unsupported_appearance',
  )
})

test('applies the pinned GraphViz semantic profile without recoloring authored paint', () => {
  const graphviz = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><g class="graph"><polygon fill="white" stroke="none" points="0,0 100,0 100,50 0,50"></polygon><g class="node"><ellipse fill="none" stroke="black" cx="25" cy="25" rx="20" ry="10"></ellipse><text fill="black">A</text></g><g class="node"><ellipse fill="red" stroke="red" cx="75" cy="25" rx="20" ry="10"></ellipse><text fill="white">B</text></g><g class="edge"><path fill="none" stroke="black" d="M45 25L55 25"></path><polygon fill="black" stroke="black" points="55,25 50,20 50,30"></polygon></g></g></svg>'
  const canonical = sanitizeAndDecorateSvg(graphviz, metadata, presentation, 'graphviz', 'graphviz@15.1.1')
  const dark = materializeSvg(canonical, 'dark-transparent')

  assert.match(canonical, /data-dz-profile="graphviz-15-semantic-1"/)
  assert.match(canonical, /data-dz-conformance="semantic"/)
  assert.match(canonical, /data-dz-role="canvas"/)
  assert.match(canonical, /data-dz-fill="surface-1"/)
  assert.match(canonical, /data-dz-stroke="line"/)
  assert.match(dark, /data-dz-role="canvas"\]:not/)
  assert.match(dark, /fill="red" stroke="red"/)
  assert.doesNotMatch(dark, /fill="red" stroke="red"[^>]*data-dz-/)
})
