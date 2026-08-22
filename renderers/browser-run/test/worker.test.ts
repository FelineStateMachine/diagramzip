import { describe, expect, it, vi } from 'vitest'
vi.mock('cloudflare:workers', () => ({ DurableObject: class {} }))
import worker, { responseFromRenderResult } from '../src/index'

function environment(response = { ok: true, svg: '<svg/>', version: 'v', build: 'b', pipeline: ['mermaid'] }) {
  const forwarded: Request[] = []
  const stub = { fetch: vi.fn(async (request: Request) => { forwarded.push(request); return Response.json(response) }) }
  return {
    env: {
      INTERNAL_TOKEN: 'secret',
      BROWSER: {},
      BROWSER_SESSIONS: { getByName: vi.fn(() => stub) },
    } as any,
    stub,
    forwarded,
  }
}

describe('private Worker boundary', () => {
  it('rejects public paths and non-POST methods', async () => {
    const setup = environment()
    expect((await worker.fetch(new Request('https://bridge.example/'), setup.env)).status).toBe(404)
    expect((await worker.fetch(new Request('https://bridge.example/render'), setup.env)).status).toBe(405)
    expect(setup.stub.fetch).not.toHaveBeenCalled()
  })

  it('requires auth, validates JSON, and forwards the exact render contract to the DO', async () => {
    const setup = environment()
    const body = JSON.stringify({ engine: 'mermaid', requestId: 'request-1', source: 'graph TD' })
    expect((await worker.fetch(new Request('https://bridge.example/render', { method: 'POST', body }), setup.env)).status).toBe(401)
    const request = new Request('https://bridge.example/render', { method: 'POST', body, headers: { Authorization: 'Bearer secret' } })
    expect((await worker.fetch(request, setup.env)).status).toBe(200)
    expect(setup.env.BROWSER_SESSIONS.getByName).toHaveBeenCalledWith('renderer:mermaid')
    expect(setup.forwarded).toHaveLength(1)
    expect(await setup.forwarded[0]!.json()).toEqual({ engine: 'mermaid', requestId: 'request-1', source: 'graph TD' })
  })

  it('maps a frame failure to a non-success structured error', async () => {
    const result = responseFromRenderResult({ ok: false, error: 'diagram is invalid' })
    expect(result.status).toBe(422)
    expect(await result.json()).toEqual({ error: { code: 'frame_failed', message: 'diagram is invalid' } })
  })
})
