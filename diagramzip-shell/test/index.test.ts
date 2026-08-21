import { env, SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

describe('diagram.zip shell', () => {
  it('serves the application at the root', async () => {
    const response = await SELF.fetch('https://diagram.zip/')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(response.headers.get('cache-control')).toBe('no-cache')
    expect(await response.text()).toContain('<title>diagram.zip</title>')
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
