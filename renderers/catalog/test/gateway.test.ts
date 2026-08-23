import { describe, expect, it } from 'vitest'
import worker from '../src/index'

describe('catalog service boundary', () => {
  it('does not expose a rendering proxy', async () => {
    const response = await worker.fetch(new Request('https://diagram.zip/render/v1/svg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine: 'graphviz', source: 'digraph { a -> b }', format: 'svg' }),
    }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'not_found' } })
  })

  it('publishes the complete catalog', async () => {
    const response = await worker.fetch(new Request('https://diagram.zip/render/v1/catalog'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ format: 'svg', engines: { length: 31 } })
  })
})
