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
} from '../../../shared/svg/index.js'

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
  assert.match(first, /data-dz-normalizer="svg-normalizer-2"/)
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

test('recomputes stale semantic annotations when upgrading the normalizer build', () => {
  const stale = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" data-dz-schema="1" data-dz-normalizer="svg-normalizer-1" data-dz-profile="graphviz-15-semantic-1" data-dz-materializer="svg-materializer-1"><style data-dz-owned="materializer">stale</style><rect data-dz-owned="materializer" data-dz-role="canvas" width="100" height="50"></rect><rect data-dz-owned="normalizer" data-dz-role="object-surface" data-dz-fill="surface-1" width="10" height="10"></rect><g class="node"><ellipse fill="none" stroke="black" stroke-width="0" cx="50" cy="25" rx="40" ry="20" data-dz-fill="surface-1"></ellipse><rect x="20" y="10" width="60" height="30" fill="white" stroke="black" data-renderer-id="kept" data-dz-fill="surface-3"></rect></g></svg>'
  const upgraded = canonicalizeSvg(stale, metadata, 'dbml', 'dbml@1.0.31+graphviz@15.1.1')

  assert.match(upgraded, /data-dz-normalizer="svg-normalizer-2"/)
  assert.doesNotMatch(upgraded, /data-dz-owned=/)
  assert.doesNotMatch(upgraded, /<ellipse[^>]*data-dz-/)
  assert.match(upgraded, /data-renderer-id="kept" data-dz-fill="surface-1" data-dz-stroke="line"/)
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

const semanticCanonical = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10" data-dz-schema="1" data-dz-normalizer="svg-normalizer-2" data-dz-profile="fixture-semantic-1" data-dz-palette="renderer" data-dz-engine="fixture" data-dz-appearance="raw" data-dz-conformance="semantic" data-dz-bounds="0 0 10 10" data-dz-appearances="auto-transparent light-transparent dark-transparent auto-framed light-framed dark-framed"><rect x="1" y="1" width="8" height="8" fill="white" stroke="black" data-dz-fill="surface-1" data-dz-stroke="line"></rect><text x="5" y="6" fill="black" data-dz-fill="ink">A</text></svg>'

test('materializes explicit and automatic palettes without changing diagram geometry', () => {
  const light = materializeSvg(semanticCanonical, 'light-transparent')
  const dark = materializeSvg(semanticCanonical, 'dark-transparent')
  const automatic = materializeSvg(semanticCanonical, 'auto-transparent')

  for (const output of [light, dark, automatic]) {
    assert.match(output, /data-dz-materializer="svg-materializer-3"/)
    assert.match(output, /data-dz-palette="diagramzip-palette-2"/)
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

  assert.match(canonical, /data-dz-profile="graphviz-15-semantic-2"/)
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
      engine: 'd2', version: 'd2@0.7.1/dagre-wasm-1', profile: 'd2-0.7-semantic-2',
      source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="0" y="0" width="20" height="20" fill="#FFFFFF"></rect><rect class="shape fill-B6 stroke-B1" x="2" y="2" width="16" height="16" fill="#f7f8fe" stroke="#0d32b2"></rect><text class="fill-N1" fill="#0a0f25">A</text></svg>',
      roles: ['data-dz-role="canvas"', 'data-dz-fill="surface-1"', 'data-dz-stroke="accent-1"', 'data-dz-fill="ink"'],
    },
    {
      engine: 'plantuml', version: 'plantuml@1.2026.6/edge-wasm-1', profile: 'plantuml-2026-semantic-2',
      source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#E2E2F0" stroke="#181818"></rect><text fill="#000000">A</text></svg>',
      roles: ['data-dz-fill="surface-1"', 'data-dz-stroke="line"', 'data-dz-fill="ink"'],
    },
    {
      engine: 'svgbob', version: 'svgbob@0.7.6/edge-wasm-1', profile: 'svgbob-0.7-semantic-2',
      source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><style>.solid{stroke:black}.nofill{fill:white}</style><rect class="backdrop" x="0" y="0" width="20" height="20" fill="white"></rect><rect class="solid nofill" x="2" y="2" width="16" height="16"></rect><text>A</text></svg>',
      roles: ['data-dz-role="canvas"', 'data-dz-stroke="line"', 'data-dz-fill="surface-1"', 'data-dz-fill="ink"'],
    },
    {
      engine: 'blockdiag', version: 'blockdiag@3.4.2/python-worker-1', profile: 'neutral-svg-semantic-2',
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

test('normalizes TRN table structure and relationship zones', () => {
  const trn = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect class="trn-canvas" width="80" height="40" fill="#fbf8dc"></rect><text class="trn-title" fill="#111827">Bread</text><rect class="trn-table-surface" y="10" width="80" height="30" fill="white"></rect><path class="trn-zone-shape trn-branch-4" fill="white" stroke="#65a268"></path><text class="trn-operation-label" fill="#111827">mix</text></svg>',
    metadata, 'trn', 'diagramzip-trn@15',
  )

  assert.match(trn, /data-dz-profile="trn-semantic-4"/)
  assert.match(trn, /class="trn-zone-shape trn-branch-4"[^>]*data-dz-fill="accent-4"[^>]*data-dz-stroke="line-muted"/)
  assert.match(trn, /class="trn-operation-label"[^>]*data-dz-fill="on-accent"/)
  const light = materializeSvg(trn, 'light-transparent')
  assert.match(light, /:root\[data-dz-profile="trn-semantic-4"\]\{--dz-accent-1:#dbeafe;--dz-accent-2:#fef3c7;--dz-accent-3:#ede9fe;--dz-accent-4:#ccfbf1;--dz-on-accent:#0f172a;/)
  const dark = materializeSvg(trn, 'dark-transparent')
  assert.match(dark, /data-dz-appearance="dark-transparent"/)
  assert.match(dark, /--dz-accent-4:#34d399/)
  assert.doesNotMatch(dark, /--dz-accent-1:#dbeafe/)
})

test('themes every Svgbob stroke without treating open curves as object surfaces', () => {
  const canonical = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" class="svgbob"><path id="curve" d="M 8,2 A 8,8 0,0,0 8,18" class="nofill"></path><path id="closed" d="M20 2L30 2L30 18L20 18Z" class="nofill"></path><line id="plain" x1="2" y1="10" x2="6" y2="10"></line><rect id="box" x="32" y="2" width="6" height="16" class="solid nofill"></rect></svg>',
    metadata, 'svgbob', 'svgbob@0.7.6/edge-wasm-1',
  )

  const curve = canonical.match(/<path id="curve"[^>]*>/)?.[0] ?? ''
  const closed = canonical.match(/<path id="closed"[^>]*>/)?.[0] ?? ''
  const plain = canonical.match(/<line id="plain"[^>]*>/)?.[0] ?? ''
  const box = canonical.match(/<rect id="box"[^>]*>/)?.[0] ?? ''
  assert.match(curve, /data-dz-stroke="line"/)
  assert.doesNotMatch(curve, /data-dz-fill=/)
  assert.match(closed, /data-dz-stroke="line"/)
  assert.match(closed, /data-dz-fill="surface-1"/)
  assert.match(plain, /data-dz-stroke="line"/)
  assert.match(box, /data-dz-stroke="line"/)
  assert.match(box, /data-dz-fill="surface-1"/)
})

test('adapts neutral authored paint while preserving non-neutral paint and transparent support', () => {
  const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="white"></rect><path d="M1 1L9 9" stroke="hotpink"></path><text x="2" y="6" fill="black">A</text></svg>'
  const canonical = canonicalizeSvg(source, metadata, 'tikz', '@planktimerr/tikzjax@1.0.63/client-unit-1')
  const framed = materializeSvg(canonical, 'auto-framed')
  const transparent = materializeSvg(canonical, 'dark-transparent')

  assert.match(canonical, /data-dz-profile="authored-neutral-semantic-1"/)
  assert.match(canonical, /data-dz-conformance="adaptive"/)
  assert.match(canonical, /data-dz-role="canvas"/)
  assert.match(canonical, /stroke="hotpink"/)
  assert.doesNotMatch(canonical, /stroke="hotpink"[^>]*data-dz-/)
  assert.match(canonical, /data-dz-fill="ink"/)
  assert.match(framed, /data-dz-role="frame"/)
  assert.match(transparent, /data-dz-appearance="dark-transparent"/)
})

test('keeps GraphViz canvases and arrowheads coherent without consuming WireViz wire colors', () => {
  const graphviz = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><g class="graph"><polygon fill="white" stroke="none" points="-4,-4 44,-4 44,24 -4,24"></polygon><g class="edge"><path fill="none" stroke="black" d="M2 10L30 10"></path><polygon fill="black" stroke="black" points="30,10 25,7 25,13"></polygon></g></g></svg>',
    metadata, 'graphviz', 'graphviz@15.1.1',
  )
  assert.match(graphviz, /data-dz-role="canvas"/)
  assert.match(graphviz, /<polygon fill="black" stroke="black"[^>]*data-dz-stroke="line"[^>]*data-dz-fill="line"/)

  const wireviz = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30"><g class="graph"><polygon fill="white" stroke="none" points="0,0 100,0 100,30 0,30"></polygon><g class="node"><rect x="2" y="2" width="96" height="26" fill="white" stroke="black"></rect><path d="M2 10L98 10" fill="none" stroke="#ef4444"></path><path d="M2 14L98 14" fill="none" stroke="white"></path></g></g></svg>',
    metadata, 'wireviz', '0.3.2',
  )
  assert.match(wireviz, /stroke="#ef4444"/)
  assert.doesNotMatch(wireviz, /stroke="#ef4444"[^>]*data-dz-/)
  assert.match(wireviz, /stroke="white"/)
  assert.doesNotMatch(wireviz, /stroke="white"[^>]*data-dz-/)
})

test('maps DBML table paint without turning invisible bounds into oval surfaces', () => {
  const canonical = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><g class="graph"><g class="node"><ellipse fill="none" stroke="black" stroke-width="0" cx="60" cy="40" rx="58" ry="38"></ellipse><polygon fill="#1d71b8" stroke="none" points="10,10 110,10 110,35 10,35"></polygon><text x="20" y="28" fill="#ffffff">users</text><polygon fill="#e7e2dd" stroke="none" points="10,35 110,35 110,70 10,70"></polygon><text x="20" y="58" fill="#29235c">id integer</text></g><g class="edge"><path fill="none" stroke="#29235c" d="M1 1L8 8"></path><polygon fill="#29235c" stroke="#29235c" points="8,8 4,7 7,4"></polygon></g></g></svg>',
    metadata, 'dbml', 'dbml@1.0.31+graphviz@15.1.1',
  )
  assert.match(canonical, /fill="#1d71b8"[^>]*data-dz-fill="accent-1"/)
  assert.match(canonical, /fill="#ffffff"[^>]*data-dz-fill="on-accent"/)
  assert.match(canonical, /fill="#e7e2dd"[^>]*data-dz-fill="surface-1"/)
  assert.match(canonical, /fill="#29235c"[^>]*data-dz-fill="ink"/)
  assert.doesNotMatch(canonical, /<ellipse[^>]*data-dz-/)
})

test('recognizes nested D2 and WaveDrom canvases while leaving masks renderer-defined', () => {
  const d2 = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><svg viewBox="-10 -10 40 40"><rect x="-10" y="-10" width="40" height="40" fill="#FFFFFF" class="fill-N7" stroke-width="0"></rect><mask id="m"><rect x="-10" y="-10" width="40" height="40" fill="white"></rect><rect x="1" y="1" width="8" height="8" fill="black"></rect></mask><rect class="shape fill-B6" x="2" y="2" width="16" height="16" fill="#f7f8fe"></rect></svg></svg>',
    metadata, 'd2', 'd2@0.7.1/dagre-wasm-1',
  )
  assert.equal((d2.match(/data-dz-role="canvas"/g) ?? []).length, 1)
  assert.doesNotMatch(d2.match(/<mask[\s\S]*?<\/mask>/)?.[0] ?? '', /data-dz-(?:fill|stroke|role)/)

  const wavedrom = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><rect width="40" height="20" style="stroke:none;fill:white"></rect><text x="5" y="12" class="info">clock</text><path class="s7" d="M0 0L20 0L20 20L0 20Z"></path></svg>',
    metadata, 'wavedrom', 'wavedrom@3.6.2',
  )
  assert.match(wavedrom, /data-dz-role="canvas"/)
  assert.match(wavedrom, /class="info"[^>]*data-dz-fill="ink-muted"/)
  assert.match(wavedrom, /class="s7"[^>]*data-dz-fill="surface-1"/)
})

test('normalizes CSS-driven Mermaid and BPMN neutral structures', () => {
  const mermaid = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><defs><marker><path class="arrowMarkerPath" d="M0 0L5 2L0 4Z"></path></marker></defs><path class="flowchart-link" d="M20 20L80 20"></path><g class="node default"><rect class="basic label-container" x="2" y="2" width="36" height="24"></rect><foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">Idea</span></div></foreignObject></g></svg>',
    metadata, 'mermaid', 'mermaid@11.17.0',
  )
  assert.match(mermaid, /class="arrowMarkerPath"[^>]*data-dz-fill="line"[^>]*data-dz-stroke="line"/)
  assert.match(mermaid, /class="flowchart-link"[^>]*data-dz-stroke="line"/)
  assert.match(mermaid, /class="basic label-container"[^>]*data-dz-fill="surface-1"[^>]*data-dz-stroke="line"/)
  assert.match(mermaid, /class="nodeLabel"[^>]*data-dz-fill="ink"/)

  const bpmn = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect x="2" y="2" width="70" height="30" style="stroke:rgb(34,36,42);stroke-width:2px;fill:white"></rect><text class="djs-label" x="10" y="20" style="fill:rgb(34,36,42)"><tspan x="10" y="20">Task</tspan></text><rect class="djs-hit" x="0" y="0" width="100" height="40" style="fill:none;stroke-opacity:0;stroke:white"></rect></svg>',
    metadata, 'bpmn', 'bpmn-js@18.25.1',
  )
  assert.match(bpmn, /data-dz-fill="surface-1"/)
  assert.match(bpmn, /data-dz-stroke="line"/)
  assert.equal((bpmn.match(/data-dz-fill="ink"/g) ?? []).length, 2)
  assert.doesNotMatch(bpmn.match(/<rect class="djs-hit"[^>]*>/)?.[0] ?? '', /data-dz-/)
  assert.equal(normalizationFor('bpmn', 'diagramzip-bpmn-svg@1').profile, 'neutral-svg-semantic-2')
})

