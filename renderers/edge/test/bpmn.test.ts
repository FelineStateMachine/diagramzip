import { describe, expect, it } from 'vitest'
import fixture from './fixtures/bpmn/core.bpmn?raw'
import productionFixture from '../../../examples/diagrams/example.bpmn?raw'
import { parseBpmn, renderBpmn } from '../src/adapters/bpmn'

describe('bounded BPMN DI-to-SVG adapter', () => {
  it('renders core shapes, connections, labels, and dimensions', () => {
    const parsed = parseBpmn(fixture); expect(parsed.shapes).toHaveLength(5); expect(parsed.edges).toHaveLength(4)
    const svg = renderBpmn(fixture)
    expect(svg).toContain('viewBox="0 0 606 121"'); expect(svg).toContain('Review order'); expect(svg).toContain('Approved?')
    expect(svg).toContain('marker-end="url(#bpmn-arrow)"'); expect(svg).toContain('data-bpmn-id="Gateway"')
  })
  it('rejects active XML, malformed DI, and oversized coordinates', () => {
    expect(() => renderBpmn('<!DOCTYPE definitions [<!ENTITY x "y">]><definitions/>')).toThrow(/doctype|entity/i)
    expect(() => renderBpmn('<definitions xmlns="x"><process id="p"><task id="t"/></process><bpmndi:BPMNDiagram xmlns:bpmndi="d"><bpmndi:BPMNPlane><bpmndi:BPMNShape bpmnElement="t"/></bpmndi:BPMNPlane></bpmndi:BPMNDiagram></definitions>')).toThrow(/bounds|shapes/i)
    expect(() => renderBpmn(fixture.replace('x="20"', 'x="999999"'))).toThrow(/range|coordinate/i)
    expect(() => renderBpmn('x'.repeat(512 * 1024 + 1))).toThrow(/512 KiB/i)
  })
  it('escapes labels and does not emit active content', () => {
    const svg = renderBpmn(fixture.replace('name="Review order"', 'name="&lt;x&gt;&amp;danger&lt;/x&gt;"'))
    expect(svg).toContain('&lt;x&gt;&amp;danger&lt;/x&gt;'); expect(svg).not.toContain('<x>'); expect(svg).not.toContain('foreignObject')
  })
  it('renders the production fixture including empty BPMN label bounds', () => {
    const svg = renderBpmn(productionFixture)
    expect(svg).toContain('Examine Situation')
    expect(svg).toContain('Notification Sent')
  })
})
