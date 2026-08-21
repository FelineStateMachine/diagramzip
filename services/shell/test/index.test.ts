import { env, SELF } from 'cloudflare:test'
import { deflate } from 'pako'
import { describe, expect, it } from 'vitest'

function packedSvg(source: string): string {
  const bytes = deflate(new TextEncoder().encode(source), { level: 9 })
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

describe('diagram.zip shell', () => {
  it('serves the application at the root', async () => {
    const response = await SELF.fetch('https://diagram.zip/')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('cache-control')).toBe('no-cache, no-transform')
    expect(await response.text()).toContain('<title>untitled.zip</title>')
  })

  it('serves the application for a valid alias', async () => {
    const response = await SELF.fetch('https://diagram.zip/d/AbCdEfGhIjKlMnOp')

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('<div id="app"></div>')
  })

  it('rejects malformed aliases and legacy Kroki routes', async () => {
    const malformedAlias = await SELF.fetch('https://diagram.zip/d/short')
    const legacyRenderer = await SELF.fetch('https://diagram.zip/plantuml/svg/example')

    expect(malformedAlias.status).toBe(404)
    expect(legacyRenderer.status).toBe(404)
  })

  it('serves a safe immutable editable SVG from a packed anonymous URL', async () => {
    const document = '{"diagram":{"options":{},"presentation":{"appearance":"raw","background":"","frame":false,"padding":0},"source":"graph TD\\n  A --&gt; B","type":"mermaid"},"metadata":{"description":"","title":"Packed draft"},"schema":1}'
    const source = `<svg xmlns="http://www.w3.org/2000/svg" data-dz-schema="1" data-dz-document="1"><metadata data-dz-kind="document" data-dz-schema="1">${document}</metadata><script>alert(1)</script><rect width="10" height="10" onload="alert(1)"/></svg>`
    const response = await SELF.fetch(`https://diagram.zip/svg/${packedSvg(source)}`)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('x-diagram-document')).toBe('editable-svg-1')
    expect(body).toContain('data-dz-document="1"')
    expect(body).toContain('Packed draft')
    expect(body).not.toContain('<script')
    expect(body).not.toContain('onload=')
  })

  it('rejects malformed packed SVG payloads', async () => {
    const response = await SELF.fetch('https://diagram.zip/svg/not-deflate')

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid packed SVG.')
  })

  it('does not restore the legacy root POST endpoint', async () => {
    const response = await SELF.fetch('https://diagram.zip/', {
      method: 'POST',
      body: 'diagram source',
    })

    expect(response.status).toBe(404)
  })

  it('exposes only the shell health check', async () => {
    const health = await SELF.fetch('https://diagram.zip/healthz')
    const legacyHealth = await SELF.fetch('https://diagram.zip/health')
    const metrics = await SELF.fetch('https://diagram.zip/metrics')

    expect(health.status).toBe(200)
    expect(await health.text()).toBe('ok')
    expect(legacyHealth.status).toBe(404)
    expect(metrics.status).toBe(404)
  })

  it('serves static assets through the asset binding', async () => {
    const response = await env.ASSETS.fetch('https://diagram.zip/icon.svg')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
  })
})
