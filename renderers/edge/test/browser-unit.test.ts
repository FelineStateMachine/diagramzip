import { describe, expect, it } from 'vitest'
import { createBrowserRendererUnit } from '../../shared/browser-unit'

const unit = createBrowserRendererUnit({
  id: 'mermaid',
  kind: 'render',
  version: 'mermaid@11.17.0',
  build: 'mermaid-test-browser-run-1',
  pipeline: ['mermaid'],
  frame: '/index.html?v=1',
  knownLosses: [],
})
const fetchUnit = unit.fetch!
const context = {
  waitUntil() {},
  passThroughOnException() {},
  props: {},
} as unknown as ExecutionContext

function env(serviceFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  return {
    ASSETS: {
      fetch: async () => new Response('<!doctype html><title>renderer frame</title>', { headers: { 'Content-Type': 'text/html' } }),
    },
    BROWSER_RENDERER: {
      fetch: serviceFetch ?? (async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        const body = await request.json() as { engine: string }
        return Response.json({
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10"><text x="1" y="8">ok</text></svg>',
          version: 'mermaid@11.17.0',
          build: 'frame-test-1',
          pipeline: [body.engine],
        })
      }),
    },
  }
}

function renderRequest(source: string): Request {
  return new Request('https://mermaid.render.diagram.zip/v1/svg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  })
}

describe('browser-backed renderer unit', () => {
  it('serves the renderer frame outside the public API namespace', async () => {
    const response = await fetchUnit(
      new Request('https://mermaid.render.diagram.zip/index.html') as Parameters<typeof fetchUnit>[0],
      env() as unknown as Parameters<typeof fetchUnit>[1],
      context,
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('renderer frame')
  })

  it('renders through the private service while owning public identity headers', async () => {
    const response = await fetchUnit(
      renderRequest(`graph TD; A-->B-${crypto.randomUUID()}`) as Parameters<typeof fetchUnit>[0],
      env() as unknown as Parameters<typeof fetchUnit>[1],
      context,
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Diagram-Renderer')).toBe('browser-run')
    expect(response.headers.get('X-Diagram-Engine-Version')).toBe('mermaid@11.17.0')
    expect(response.headers.get('X-Renderer-Build')).toBe('mermaid-test-browser-run-1')
    expect(await response.text()).toContain('>ok</text>')
  })

  it('rejects body-selected engines without calling the private service', async () => {
    let called = false
    const response = await fetchUnit(
      new Request('https://mermaid.render.diagram.zip/v1/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: 'tikz', source: 'graph TD' }),
      }) as Parameters<typeof fetchUnit>[0],
      env(async () => { called = true; return Response.json({}) }) as unknown as Parameters<typeof fetchUnit>[1],
      context,
    )
    expect(response.status).toBe(400)
    expect(called).toBe(false)
  })

  it('normalizes private service failures to a stable gateway error', async () => {
    const response = await fetchUnit(
      renderRequest(`graph TD; failure-${crypto.randomUUID()}`) as Parameters<typeof fetchUnit>[0],
      env(async () => Response.json({ error: { code: 'render_failed', message: 'sensitive detail' } }, { status: 500 })) as unknown as Parameters<typeof fetchUnit>[1],
      context,
    )
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ error: { code: 'render_failed', message: 'The browser renderer could not render the diagram.' } })
  })
})
