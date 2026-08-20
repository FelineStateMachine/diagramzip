import assert from 'node:assert/strict'
import test from 'node:test'
import { ClientSvgError, sanitizeAndDecorateSvg } from '../src/client-svg.js'

const metadata = { title: 'Client preview', description: 'Rendered locally' }
const presentation = { background: '#f3f3f3', padding: 16, frame: true }

test('sanitizes and decorates a client-rendered SVG', () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">
    <script>alert(1)</script>
    <image href="https://example.com/tracker.png" onload="alert(1)" />
    <foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><span>Alice Agent</span><img src="https://example.com/x" /></div></foreignObject>
    <style><![CDATA[@keyframes dashdraw{to{stroke-dashoffset:0}} .edge{animation:dashdraw 2s linear infinite}]]></style>
    <rect x="10" y="10" width="20" height="10" fill="white" stroke="black" />
  </svg>`

  const rendered = sanitizeAndDecorateSvg(source, metadata, presentation, 'mermaid')
  assert.match(rendered, /<title>Client preview<\/title>/)
  assert.match(rendered, /<desc>Rendered locally<\/desc>/)
  assert.match(rendered, /viewBox="-16 -16 132 82"/)
  assert.match(rendered, /fill="#f3f3f3"/)
  assert.match(rendered, /Alice Agent/)
  assert.match(rendered, /@keyframes dashdraw/)
  assert.match(rendered, /vector-effect="non-scaling-stroke"/)
  assert.match(rendered, /width="20" height="10" fill="white" stroke="black"/)
  assert.doesNotMatch(rendered, /<script|<img|https:\/\/example\.com|onload=/)
})

test('rejects unsafe client-rendered CSS', () => {
  assert.throws(
    () => sanitizeAndDecorateSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>rect{fill:url(https://example.com/x)}</style></svg>',
      { title: '', description: '' },
      { background: '', padding: 0, frame: false },
      'mermaid',
    ),
    ClientSvgError,
  )
})

test('removes a full renderer backdrop but preserves internal white shapes', () => {
  const rendered = sanitizeAndDecorateSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect width="100%" height="100%" fill="white"/><rect x="10" y="10" width="20" height="10" fill="white" stroke="black"/></svg>',
    { title: '', description: '' },
    { background: '#222222', padding: 0, frame: false },
    'mermaid',
  )
  assert.doesNotMatch(rendered, /width="100%"/)
  assert.match(rendered, /width="20" height="10" fill="white" stroke="black"/)
})
