import { describe, expect, it } from 'vitest'
import example from '../../../examples/diagrams/venn.excalidraw?raw'
import { excalidrawAdapter } from '../src/adapters/excalidraw'

const request = (source: string) => ({ engine: 'excalidraw' as const, source, format: 'svg' as const, options: {}, metadata: { title: '', description: '' }, presentation: { background: '', padding: 0, frame: false } })

describe('native Excalidraw adapter', () => {
  it('renders the repository fixture to SVG', async () => {
    const result = await excalidrawAdapter.render(request(example), new AbortController().signal)
    expect(result.body).toContain('<svg')
    expect(result.body).toContain('<path')
    expect(result.body).toContain('<text')
    expect(result.runtime).toBe('edge-js')
  })

  it('rejects external resources and oversized scenes', async () => {
    await expect(excalidrawAdapter.render(request(JSON.stringify({ elements: [{ type: 'image', src: 'https://example.com/a.png' }] })), new AbortController().signal)).rejects.toMatchObject({ code: 'unsafe_include' })
    await expect(excalidrawAdapter.render(request(JSON.stringify({ elements: [{ type: 'text', link: 'javascript:alert(1)' }] })), new AbortController().signal)).rejects.toMatchObject({ code: 'unsafe_include' })
    await expect(excalidrawAdapter.render(request('x'.repeat(524_289)), new AbortController().signal)).rejects.toMatchObject({ code: 'source_too_large' })
  })
})
