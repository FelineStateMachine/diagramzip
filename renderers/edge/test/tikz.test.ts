import { afterEach, describe, expect, it, vi } from 'vitest'
import { tikzCore } from '../artifacts/tikz/tikz-core.js'
import { tikzAdapter } from '../src/adapters/tikz'
const request = (source: string) => ({
  engine: 'tikz' as const, source, format: 'svg' as const, options: {},
  metadata: { title: '', description: '' },
  presentation: { background: 'transparent', padding: 0, frame: false },
})

afterEach(() => vi.unstubAllGlobals())

describe('native TikZ edge adapter', () => {
  it('extracts a complete document and renders it through the edge core', async () => {
    const load = vi.spyOn(tikzCore, 'load').mockResolvedValue()
    const texify = vi.spyOn(tikzCore, 'texify').mockResolvedValue('<svg><path d="M0 0h1"/></svg>')
    const source = String.raw`\documentclass{standalone}
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}\draw (0,0) -- (1,1);\end{tikzpicture}
\end{document}`

    const result = await tikzAdapter.render(request(source), new AbortController().signal)

    expect(load).toHaveBeenCalledOnce()
    expect(texify).toHaveBeenCalledWith(expect.stringContaining('\\begin{tikzpicture}'), {
      addToPreamble: expect.stringContaining('\\usepackage{tikz}'),
    })
    expect(result).toMatchObject({ runtime: 'edge-wasm', contentType: 'image/svg+xml' })
  })

  it('rejects oversized input before entering the serialized core', async () => {
    const result = tikzAdapter.render(request('x'.repeat(256 * 1024 + 1)), new AbortController().signal)
    await expect(result).rejects.toMatchObject({ code: 'source_too_large', status: 413 })
  })
})
