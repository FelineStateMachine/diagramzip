import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { goatAdapter } from '../src/adapters/edge/goat'
import type { RenderRequest } from '../src/types'

const request = (source: string, options: Record<string, string> = {}): RenderRequest => ({
  engine: 'goat', source, format: 'svg', options,
  metadata: { title: '', description: '' },
  presentation: { background: '', padding: 0, frame: false },
})

const fixture = ' +--+\n |A |\n +--+'

describe('GoAT edge-Wasm adapter', () => {
  it('matches the pinned Docker native fixture byte-for-byte', async () => {
    const result = await goatAdapter.render(request(fixture), new AbortController().signal)
    expect(result.body).toContain('<svg')
    expect(result.body).toMatch(/width="48" height="58"/)
    expect(createHash('sha256').update(result.body).digest('hex')).toBe('c12324f3c2d5c3dbe68f3661fd617133121b25f4da6e8d170dce6118907a8330')
  })

  it('preserves leading whitespace and exact ASCII defaults', async () => {
    const result = await goatAdapter.render(request(' +--+\n |A |\n +--+'), new AbortController().signal)
    expect(result.body).toMatch(/width="48" height="58"/)
    expect(result.body).toContain('color: #000')
    expect(result.body).toContain('color: #FFF')
  })

  it('uses UTF-8 mode by option presence, including an empty value', async () => {
    const result = await goatAdapter.render(request('┌──┐\n│A │\n└──┘', { utf8: '' }), new AbortController().signal)
    expect(result.body).toContain('<svg')
    expect(result.body).toContain('A')
  })

  it('retains the light and dark color CSS branches', async () => {
    const result = await goatAdapter.render(request('box', {
      'svg-color-light-scheme': '#123456', 'svg-color-dark-scheme': 'rgb(255, 0, 0)',
    }), new AbortController().signal)
    expect(result.body).toContain('color: #123456')
    expect(result.body).toContain('color: rgb(255, 0, 0)')
    expect(result.body).toContain('prefers-color-scheme: dark')
  })

  it('rejects unknown, unsafe, malformed, and oversized inputs', async () => {
    const invalidOptions: Record<string, string>[] = [
      { css: 'x' },
      { 'svg-color-light-scheme': 'rgb(0,0,0);fill:url(https://x)' },
      { 'svg-color-light-scheme': 'rgb(0, 0' },
      { 'svg-color-light-scheme': 'var(--x)' },
    ]
    for (const options of invalidOptions) await expect(goatAdapter.render(request('box', options), new AbortController().signal)).rejects.toMatchObject({ status: 400 })
    await expect(goatAdapter.render(request('é'.repeat(140_000)), new AbortController().signal)).rejects.toMatchObject({ status: 413 })
  })

  it('is stable across sequential and concurrent calls', async () => {
    const signal = new AbortController().signal
    const sequential = await Promise.all([1, 2, 3].map(() => goatAdapter.render(request(fixture), signal)))
    expect(new Set(sequential.map(result => result.body)).size).toBe(1)
    const concurrent = await Promise.all([
      goatAdapter.render(request(' +--+\n |A |\n +--+'), signal),
      goatAdapter.render(request(' +----+\n | B  |\n +----+'), signal),
      goatAdapter.render(request(' +-----+\n | C   |\n +-----+'), signal),
    ])
    expect(concurrent.every(result => result.body.includes('<svg'))).toBe(true)
  })
})