test('creates addressable surfaces for closed Pikchr and line-built Svgbob boxes', () => {
  const pikchr = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><path d="M1 1L19 1L19 19L1 19Z" style="fill:none;stroke:rgb(0,0,0)"></path><text x="5" y="12" fill="black">A</text></svg>',
    metadata, 'pikchr', 'pikchr@85e65b9686/edge-wasm-1',
  )
  assert.match(pikchr, /<path[^>]*data-dz-fill="surface-1"/)

  const svgbob = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30" class="svgbob"><g><line x1="4" y1="4" x2="24" y2="4" class="solid"></line><line x1="4" y1="4" x2="4" y2="24" class="solid"></line><line x1="24" y1="4" x2="24" y2="24" class="solid"></line><line x1="4" y1="24" x2="24" y2="24" class="solid"></line></g></svg>',
    metadata, 'svgbob', 'svgbob@0.7.6/edge-wasm-1',
  )
  assert.match(svgbob, /data-dz-owned="normalizer" data-dz-role="object-surface" data-dz-fill="surface-1"/)
  assert.equal((svgbob.match(/data-dz-role="object-surface"/g) ?? []).length, 1)
  assert.equal(canonicalizeSvg(svgbob, metadata, 'svgbob', 'svgbob@0.7.6/edge-wasm-1'), svgbob)

  const labeled = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30" class="svgbob"><text x="8" y="16">User</text><g><line x1="4" y1="4" x2="24" y2="4" class="solid"></line><line x1="4" y1="4" x2="4" y2="24" class="solid"></line><line x1="24" y1="4" x2="24" y2="24" class="solid"></line><line x1="4" y1="24" x2="24" y2="24" class="solid"></line></g></svg>',
    metadata, 'svgbob', 'svgbob@0.7.6/edge-wasm-1',
  )
  assert.ok(labeled.indexOf('data-dz-role="object-surface"') < labeled.indexOf('>User</text>'))
})

