import { env, SELF } from 'cloudflare:test'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { canonicalizeSvg } from '../../../shared/svg/index.js'
import { ENGINE_IDS } from '../../../renderers/shared/engines'
import worker from '../src/index'
import { engineForLang, renderUnitUrl, signBody } from '../src/tiny-transform'

const SECRET = 'tiny-test-secret'
const ORIGIN_PATTERN = 'https://{engine}.units.test'
const RAW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><rect x="2" y="2" width="36" height="16" fill="white" stroke="black"></rect><text x="8" y="14" fill="black">a</text></svg>'
const METADATA = { title: '', description: '' }
const MERMAID_CANONICAL = canonicalizeSvg(RAW_SVG, METADATA, 'mermaid', 'mermaid@11.17.0')
const DIAGRAMSNET_CANONICAL = canonicalizeSvg(RAW_SVG, METADATA, 'diagramsnet', 'diagrams.net@29.6.1')

interface UnitCall { url: string; body: Record<string, unknown> }

type UnitHandler = (call: UnitCall) => Response | Promise<Response>

function unitFetch(handler: UnitHandler): { calls: UnitCall[] } {
  const calls: UnitCall[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    const call = { url, body }
    calls.push(call)
    return handler(call)
  }))
  return { calls }
}

function svgResponse(body: string): Response {
  return new Response(body, { headers: { 'content-type': 'image/svg+xml; charset=utf-8' } })
}

function payload(blocks: Array<Record<string, unknown>>, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    relay: 'https://relay.example',
    view: 'diagrams',
    source: { id: 'ab'.repeat(32), kind: 30818 },
    blocks,
    ...extra,
  })
}

async function transform(body: string, options: { secret?: string | null; signature?: string; env?: Record<string, string> } = {}): Promise<Response> {
  const bytes = new TextEncoder().encode(body)
  const signature = options.signature ?? await signBody(SECRET, bytes)
  const request = new Request('https://diagram.zip/transform/tiny', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tiny-view': 'diagrams', 'x-tiny-relay': 'https://relay.example', 'x-tiny-signature': signature },
    body: bytes,
  })
  const secret = options.secret === undefined ? SECRET : options.secret
  const testEnv = { ...env, RENDER_UNIT_ORIGIN_PATTERN: ORIGIN_PATTERN, ...(secret === null ? {} : { TINY_TRANSFORM_SECRET: secret }), ...options.env } as Env
  return worker.fetch(request as Parameters<typeof worker.fetch>[0], testEnv)
}

describe('tiny transform aliases', () => {
  it('maps every engine id to itself', () => {
    for (const engine of ENGINE_IDS) expect(engineForLang(engine)).toBe(engine)
  })

  it('maps fence aliases to engine ids', () => {
    expect(engineForLang('mmd')).toBe('mermaid')
    expect(engineForLang('dot')).toBe('graphviz')
    expect(engineForLang('puml')).toBe('plantuml')
    expect(engineForLang('uml')).toBe('plantuml')
    expect(engineForLang('c4')).toBe('c4plantuml')
    expect(engineForLang('bob')).toBe('svgbob')
    expect(engineForLang('vega-lite')).toBe('vegalite')
    expect(engineForLang('drawio')).toBe('diagramsnet')
    expect(engineForLang(' Mermaid ')).toBe('mermaid')
  })

  it('does not map unknown languages', () => {
    expect(engineForLang('python')).toBeUndefined()
    expect(engineForLang('')).toBeUndefined()
    expect(engineForLang('constructor')).toBeUndefined()
  })

  it('builds render unit URLs from the origin pattern', () => {
    expect(renderUnitUrl('mermaid', undefined)).toBe('https://mermaid.render.diagram.zip/v1/svg')
    expect(renderUnitUrl('graphviz', 'https://{engine}.units.test/')).toBe('https://graphviz.units.test/v1/svg')
  })
})

