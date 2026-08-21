import { describe, expect, it } from 'vitest'
import { svgbobAdapter } from '../src/adapters/edge/svgbob'
import type { RenderRequest } from '../src/types'

const request = (source: string, options: Record<string, string> = {}): RenderRequest => ({
  engine: 'svgbob', source, format: 'svg', options,
  metadata: { title: '', description: '' },
  presentation: { background: '', padding: 0, frame: false },
})
const cloud = `                  .-,(  ),-.
   ___  _      .-(          )-.
  [___]|=| -->(                )      __________
  /::/ |_|     '-(          ).-' --->[_...__... ]
                  '-.( ).-'
                          \\      ____   __
                           '--->|    | |==|
                                |____| |  |
                                /::::/ |__|`

describe('Svgbob edge-Wasm adapter', () => {
  it('renders ASCII source without trimming its leading whitespace', async () => {
    const result = await svgbobAdapter.render(request('  +---+\n  | A |\n  +---+'), new AbortController().signal)
    expect(result.runtime).toBe('edge-wasm')
    expect(result.body).toContain('<svg')
    expect(result.body).toContain('A')
  })

  it('maps the six Kroki settings to the pure library API', async () => {
    const result = await svgbobAdapter.render(request('A -> B', {
      background: '#f3f3f3', 'fill-color': '#123456', 'font-family': 'monospace',
      'font-size': '18', scale: '2', 'stroke-width': '3',
    }), new AbortController().signal)
    expect(result.body).toContain('#f3f3f3')
    expect(result.body).toContain('#123456')
    expect(result.body).toContain('font-size: 18px')
  })

  it('keeps upstream cloud fixture dimensions at 400x160 and scales to 600x240', async () => {
    const defaultResult = await svgbobAdapter.render(request(cloud), new AbortController().signal)
    const scaledResult = await svgbobAdapter.render(request(cloud, { scale: '1.5' }), new AbortController().signal)
    expect(defaultResult.body).toMatch(/<svg[^>]*width="400"[^>]*height="160"/)
    expect(scaledResult.body).toMatch(/<svg[^>]*width="600"[^>]*height="240"/)
  })

  it('rejects unknown, invalid, and oversized input before Wasm', async () => {
    await expect(svgbobAdapter.render(request('A', { 'stroke-color': 'red' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'unsupported_options' })
    await expect(svgbobAdapter.render(request('A', { scale: 'NaN' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'invalid_options' })
    await expect(svgbobAdapter.render(request('é'.repeat(140_000)), new AbortController().signal)).rejects.toMatchObject({ status: 413, code: 'source_too_large' })
  })
})
