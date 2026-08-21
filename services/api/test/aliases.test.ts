import { env, exports } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import { canonicalizeSvg } from '../../../shared/svg/index.js'

const capability = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const otherCapability = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBA'
const rendererHeaders = {
  'X-Renderer-Unit': 'd2',
  'X-Renderer-Build': 'd2-compat-unit-1',
  'X-Renderer-Pipeline': 'd2',
}
const worker = (exports as unknown as {
  default: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> }
}).default

function payload(source = 'a -> b') {
  return {
    mode: 'open',
    diagram: {
      type: 'd2',
      source,
      options: {},
      presentation: { background: '', padding: 0, frame: false, appearance: 'raw' },
    },
    metadata: { title: 'A to B', description: 'A small diagram.' },
  }
}

function encryptedBlob(ciphertext = 'AAAAAAAAAAAAAAAAAAAAAA') {
  return {
    v: 1,
    alg: 'A256GCM',
    iv: 'AAAAAAAAAAAAAAAA',
    ciphertext,
  }
}

function lockedPayload() {
  return {
    mode: 'locked',
    encryptedContent: encryptedBlob('BBBBBBBBBBBBBBBBBBBBBB'),
    encryptedMetadata: encryptedBlob('CCCCCCCCCCCCCCCCCCCCCC'),
    keyEnvelope: {
      v: 1,
      kdf: {
        name: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 600_000,
        salt: 'AAAAAAAAAAAAAAAAAAAAAA',
      },
      wrap: encryptedBlob('DDDDDDDDDDDDDDDDDDDDDD'),
    },
  }
}

