import { describe, expect, it } from 'vitest'
import { sanitizeAndDecorateSvg } from '../src/svg'

describe('SVG normalization', () => {
  it('removes active content and external links', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20" onload="alert(1)"><script>alert(1)</script><a href="https://example.com"><text>x</text></a></svg>'
    const result = sanitizeAndDecorateSvg(source, { title: '', description: '' }, { background: '', padding: 0, frame: false })
    expect(result).not.toContain('onload')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('https://example.com')
    expect(result).toContain('<text>x</text>')
  })

  it('applies metadata and presentation after sanitization', () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" viewBox="0 0 10 20"><path d="M0 0"/></svg>'
    const result = sanitizeAndDecorateSvg(
      source,
      { title: 'A & B', description: 'Diagram <description>' },
      { background: '#ffffff', padding: 4, frame: true },
    )
    expect(result).toContain('viewBox="-4 -4 18 28"')
    expect(result).toContain('width="18"')
    expect(result).toContain('height="28"')
    expect(result).toContain('<title>A &amp; B</title>')
    expect(result).toContain('<desc>Diagram &lt;description&gt;</desc>')
    expect(result).toContain('fill="#ffffff"')
    expect(result).toContain('vector-effect="non-scaling-stroke"')
  })

  it('rejects unsafe stylesheet URLs', () => {
    expect(() => sanitizeAndDecorateSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>rect{fill:url(https://example.com/a)}</style></svg>',
      { title: '', description: '' },
      { background: '', padding: 0, frame: false },
    )).toThrow('unsafe CSS')
  })
})
