import { describe, expect, it } from 'vitest'
import { ditaaAdapter } from '../src/adapters/ditaa'
import type { RenderRequest } from '../src/runtime/types'

const request = (source: string, options: Record<string, string> = {}): RenderRequest => ({
  engine: 'ditaa', source, format: 'svg', options,
  metadata: { title: '', description: '' },
  presentation: { background: '', padding: 0, frame: false },
})

describe('Ditaa edge adapter', () => {
  it('renders the documented ASCII fixture without Java', async () => {
    const result = await ditaaAdapter.render(request('+--------+       +-------------+\n|  User  |------>| diagram.zip |\n+--------+       +-------------+'), new AbortController().signal)
    expect(result.runtime).toBe('edge-wasm')
    expect(result.body).toContain('<svg')
    expect(result.body).toContain('User')
    expect(result.body).toContain('diagram.zip')
  })

  it('renders the repository components fixture with its connector labels', async () => {
    const source = `      +--------+
      |        |
      |  User  |
      |        |
      +--------+
          ^
  request |
          v
  +-------------+
  |             |
  |    Kroki    |
  |             |---+
  +-------------+   |
       ^  ^         | inflate
       |  |         |
       v  +---------+
  +-------------+
  |             |
  |    Ditaa    |
  |             |----+
  +-------------+    |
             ^       | process
             |       |
             +-------+`
    const result = await ditaaAdapter.render(request(source), new AbortController().signal)
    expect(result.body).toContain('User')
    expect(result.body).toContain('Kroki')
    expect(result.body).toContain('Ditaa')
    expect(result.body).toContain('inflate')
    expect(result.body).toContain('process')
  })

  it('removes Ditaa shape/color directives while retaining labels', async () => {
    const result = await ditaaAdapter.render(request('+-------+\n| API {cBLU} {d} |\n+-------+'), new AbortController().signal)
    expect(result.body).toContain('API')
    expect(result.body).not.toContain('cBLU')
    expect(result.body).not.toContain('{d}')
  })

  it('supports bounded scale, tabs, and transparent/background options', async () => {
    const result = await ditaaAdapter.render(request('\t+---+\n\t| A |\n\t+---+', { tabs: '4', scale: '2', background: 'F0F0F0' }), new AbortController().signal)
    expect(result.body).toContain('#F0F0F0')
    expect(result.body).toContain('width="')
  })

  it('accepts legacy appearance flags as documented no-ops', async () => {
    const result = await ditaaAdapter.render(request('+---+\n| A |\n+---+', {
      'no-antialias': '',
      'no-separation': 'true',
      'round-corners': '1',
      'no-shadows': 'yes',
    }), new AbortController().signal)
    expect(result.body).toContain('<svg')
    expect(result.body).toContain('A')
  })

  it('rejects unsupported and oversized inputs', async () => {
    await expect(ditaaAdapter.render(request('A', { foo: 'bar' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'unsupported_options' })
    await expect(ditaaAdapter.render(request('A', { scale: 'NaN' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'invalid_options' })
    await expect(ditaaAdapter.render(request('A', { scale: '16.1' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'invalid_options' })
    await expect(ditaaAdapter.render(request('\tA', { tabs: '32.1' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'invalid_options' })
    await expect(ditaaAdapter.render(request('\tA', { tabs: '1.5' }), new AbortController().signal)).rejects.toMatchObject({ status: 400, code: 'invalid_options' })
    await expect(ditaaAdapter.render(request('x'.repeat(270_000)), new AbortController().signal)).rejects.toMatchObject({ status: 413, code: 'source_too_large' })
  })

  it('accepts named CSS backgrounds without corrupting the color', async () => {
    const result = await ditaaAdapter.render(request('A', { background: 'white' }), new AbortController().signal)
    expect(result.body).toContain('white')
    expect(result.body).not.toContain('#white')
  })
})