test('keeps hollow semantic markers unpainted in themed appearances', () => {
  const plantuml = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><g><circle fill="#E2E2F0" stroke="#181818" r="8" cx="50" cy="10"></circle><path fill="#00000000" stroke="#181818" d="M50,18 L50,45 M37,26 L63,26 M50,45 L37,60 M50,45 L63,60"></path></g></svg>',
    metadata, 'plantuml', 'plantuml@1.2026.6/edge-wasm-1',
  )
  const goat = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle class="hollow" cx="10" cy="10" r="6"></circle></svg>',
    metadata, 'goat', 'goat@0.5.1/edge-wasm-1',
  )
  for (const canonical of [plantuml, goat]) {
    assert.match(canonical, /data-dz-fill="none"/)
    assert.match(materializeSvg(canonical, 'dark-transparent'), /\[data-dz-fill="none"\]\{fill:none!important\}/)
  }
})

test('preserves WaveDrom authored categorical colors', () => {
  const canonical = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><style>.s8{fill:#ffe0b9}.s9{fill:#ffc0a0}</style><path class="s8" d="M0 0H20V20H0Z"></path><path class="s9" d="M20 0H40V20H20Z"></path></svg>',
    metadata, 'wavedrom', 'wavedrom@3.6.2',
  )
  assert.doesNotMatch(canonical.match(/<path class="s8"[^>]*>/)?.[0] ?? '', /data-dz-fill/)
  assert.doesNotMatch(canonical.match(/<path class="s9"[^>]*>/)?.[0] ?? '', /data-dz-fill/)
  const themed = materializeSvg(canonical, 'dark-transparent')
  assert.match(themed, /\.s8\{fill:#ffe0b9\}/)
  assert.match(themed, /\.s9\{fill:#ffc0a0\}/)
})

test('resolves text against normalized light surfaces and C4 accents', () => {
  const blockdiag = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect x="5" y="5" width="90" height="30" fill="rgb(219,234,254)" stroke="rgb(0,0,0)"></rect><text x="20" y="25" fill="rgb(0,0,0)">Agent</text></svg>',
    metadata, 'blockdiag', 'blockdiag@3.4.2/python-worker-1',
  )
  assert.match(blockdiag, /data-dz-fill="surface-2"/)
  assert.match(blockdiag, /<text[^>]*data-dz-fill="ink"/)

  const c4 = canonicalizeSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><g><rect x="5" y="5" width="90" height="40" fill="#08427B" stroke="#181818"></rect><text x="20" y="30" fill="#000000">Person</text></g></svg>',
    metadata, 'c4plantuml', 'plantuml@1.2026.6/edge-wasm-1',
  )
  assert.match(c4, /data-dz-fill="accent-1"/)
  assert.match(c4, /<text[^>]*data-dz-fill="on-accent"/)
})

test('transparent appearances survive adversarial light and dark substrates without a renderer canvas', () => {
  const fixtures = [
    canonicalizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect width="20" height="20" fill="white"></rect><path d="M2 2L18 18" stroke="black"></path></svg>', metadata, 'excalidraw', '@excalidraw/excalidraw@0.18.1'),
    canonicalizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect class="backdrop" width="20" height="20" fill="white"></rect><rect class="solid nofill" x="2" y="2" width="16" height="16"></rect><text x="5" y="12">A</text></svg>', metadata, 'ditaa', 'ditaa-ascii-via-svgbob@0.7.6/edge-wasm-1'),
  ]
  for (const canonical of fixtures) {
    for (const appearance of ['light-transparent', 'dark-transparent']) {
      const output = materializeSvg(canonical, appearance)
      assert.match(output, /\[data-dz-role="canvas"\]:not\(\[data-dz-owned="materializer"\]\)\{display:none!important\}/)
      assert.doesNotMatch(output, /<(?:rect|path|polygon)[^>]*data-dz-owned="materializer"[^>]*data-dz-role="canvas"/)
    }
  }
})