async function create(body: unknown = payload()): Promise<Response> {
  return worker.fetch('https://diagram.zip/api/v1/aliases', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${capability}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('open aliases', () => {
  beforeAll(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
  })

  it('creates immutable content and a short alias without returning the capability', async () => {
    const response = await create()
    expect(response.status).toBe(201)
    expect(response.headers.get('ETag')).toBe('"1"')
    const result = await response.json<Record<string, unknown>>()
    expect(result.aliasId).toMatch(/^[A-Za-z0-9_-]{16}$/)
    expect(result.contentId).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(JSON.stringify(result)).not.toContain(capability)

    const object = await env.CONTENT.get(`contents/open/${result.contentId as string}.json`)
    expect(object).not.toBeNull()
    expect(await object?.json()).toEqual(payload().diagram)
  })

  it('reads an alias and honors its revision ETag', async () => {
    const created = await create()
    const { aliasId } = await created.json<{ aliasId: string }>()

    const response = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('ETag')).toBe('"1"')
    expect((await response.json<{ diagram: { source: string } }>()).diagram.source).toBe('a -> b')

    const unchanged = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`, {
      headers: { 'If-None-Match': '"1"' },
    })
    expect(unchanged.status).toBe(304)
  })

  it('updates with the capability and current revision', async () => {
    const created = await create()
    const { aliasId, contentId: originalContentId } = await created.json<{ aliasId: string; contentId: string }>()
    const response = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
      },
      body: JSON.stringify(payload('a -> c')),
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('ETag')).toBe('"2"')
    const result = await response.json<{ revision: number; contentId: string; diagram: { source: string } }>()
    expect(result.revision).toBe(2)
    expect(result.contentId).not.toBe(originalContentId)
    expect(result.diagram.source).toBe('a -> c')
  })

  it('rejects an invalid capability without changing the alias', async () => {
    const created = await create()
    const { aliasId } = await created.json<{ aliasId: string }>()
    const response = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${otherCapability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
      },
      body: JSON.stringify(payload('a -> attacker')),
    })
    expect(response.status).toBe(403)
    expect((await env.DB.prepare('SELECT revision FROM aliases WHERE alias_id = ?').bind(aliasId).first<{ revision: number }>())?.revision).toBe(1)
  })

  it('returns a conflict for a stale update', async () => {
    const created = await create()
    const { aliasId } = await created.json<{ aliasId: string }>()
    const request = (source: string) => worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
      },
      body: JSON.stringify(payload(source)),
    })
    expect((await request('a -> c')).status).toBe(200)
    const stale = await request('a -> d')
    expect(stale.status).toBe(412)
    expect((await stale.json<{ error: { code: string } }>()).error.code).toBe('revision_conflict')
  })

  it('requires JSON and a write capability', async () => {
    const noCapability = await worker.fetch('https://diagram.zip/api/v1/aliases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload()),
    })
    expect(noCapability.status).toBe(401)

    const wrongMediaType = await worker.fetch('https://diagram.zip/api/v1/aliases', {
      method: 'POST',
      headers: { Authorization: `Bearer ${capability}`, 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload()),
    })
    expect(wrongMediaType.status).toBe(415)
  })

  it('rejects a declared oversized body before parsing it', async () => {
    const response = await worker.fetch('https://diagram.zip/api/v1/aliases', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Length': String(1024 * 1024 + 1),
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    expect(response.status).toBe(413)
  })

  it('stores and reads locked aliases without plaintext metadata', async () => {
    const created = await create(lockedPayload())
    expect(created.status).toBe(201)
    const result = await created.json<{ aliasId: string; mode: string; contentId: string }>()
    expect(result.mode).toBe('locked')

    const row = await env.DB.prepare(`
      SELECT mode, title, description, encrypted_metadata, key_envelope
      FROM aliases WHERE alias_id = ?
    `).bind(result.aliasId).first<{
      mode: string
      title: string | null
      description: string | null
      encrypted_metadata: string | null
      key_envelope: string | null
    }>()
    expect(row?.mode).toBe('locked')
    expect(row?.title).toBeNull()
    expect(row?.description).toBeNull()
    expect(row?.encrypted_metadata).toContain('ciphertext')
    expect(row?.key_envelope).toContain('PBKDF2')
    expect(await env.CONTENT.get(`contents/locked/${result.contentId}.enc`)).not.toBeNull()

    const read = await worker.fetch(`https://diagram.zip/api/v1/aliases/${result.aliasId}`)
    expect(read.status).toBe(200)
    expect(await read.json()).toMatchObject(lockedPayload())
  })

  it('can lock and unlock an existing alias without changing its short link', async () => {
    const created = await create()
    const { aliasId } = await created.json<{ aliasId: string }>()
    const lock = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
      },
      body: JSON.stringify(lockedPayload()),
    })
    expect(lock.status).toBe(200)
    expect((await lock.json<{ mode: string }>()).mode).toBe('locked')

    const unlock = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"2"',
      },
      body: JSON.stringify(payload()),
    })
    expect(unlock.status).toBe(200)
    const unlocked = await unlock.json<{ aliasId: string; mode: string; revision: number }>()
    expect(unlocked).toMatchObject({ aliasId, mode: 'open', revision: 3 })
  })

  it('keeps the render identity when only the password envelope changes', async () => {
    const firstPayload = lockedPayload()
    const created = await create(firstPayload)
    const original = await created.json<{ aliasId: string; contentId: string; renderId: string }>()
    const changedEnvelope = {
      ...firstPayload,
      keyEnvelope: {
        ...firstPayload.keyEnvelope,
        kdf: { ...firstPayload.keyEnvelope.kdf, salt: 'BBBBBBBBBBBBBBBBBBBBBB' },
        wrap: encryptedBlob('FFFFFFFFFFFFFFFFFFFFFF'),
      },
    }
    const response = await worker.fetch(`https://diagram.zip/api/v1/aliases/${original.aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
      },
      body: JSON.stringify(changedEnvelope),
    })
    expect(response.status).toBe(200)
    const updated = await response.json<{ contentId: string; renderId: string }>()
    expect(updated.contentId).toBe(original.contentId)
    expect(updated.renderId).toBe(original.renderId)
  })

  it('changes the render identity but not content identity for metadata-only changes', async () => {
    const created = await create()
    const original = await created.json<{ aliasId: string; contentId: string; renderId: string }>()
    const changed = payload()
    changed.metadata.title = 'A renamed diagram'
    const response = await worker.fetch(`https://diagram.zip/api/v1/aliases/${original.aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
      },
      body: JSON.stringify(changed),
    })
    expect(response.status).toBe(200)
    const updated = await response.json<{ contentId: string; renderId: string }>()
    expect(updated.contentId).toBe(original.contentId)
    expect(updated.renderId).not.toBe(original.renderId)
  })

  it('stores and serves a content-addressed open SVG render', async () => {
    const created = await create()
    const { aliasId, renderId } = await created.json<{ aliasId: string; renderId: string }>()
    const svg = canonicalizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
      { title: '', description: '' },
      'd2',
      'd2@0.7.1',
    )
    const stored = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'image/svg+xml',
        'If-Match': '"1"',
        'X-Render-Id': renderId,
        ...rendererHeaders,
      },
      body: svg,
    })
    expect(stored.status).toBe(204)

    const render = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg`)
    expect(render.status).toBe(200)
    expect(render.headers.get('Content-Type')).toBe('image/svg+xml')
    expect(render.headers.get('Cache-Control')).toContain('max-age=60')
    expect(render.headers.get('X-Renderer-Unit')).toBe('d2')
    expect(render.headers.get('X-Renderer-Build')).toBe('d2-compat-unit-1')
    expect(render.headers.get('X-Renderer-Pipeline')).toBe('d2')
    expect(render.headers.get('X-Diagram-Appearance')).toBe('raw')
    expect(render.headers.get('X-SVG-Schema')).toBe('1')
    expect(render.headers.get('Content-Security-Policy')).toBe("default-src 'none'; style-src 'unsafe-inline'; sandbox")
    expect(await render.text()).toBe(svg)

    const head = await env.CONTENT.get(`render-heads/open/${renderId}.svg.json`)
    expect(await head?.json()).toEqual({
      unit: 'd2',
      build: 'd2-compat-unit-1',
      pipeline: ['d2'],
      objectKey: `renders/open/d2/d2-compat-unit-1/${renderId}.svg`,
    })
  })

  it('materializes supported appearances from one canonical SVG object', async () => {
    const created = await create()
    const { aliasId, renderId } = await created.json<{ aliasId: string; renderId: string }>()
    const svg = canonicalizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><g class="graph"><polygon fill="white" stroke="none" points="0,0 40,0 40,20 0,20"></polygon><g class="node"><rect x="5" y="5" width="30" height="10" fill="white" stroke="black"></rect><text x="10" y="12" fill="black">Node</text></g></g></svg>',
      { title: '', description: '' },
      'graphviz',
      'graphviz@15.1.1',
    )
    const stored = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'image/svg+xml',
        'If-Match': '"1"',
        'X-Render-Id': renderId,
        'X-Renderer-Unit': 'graphviz',
        'X-Renderer-Build': 'graphviz-wasm-unit-1',
        'X-Renderer-Pipeline': 'graphviz',
      },
      body: svg,
    })
    expect(stored.status).toBe(204)

    const raw = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg`)
    const framed = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg?appearance=dark-framed`)
    expect(raw.status).toBe(200)
    expect(framed.status).toBe(200)
    expect(framed.headers.get('X-Diagram-Appearance')).toBe('dark-framed')
    expect(framed.headers.get('X-SVG-Materializer')).toBe('svg-materializer-1')
    expect(framed.headers.get('X-SVG-Palette')).toBe('diagramzip-palette-1')
    expect(framed.headers.get('ETag')).not.toBe(raw.headers.get('ETag'))
    const framedSvg = await framed.text()
    expect(framedSvg).toContain('data-dz-appearance="dark-framed"')
    expect(framedSvg).toContain('data-dz-owned="materializer"')
    expect(framedSvg).toContain('viewBox="-24 -24 88 68"')

    const unchanged = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg?appearance=dark-framed`, {
      headers: { 'If-None-Match': framed.headers.get('ETag')! },
    })
    expect(unchanged.status).toBe(304)
    const objects = await env.CONTENT.list({ prefix: 'renders/open/graphviz/' })
    expect(objects.objects).toHaveLength(1)
  })

  it('rejects non-canonical SVG uploads and unsupported appearances', async () => {
    const created = await create()
    const { aliasId, renderId } = await created.json<{ aliasId: string; renderId: string }>()
    const stored = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'image/svg+xml',
        'If-Match': '"1"',
        'X-Render-Id': renderId,
        ...rendererHeaders,
      },
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
    })
    expect(stored.status).toBe(422)
    expect((await stored.json<{ error: { code: string } }>()).error.code).toBe('not_canonical')

    const invalid = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg?appearance=sepia`)
    expect(invalid.status).toBe(400)
    expect((await invalid.json<{ error: { code: string } }>()).error.code).toBe('invalid_appearance')
  })

  it('stores locked renders opaquely and refuses an embed response', async () => {
    const created = await create(lockedPayload())
    const { aliasId, renderId } = await created.json<{ aliasId: string; renderId: string }>()
    const encryptedRender = encryptedBlob('EEEEEEEEEEEEEEEEEEEEEE')
    const stored = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/png`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
        'X-Render-Id': renderId,
        ...rendererHeaders,
      },
      body: JSON.stringify(encryptedRender),
    })
    expect(stored.status).toBe(204)

    const embed = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/png`)
    expect(embed.status).toBe(403)
    expect((await embed.json<{ error: { code: string } }>()).error.code).toBe('encrypted_diagram_not_embeddable')

    const encrypted = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/png?encrypted=1`)
    expect(encrypted.status).toBe(200)
    expect(await encrypted.json()).toEqual(encryptedRender)

    const themed = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/png?encrypted=1&appearance=dark-framed`)
    expect(themed.status).toBe(422)
    expect((await themed.json<{ error: { code: string } }>()).error.code).toBe('encrypted_appearance_unavailable')
  })

  it('rejects a stale render upload after an alias update', async () => {
    const created = await create()
    const { aliasId, renderId } = await created.json<{ aliasId: string; renderId: string }>()
    const updated = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'application/json',
        'If-Match': '"1"',
      },
      body: JSON.stringify(payload('a -> updated')),
    })
    expect(updated.status).toBe(200)

    const stale = await worker.fetch(`https://diagram.zip/api/v1/aliases/${aliasId}/renders/svg`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${capability}`,
        'Content-Type': 'image/svg+xml',
        'If-Match': '"1"',
        'X-Render-Id': renderId,
        ...rendererHeaders,
      },
      body: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    })
    expect(stale.status).toBe(412)
  })
})
