import assert from 'node:assert/strict'
import test from 'node:test'
import {
  APPEARANCES,
  RAW_NORMALIZATION,
  SvgNormalizationError,
  canonicalizeSvg,
  materializePresentation,
  materializeSvg,
  supportedAppearances,
  normalizationFor,
  sanitizeAndDecorateSvg,
} from '../../../packages/svg/index.js'

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

test('falls back to safe raw for an unknown renderer build', () => {
  assert.equal(normalizationFor('d2', 'd2@future').profile, 'safe-raw-1')
  assert.equal(normalizationFor('unknown', 'unknown@1').profile, 'safe-raw-1')
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

test('does not duplicate root metadata when canonical output crosses another consumer', () => {
  const once = canonicalizeSvg(source, { title: 'A', description: 'B' }, 'pikchr')
  const twice = canonicalizeSvg(once, { title: 'A', description: 'B' }, 'pikchr')
  assert.equal((twice.match(/<title>/g) ?? []).length, 1)
  assert.equal((twice.match(/<desc>/g) ?? []).length, 1)
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

test('reports the appearances declared by the canonical profile', () => {
  assert.deepEqual(supportedAppearances(semanticCanonical), [
    'raw',
    'auto-transparent',
    'light-transparent',
    'dark-transparent',
    'auto-framed',
    'light-framed',
    'dark-framed',
  ])
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

test('applies D2, PlantUML, Svgbob, and neutral SVG family roles', () => {
  const fixtures = [
    {
      engine: 'd2', version: 'd2@0.7.1/dagre-wasm-1', profile: 'd2-0.7-semantic-1',
      source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="0" y="0" width="20" height="20" fill="#FFFFFF"></rect><rect class="shape fill-B6 stroke-B1" x="2" y="2" width="16" height="16" fill="#f7f8fe" stroke="#0d32b2"></rect><text class="fill-N1" fill="#0a0f25">A</text></svg>',
      roles: ['data-dz-role="canvas"', 'data-dz-fill="surface-1"', 'data-dz-stroke="accent-1"', 'data-dz-fill="ink"'],
    },
    {
      engine: 'plantuml', version: 'plantuml@1.2026.6/edge-wasm-1', profile: 'plantuml-2026-semantic-1',
      source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#E2E2F0" stroke="#181818"></rect><text fill="#000000">A</text></svg>',
      roles: ['data-dz-fill="surface-1"', 'data-dz-stroke="line"', 'data-dz-fill="ink"'],
    },
    {
      engine: 'svgbob', version: 'svgbob@0.7.6/edge-wasm-1', profile: 'svgbob-0.7-semantic-1',
      source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><style>.solid{stroke:black}.nofill{fill:white}</style><rect class="backdrop" x="0" y="0" width="20" height="20" fill="white"></rect><rect class="solid nofill" x="2" y="2" width="16" height="16"></rect><text>A</text></svg>',
      roles: ['data-dz-role="canvas"', 'data-dz-stroke="line"', 'data-dz-fill="surface-1"', 'data-dz-fill="ink"'],
    },
    {
      engine: 'blockdiag', version: 'blockdiag@3.4.2/python-worker-1', profile: 'neutral-svg-semantic-1',
      source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="rgb(255,255,255)" stroke="rgb(0,0,0)"></rect><text fill="rgb(0,0,0)">A</text></svg>',
      roles: ['data-dz-fill="surface-1"', 'data-dz-stroke="line"', 'data-dz-fill="ink"'],
    },
  ]

  for (const fixture of fixtures) {
    const canonical = canonicalizeSvg(fixture.source, metadata, fixture.engine, fixture.version)
    assert.match(canonical, new RegExp(`data-dz-profile="${fixture.profile}"`))
    for (const role of fixture.roles) assert.ok(canonical.includes(role), `${fixture.engine} missing ${role}`)
    assert.match(materializeSvg(canonical, 'dark-transparent'), /data-dz-appearance="dark-transparent"/)
  }
})

test('keeps authored SVG paint intact while offering an outer frame', () => {
  const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="hotpink"></rect></svg>'
  const canonical = canonicalizeSvg(source, metadata, 'tikz', '@planktimerr/tikzjax@1.0.63/client-unit-1')
  const framed = materializeSvg(canonical, 'auto-framed')

  assert.match(canonical, /data-dz-conformance="presentation-only"/)
  assert.match(canonical, /data-dz-appearances="auto-framed light-framed dark-framed"/)
  assert.match(framed, /fill="hotpink"/)
  assert.throws(
    () => materializeSvg(canonical, 'dark-transparent'),
    error => error instanceof SvgNormalizationError && error.code === 'unsupported_appearance',
  )
})
