import { describe, expect, it } from 'vitest'
import { sanitizeAndDecorateSvg } from '../src/svg'

describe('SVG normalization', () => {
  it('removes active content and external links', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20" onload="alert(1)"><script>alert(1)</script><a href="https://example.com"><text>x</text></a></svg>'
    const result = sanitizeAndDecorateSvg(source, { title: '', description: '' }, { background: '', padding: 0, frame: false }, 'pikchr')
    expect(result).not.toContain('onload')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('https://example.com')
    expect(result).toContain('<text>x</text>')
  })

  it('preserves CDATA labels and styles used by Ditaa, Symbolator, and TikZ', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><style><![CDATA[.label { font-family: Helvetica; } @keyframes dashdraw { from { stroke-dashoffset: 10; } } .animated { animation: dashdraw 2s linear infinite; }]]></style><text class="label"><![CDATA[Alice Agent]]></text></svg>'
    const result = sanitizeAndDecorateSvg(source, { title: '', description: '' }, { background: '', padding: 0, frame: false }, 'ditaa')
    expect(result).toContain('.label { font-family: Helvetica; }')
    expect(result).toContain('@keyframes dashdraw')
    expect(result).toContain('animation: dashdraw')
    expect(result).toContain('<text class="label">Alice Agent</text>')
  })

  it('preserves a narrow safe subset of Mermaid XHTML labels', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><foreignObject width="100" height="20"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center"><span><strong>Alice</strong> Agent</span><script>alert(1)</script><img src="https://example.com/x"></img></div></foreignObject></svg>'
    const result = sanitizeAndDecorateSvg(source, { title: '', description: '' }, { background: '', padding: 0, frame: false }, 'mermaid')
    expect(result).toContain('<foreignObject')
    expect(result).toContain('<strong>Alice</strong> Agent')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('<img')
    expect(result).not.toContain('https://example.com')
  })

  it('replaces renderer canvas backdrops without removing internal white shapes', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 80"><rect x="-10" y="-10" width="100%" height="100%" fill="white"></rect><g><rect x="0" y="0" width="40" height="20" fill="white" stroke="black"></rect></g></svg>'
    const result = sanitizeAndDecorateSvg(source, { title: '', description: '' }, { background: '#f4f4f4', padding: 0, frame: false }, 'symbolator')
    expect(result).not.toContain('width="100%"')
    expect(result).toContain('<rect x="0" y="0" width="40" height="20" fill="white" stroke="black"></rect>')
    expect(result).toContain('background-color:#f4f4f4')
    expect(result).toContain('fill="#f4f4f4"')
  })

  it('removes nested D2, Svgbob, and GraphViz canvas backdrops', () => {
    const d2 = sanitizeAndDecorateSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><svg viewBox="-10 -10 120 80"><rect class="backdrop" x="-10" y="-10" width="120" height="80" fill="#FFFFFF"></rect><rect x="0" y="0" width="20" height="20" fill="#FFFFFF" stroke="#000000"></rect></svg></svg>',
      { title: '', description: '' },
      { background: '#f4f4f4', padding: 0, frame: false },
      'd2',
    )
    expect(d2).not.toContain('class="backdrop"')
    expect(d2).toContain('width="20" height="20" fill="#FFFFFF" stroke="#000000"')

    const graphviz = sanitizeAndDecorateSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><g><polygon fill="white" stroke="none" points="0,0 20,0 20,20 0,20"></polygon><polygon fill="white" stroke="black" points="2,2 4,2 4,4 2,4"></polygon></g></svg>',
      { title: '', description: '' },
      { background: '#f4f4f4', padding: 0, frame: false },
      'graphviz',
    )
    expect(graphviz).not.toContain('fill="white" stroke="none"')
    expect(graphviz).toContain('fill="white" stroke="black"')
  })

  it('applies metadata and presentation after sanitization', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" viewBox="0 0 10 20"><path d="M0 0"/></svg>'
    const result = sanitizeAndDecorateSvg(
      source,
      { title: 'A & B', description: 'Diagram <description>' },
      { background: '#ffffff', padding: 4, frame: true },
      'pikchr',
    )
    expect(result).toContain('viewBox="-4 -4 18 28"')
    expect(result).toContain('width="18"')
    expect(result).toContain('height="28"')
    expect(result).toContain('<title>A &amp; B</title>')
    expect(result).toContain('<desc>Diagram &lt;description&gt;</desc>')
    expect(result).toContain('fill="#ffffff"')
    expect(result).toContain('vector-effect="non-scaling-stroke"')
    expect(result).toContain('x="-3.5" y="-3.5" width="17" height="27" fill="none"')
  })

  it('rejects unsafe stylesheet URLs', () => {
    expect(() => sanitizeAndDecorateSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>rect{fill:url(https://example.com/a)}</style></svg>',
      { title: '', description: '' },
      { background: '', padding: 0, frame: false },
      'pikchr',
    )).toThrow('unsafe CSS')
  })
})