describe('POST /transform/tiny', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('answers 503 when the transform secret is not configured', async () => {
    const response = await transform(payload([]), { secret: null })

    expect(response.status).toBe(503)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ error: { code: 'transform_unavailable', message: 'TINY_TRANSFORM_SECRET is not configured.' } })
  })

  it('is routed ahead of the GET and HEAD only check', async () => {
    const response = await SELF.fetch('https://diagram.zip/transform/tiny', { method: 'POST', body: payload([]) })
    const get = await SELF.fetch('https://diagram.zip/transform/tiny')

    expect(response.status).toBe(503)
    expect(get.status).toBe(405)
    expect(get.headers.get('allow')).toBe('POST')
  })

  it('rejects a missing or wrong signature', async () => {
    const body = payload([{ index: 0, lang: 'mermaid', source: 'graph TD; a-->b' }])
    const missing = await transform(body, { signature: '' })
    const wrong = await transform(body, { signature: `sha256=${'0'.repeat(64)}` })
    const otherSecret = await transform(body, { signature: await signBody('other', new TextEncoder().encode(body)) })
    const short = await transform(body, { signature: 'sha256=abcd' })

    for (const response of [missing, wrong, otherSecret, short]) {
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: { code: 'invalid_signature', message: 'X-Tiny-Signature does not match the request body.' } })
    }
  })

  it('renders signed blocks into materialized SVG artifacts', async () => {
    const unit = unitFetch(() => svgResponse(MERMAID_CANONICAL))
    const response = await transform(payload([{ index: 0, lang: 'mermaid', source: 'graph TD; a-->b' }]))
    const result = await response.json() as { artifacts: Array<Record<string, unknown>>; errors: unknown[] }

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
    expect(result.errors).toEqual([])
    expect(result.artifacts).toHaveLength(1)
    expect(result.artifacts[0]).toMatchObject({ block: 0, engine: 'mermaid', type: 'image/svg+xml', appearance: 'auto-transparent' })
    expect(result.artifacts[0].body).toContain('data-dz-appearance="auto-transparent"')
    expect(result.artifacts[0].body).toContain('data-dz-materializer=')
    expect(unit.calls).toHaveLength(1)
    expect(unit.calls[0].url).toBe('https://mermaid.units.test/v1/svg')
    expect(unit.calls[0].body).toEqual({
      source: 'graph TD; a-->b',
      format: 'svg',
      options: {},
      metadata: { title: '', description: '' },
      presentation: { background: '', padding: 0, frame: false },
    })
    expect(unit.calls[0].body).not.toHaveProperty('engine')
  })

  it('uses the default render unit origin when no pattern is configured', async () => {
    const unit = unitFetch(() => svgResponse(MERMAID_CANONICAL))
    const response = await transform(payload([{ index: 0, lang: 'mmd', source: 'graph TD; a-->b' }]), { env: { RENDER_UNIT_ORIGIN_PATTERN: '' } })

    expect(response.status).toBe(200)
    expect(unit.calls[0].url).toBe('https://mermaid.render.diagram.zip/v1/svg')
  })

  it('maps aliases per block and skips languages that are not engines', async () => {
    const unit = unitFetch(() => svgResponse(MERMAID_CANONICAL))
    const response = await transform(payload([
      { index: 0, lang: 'dot', source: 'digraph { a -> b }' },
      { index: 1, lang: 'python', source: 'print(1)' },
      { index: 2, lang: 'drawio', source: '<mxfile/>' },
    ]))
    const result = await response.json() as { artifacts: Array<{ block: number; engine: string }>; errors: unknown[] }

    expect(response.status).toBe(200)
    expect(unit.calls.map(call => call.url)).toEqual(['https://graphviz.units.test/v1/svg', 'https://diagramsnet.units.test/v1/svg'])
    expect(result.artifacts.map(({ block, engine }) => ({ block, engine }))).toEqual([{ block: 0, engine: 'graphviz' }, { block: 2, engine: 'diagramsnet' }])
    expect(result.errors).toEqual([])
  })

  it('isolates failures per block', async () => {
    unitFetch(call => {
      if (call.url.startsWith('https://d2.')) return Response.json({ error: { code: 'render_failed', message: 'unexpected token' } }, { status: 422 })
      if (call.url.startsWith('https://pikchr.')) throw new TypeError('connection refused')
      if (call.url.startsWith('https://goat.')) return svgResponse('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')
      if (call.url.startsWith('https://ditaa.')) return new Response('bad gateway', { status: 502 })
      return svgResponse(MERMAID_CANONICAL)
    })
    const response = await transform(payload([
      { index: 0, lang: 'mermaid', source: 'graph TD; a-->b' },
      { index: 1, lang: 'd2', source: 'a -> b' },
      { index: 2, lang: 'pikchr', source: 'box' },
      { index: 3, lang: 'goat', source: '+--+' },
      { index: 4, lang: 'ditaa', source: '+--+' },
      { index: 5, lang: 'graphviz', source: 'digraph {}' },
    ]))
    const result = await response.json() as { artifacts: Array<{ block: number }>; errors: Array<{ block: number; engine: string; error: string }> }

    expect(response.status).toBe(200)
    expect(result.artifacts.map(({ block }) => block)).toEqual([0, 5])
    expect(result.errors).toEqual([
      { block: 1, engine: 'd2', error: 'renderer answered 422: unexpected token' },
      { block: 2, engine: 'pikchr', error: 'renderer unreachable: connection refused' },
      { block: 3, engine: 'goat', error: expect.stringContaining('renderer output rejected:') },
      { block: 4, engine: 'ditaa', error: 'renderer answered 502: bad gateway' },
    ])
  })

  it('honours a requested appearance and falls back to raw when the profile lacks it', async () => {
    unitFetch(call => svgResponse(call.url.startsWith('https://diagramsnet.') ? DIAGRAMSNET_CANONICAL : MERMAID_CANONICAL))
    const response = await transform(payload([
      { index: 0, lang: 'mermaid', source: 'graph TD; a-->b' },
      { index: 1, lang: 'diagramsnet', source: '<mxfile/>' },
    ], { appearance: 'dark-transparent' }))
    const result = await response.json() as { artifacts: Array<{ block: number; appearance: string; body: string }> }

    expect(response.status).toBe(200)
    expect(result.artifacts[0].appearance).toBe('dark-transparent')
    expect(result.artifacts[0].body).toContain('data-dz-appearance="dark-transparent"')
    expect(result.artifacts[1].appearance).toBe('raw')
    expect(result.artifacts[1].body).toContain('data-dz-appearance="raw"')
  })

  it('rejects unknown appearances and malformed requests', async () => {
    const appearance = await transform(payload([], { appearance: 'sepia' }))
    const blocks = await transform(payload([{ index: 0, lang: 'mermaid' }]))
    const source = await transform(payload([], { source: 'not-an-object' }))
    const invalidJson = await transform('{')

    expect(appearance.status).toBe(400)
    expect((await appearance.json() as { error: { code: string } }).error.code).toBe('invalid_appearance')
    expect(blocks.status).toBe(400)
    expect(source.status).toBe(400)
    expect(invalidJson.status).toBe(400)
    expect((await invalidJson.json() as { error: { code: string } }).error.code).toBe('invalid_json')
  })

  it('rejects a body that carries the source event', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const response = await transform(payload([{ index: 0, lang: 'mermaid', source: 'graph TD; a-->b' }], { event: { id: 'ab'.repeat(32), kind: 30818, content: 'secret' } }))

    expect(response.status).toBe(400)
    expect((await response.json() as { error: { code: string } }).error.code).toBe('unexpected_field')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('accepts a body without source metadata', async () => {
    unitFetch(() => svgResponse(MERMAID_CANONICAL))
    const response = await transform(JSON.stringify({ blocks: [{ index: 0, lang: 'mermaid', source: 'graph TD; a-->b' }] }))

    expect(response.status).toBe(200)
    expect((await response.json() as { artifacts: unknown[] }).artifacts).toHaveLength(1)
  })

  it('enforces the body, block count and block source limits', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const oversizedBody = await transform(payload([{ index: 0, lang: 'mermaid', source: 'x'.repeat(1_048_576) }]))
    const tooManyBlocks = await transform(payload(Array.from({ length: 33 }, (_, index) => ({ index, lang: 'mermaid', source: 'graph TD; a-->b' }))))
    const oversizedBlock = await transform(payload([{ index: 0, lang: 'mermaid', source: 'x'.repeat(524_289) }]))

    expect(oversizedBody.status).toBe(413)
    expect((await oversizedBody.json() as { error: { code: string } }).error.code).toBe('request_too_large')
    expect(tooManyBlocks.status).toBe(413)
    expect((await tooManyBlocks.json() as { error: { code: string } }).error.code).toBe('too_many_blocks')
    expect(oversizedBlock.status).toBe(413)
    expect((await oversizedBlock.json() as { error: { code: string } }).error.code).toBe('block_too_large')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('renders at most six blocks at a time', async () => {
    let active = 0
    let peak = 0
    unitFetch(async () => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise(resolve => setTimeout(resolve, 5))
      active -= 1
      return svgResponse(MERMAID_CANONICAL)
    })
    const response = await transform(payload(Array.from({ length: 16 }, (_, index) => ({ index, lang: 'mermaid', source: 'graph TD; a-->b' }))))
    const result = await response.json() as { artifacts: unknown[] }

    expect(result.artifacts).toHaveLength(16)
    expect(peak).toBeLessThanOrEqual(6)
    expect(peak).toBeGreaterThan(1)
  })
})
