import { describe, expect, it } from 'vitest'
import { pikchrAdapter } from '../src/adapters/edge/pikchr'
import type { RenderRequest } from '../src/types'

const request = (source: string, options: Record<string, string> = {}): RenderRequest => ({
  engine: 'pikchr', source, format: 'svg', options,
  metadata: { title: '', description: '' },
  presentation: { background: '', padding: 0, frame: false },
})

describe('Pikchr edge-Wasm adapter', () => {
  it('renders the pinned upstream fixture and preserves labels', async () => {
    const result = await pikchrAdapter.render(request('D: diamond "Cardinal" "Points"\n dot ".n" above at D.n'), new AbortController().signal)
    expect(result.runtime).toBe('edge-wasm')
    expect(result.body).toContain('<svg')
    expect(result.body).toContain('Cardinal')
  })

  it('returns bounded parser errors instead of invalid SVG', async () => {
    await expect(pikchrAdapter.render(request('this is not pikchr {'), new AbortController().signal)).rejects.toMatchObject({ status: 422, code: 'render_failed' })
  })

  it('rejects options and oversized UTF-8 sources', async () => {
    await expect(pikchrAdapter.render(request('box', { dark: 'true' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'unsupported_options' })
    await expect(pikchrAdapter.render(request('é'.repeat(140_000)), new AbortController().signal)).rejects.toMatchObject({ status: 413, code: 'source_too_large' })
  })
})
