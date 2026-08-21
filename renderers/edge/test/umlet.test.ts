import { describe, expect, it } from 'vitest'
import example from '../../../examples/diagrams/umlet.xml?raw'
import { parseUmlet, renderUmlet } from '../src/languages/umlet'

describe('bounded UMLet UXF translation', () => {
  it('covers every element in the repository fixture without Java or a browser', () => {
    const elements = parseUmlet(example)
    expect(elements).toHaveLength(28)
    const svg = renderUmlet(example)
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox=')
    expect(svg).toContain('read boarding')
    expect(svg).toContain('>pass</text>')
    expect(svg).toContain('marker-start="url(#arrow)"')
    expect(svg).not.toContain('<foreignObject')
  })

  it('renders the five repository custom classes explicitly', () => {
    const svg = renderUmlet(example)
    expect(svg).toContain('rx=')
    expect(svg).toContain('<circle')
    expect(svg).toContain('>H</text>')
    expect(svg).not.toContain('custom State')
    expect(svg).not.toContain('custom FinalState')
  })

  it('keeps unknown custom elements visible as labeled bounded fallbacks', () => {
    const svg = renderUmlet(`<diagram><element><type>com.umlet.element.custom.Radar</type><coordinates><x>10</x><y>20</y><w>120</w><h>60</h></coordinates><panel_attributes>signal &amp; range</panel_attributes></element></diagram>`)
    expect(svg).toContain('custom Radar')
    expect(svg).toContain('signal &amp;')
    expect(svg).toContain('>range</text>')
    expect(svg).toContain('stroke-dasharray="5 4"')
  })

  it('rejects active XML features, unbounded coordinates, and oversized sources', () => {
    expect(() => renderUmlet('<!DOCTYPE diagram [<!ENTITY x "y">]><diagram/>')).toThrow(/doctype/i)
    expect(() => renderUmlet('<diagram><?run x?><element/></diagram>')).toThrow(/processing|valid bounded/i)
    expect(() => renderUmlet('<diagram><element><id>UMLClass</id><coordinates><x>0</x><y>0</y><w>99999</w><h>10</h></coordinates></element></diagram>')).toThrow(/8192/i)
    expect(() => renderUmlet('x'.repeat(262_145))).toThrow(/256 KiB/i)
  })
})
