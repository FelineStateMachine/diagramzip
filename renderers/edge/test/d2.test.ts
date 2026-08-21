import { describe, expect, it } from 'vitest'
import { DOMParser } from 'linkedom'
import { d2Adapter } from '../src/adapters/d2'
import type { RenderRequest } from '../src/runtime/types'

const request = (source: string, options: Record<string, string> = {}): RenderRequest => ({
  engine: 'd2',
  source, format: 'svg' as const, options,
  metadata: { title: '', description: '' },
  presentation: { background: '', padding: 0, frame: false },
})

describe('D2 dedicated Worker adapter', () => {
  it('uses the Dagre top-to-bottom default layout', async () => {
    const result = await d2Adapter.render(request('a -> b -> c'), new AbortController().signal)
    const document = new DOMParser().parseFromString(result.body, 'image/svg+xml')
    const nodes = [...document.querySelectorAll('g.shape > rect')].slice(0, 3)
    const x = nodes.map(node => Number(node.getAttribute('x')))
    const y = nodes.map(node => Number(node.getAttribute('y')))
    const span = (values: number[]) => Math.max(...values) - Math.min(...values)

    expect(nodes).toHaveLength(3)
    expect(span(y)).toBeGreaterThan(span(x))
  })

  it('accepts Dagre and rejects ELK and out-of-range animation options explicitly', async () => {
    await expect(d2Adapter.render(request('a -> b', { layout: 'dagre' }), new AbortController().signal)).resolves.toMatchObject({ contentType: 'image/svg+xml' })
    await expect(d2Adapter.render(request('a -> b', { layout: 'elk' }), new AbortController().signal)).rejects.toMatchObject({ code: 'unsupported_options', status: 400 })
    await expect(d2Adapter.render(request('a -> b', { 'animate-interval': '0' }), new AbortController().signal)).rejects.toMatchObject({ code: 'invalid_options', status: 400 })
    await expect(d2Adapter.render(request('a -> b', { 'animate-interval': '60001' }), new AbortController().signal)).rejects.toMatchObject({ code: 'invalid_options', status: 400 })
  })

  it('renders ordinary labels and animated multi-board SVG', async () => {
    const result = await d2Adapter.render(request('a -> b: { style.animated: true }\nsteps: {\n  1: {\n    next -> done\n  }\n}', { 'animate-interval': '1000' }), new AbortController().signal)
    expect(result.body).toMatch(/<svg[\s>]/i)
    expect(result.body).toContain('@keyframes')
    expect(result.body).toContain('<animate attributeName="stroke-dashoffset"')
    expect(result.body).toContain('repeatCount="indefinite"')
    expect(result.body).toMatch(/<path[^>]*animated-connection[^>]*><animate[^>]*><\/animate><\/path>/)
    expect(result.body).not.toContain('animation: dashdraw')
    expect(result.body).not.toMatch(/<path[^>]*animated-connection[^>]*style="[^"]*stroke-dashoffset/)
    expect(result.body).not.toMatch(/<path[^>]*animated-connection[^>]*mask=/)
    expect(result.body).toContain('next')
  })
})
