import { afterEach, describe, expect, it, vi } from 'vitest'
import { tikzCore } from '../artifacts/tikz/tikz-core.js'
import { createTikzAdapter } from '../src/adapters/tikz'
import tikzUnit from '../src/units/tikz'
const request = (source: string) => ({
  engine: 'tikz' as const, source, format: 'svg' as const, options: {},
  metadata: { title: '', description: '' },
  presentation: { background: 'transparent', padding: 0, frame: false },
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('native TikZ edge adapter', () => {
  it('extracts a complete document and renders it through the edge core', async () => {
    const load = vi.spyOn(tikzCore, 'load').mockResolvedValue()
    const texify = vi.spyOn(tikzCore, 'texify').mockResolvedValue('<svg><path d="M0 0h1"/></svg>')
    const tikzAdapter = createTikzAdapter(async () => new Response('asset'))
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
    const tikzAdapter = createTikzAdapter(async () => new Response('asset'))
    const result = tikzAdapter.render(request('x'.repeat(256 * 1024 + 1)), new AbortController().signal)
    await expect(result).rejects.toMatchObject({ code: 'source_too_large', status: 413 })
  })

  it('loads runtime files through the static-assets binding', async () => {
    const assetFetch = vi.fn(async (_input: RequestInfo | URL) => new Response('compressed asset'))
    vi.spyOn(tikzCore, 'load').mockImplementation(async fetchAsset => {
      const response = await fetchAsset('core.dump.gz')
      expect(await response.text()).toBe('compressed asset')
    })
    vi.spyOn(tikzCore, 'texify').mockResolvedValue('<svg><path d="M0 0h1"/></svg>')
    const fetchUnit = tikzUnit.fetch!
    const response = await fetchUnit(
      new Request('https://tikz.render.diagram.zip/v1/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: `\\begin{tikzpicture}\\draw (0,0) -- (${crypto.randomUUID().length},1);\\end{tikzpicture}`,
          options: {},
          metadata: { title: '', description: '' },
          presentation: { background: '', padding: 0, frame: false },
        }),
      }) as Parameters<typeof fetchUnit>[0],
      { RENDERER_BUILD: 'tikz-test-1', ASSETS: { fetch: assetFetch } } as unknown as Parameters<typeof fetchUnit>[1],
      { waitUntil() {}, passThroughOnException() {}, props: {} } as unknown as ExecutionContext,
    )

    expect(response.status).toBe(200)
    expect(assetFetch).toHaveBeenCalledOnce()
    expect(new URL(String(assetFetch.mock.calls[0]?.[0])).pathname).toBe('/core.dump.gz')
  })
})
