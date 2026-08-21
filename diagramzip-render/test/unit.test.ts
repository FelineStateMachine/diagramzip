import { describe, expect, it } from 'vitest'
import { createRendererUnit, createRendererUnitGroup } from '../src/unit'
import type { EngineId, RendererAdapter } from '../src/types'

const adapter: RendererAdapter = {
  id: 'vegalite',
  runtime: 'edge-js',
  version: 'test@1',
  async render() {
    return {
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><text x="1" y="8">ok</text></svg>',
      contentType: 'image/svg+xml',
      engineVersion: 'test@1',
      runtime: 'edge-js',
    }
  },
}

const unit = createRendererUnit({ id: 'vegalite', kind: 'translate', adapter, pipeline: ['vega'] })
const fetchUnit = unit.fetch!
const env = { RENDERER_BUILD: 'unit-test' }
const context = {
  waitUntil() {},
  passThroughOnException() {},
  props: {},
} as unknown as ExecutionContext

function request(body: unknown): Parameters<typeof fetchUnit>[0] {
  return new Request('https://vegalite.render.diagram.zip/v1/svg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Parameters<typeof fetchUnit>[0]
}

describe('renderer unit protocol', () => {
  it('assigns its own engine and exposes the explicit translation pipeline', async () => {
    const response = await fetchUnit(request({ source: '{"mark":"point"}' }), env, context)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Diagram-Unit')).toBe('vegalite')
    expect(response.headers.get('X-Diagram-Pipeline')).toBe('vegalite,vega')
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-Diagram-Unit')
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('X-Renderer-Build')
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml')
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'; style-src 'unsafe-inline'; sandbox")
    expect(await response.text()).toContain('<text x="1" y="8">ok</text>')
  })

  it('rejects attempts to select a different engine inside a unit', async () => {
    const response = await fetchUnit(request({ engine: 'mermaid', source: 'flowchart LR' }), env, context)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'invalid_request' } })
  })

  it('describes only itself and its declared downstream unit', async () => {
    const response = await fetchUnit(
      new Request('https://vegalite.render.diagram.zip/v1/capabilities') as Parameters<typeof fetchUnit>[0],
      env,
      context,
    )
    await expect(response.json()).resolves.toMatchObject({
      id: 'vegalite',
      kind: 'translate',
      pipeline: ['vegalite', 'vega'],
    })
  })
})

function testAdapter(id: EngineId): RendererAdapter {
  return {
    id,
    runtime: 'edge-js',
    version: 'test@1',
    async render() {
      return {
        body: `<svg xmlns="http://www.w3.org/2000/svg"><text>${id}</text></svg>`,
        contentType: 'image/svg+xml',
        engineVersion: 'test@1',
        runtime: 'edge-js',
      }
    },
  }
}

describe('renderer dependency groups', () => {
  const group = createRendererUnitGroup('blockdiag-family', [
    { id: 'blockdiag', kind: 'render', adapter: testAdapter('blockdiag') },
    { id: 'seqdiag', kind: 'render', adapter: testAdapter('seqdiag') },
  ])
  const fetchGroup = group.fetch!

  it('selects an engine from its dedicated hostname while reporting the shared unit', async () => {
    const response = await fetchGroup(new Request('https://seqdiag.render.diagram.zip/v1/svg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'A -> B' }),
    }) as Parameters<typeof fetchGroup>[0], env, context)

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Diagram-Engine')).toBe('seqdiag')
    expect(response.headers.get('X-Diagram-Unit')).toBe('blockdiag-family')
    expect(response.headers.get('X-Diagram-Pipeline')).toBe('blockdiag-family')
  })

  it('does not serve an engine outside the dependency group', async () => {
    const response = await fetchGroup(
      new Request('https://graphviz.render.diagram.zip/v1/capabilities') as Parameters<typeof fetchGroup>[0],
      env,
      context,
    )

    expect(response.status).toBe(404)
  })
})
