import { describe, expect, it } from 'vitest'
import { graphvizAdapter, optionsFor, renderGraphvizSource } from '../src/adapters/edge/graphviz'
import type { RenderRequest } from '../src/types'

describe('GraphViz option lowering', () => {
  it('maps layout and default graph/node/edge attributes', () => {
    expect(optionsFor({
      layout: 'neato',
      'graph-attribute-rankdir': 'LR',
      'node-attribute-shape': 'box',
      'edge-attribute-color': 'gray50',
    })).toMatchObject({
      engine: 'neato',
      graphAttributes: { rankdir: 'LR' },
      nodeAttributes: { shape: 'box' },
      edgeAttributes: { color: 'gray50' },
    })
  })

  it('rejects scale and unknown options instead of silently dropping them', () => {
    expect(() => optionsFor({ scale: '72' })).toThrow(/scale is not supported/)
    expect(() => optionsFor({ engine: 'dot' })).toThrow(/Unsupported GraphViz option/)
  })

  it('rejects resource-loading attributes supplied through options', () => {
    for (const option of [
      'graph-attribute-imagepath',
      'graph-attribute-fontpath',
      'graph-attribute-stylesheet',
      'node-attribute-image',
      'node-attribute-shapefile',
    ]) {
      expect(() => optionsFor({ [option]: '/tmp/resource' })).toThrow(/resource attribute/)
    }
  })

  it('rejects DOT and HTML image loading forms', async () => {
    const request = (source: string): RenderRequest => ({
      engine: 'graphviz', source, format: 'svg', options: {},
      metadata: { title: '', description: '' },
      presentation: { background: '', padding: 0, frame: false },
    })
    await expect(graphvizAdapter.render(request('digraph { a [image="/tmp/a.png"] }'), new AbortController().signal)).rejects.toThrow(/not supported/)
    await expect(graphvizAdapter.render(request('digraph { a [label=<<IMG SRC="a.png"/>>] }'), new AbortController().signal)).rejects.toThrow(/not supported/)
    await expect(graphvizAdapter.render(request('digraph { a [label="image=descriptive text"] }'), new AbortController().signal)).resolves.toMatchObject({ runtime: 'edge-wasm' })
  })

  it('renders the HTML labels and ports needed by translated engines', async () => {
    const svg = await renderGraphvizSource('digraph { a [shape=plain label=<<TABLE><TR><TD PORT="p">A</TD></TR></TABLE>>]; b [label="B"]; a:p -> b }')
    expect(svg).toMatch(/<svg[\s>]/i)
    expect(svg).toContain('A')
    expect(svg).toContain('B')
  })

  it('serializes shared-module renders without leaking errors', async () => {
    const results = await Promise.allSettled([
      renderGraphvizSource('digraph { a -> b }'),
      renderGraphvizSource('digraph { broken -> }'),
      renderGraphvizSource('graph { "safe" -- "still safe" }'),
    ])
    expect(results[0]).toMatchObject({ status: 'fulfilled' })
    expect(results[1]).toMatchObject({ status: 'rejected' })
    expect(results[2]).toMatchObject({ status: 'fulfilled' })
    if (results[2]!.status === 'fulfilled') expect(results[2]!.value).toContain('still safe')
  })
})
