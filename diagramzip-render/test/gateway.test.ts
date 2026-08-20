import { describe, expect, it } from 'vitest'
import worker from '../src/index'

const migrated = [
  'mermaid', 'bpmn', 'excalidraw',
  'bytefield', 'nomnoml', 'vega', 'vegalite', 'wavedrom',
  'blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'packetdiag', 'rackdiag',
  'graphviz', 'erd', 'wireviz',
] as const
const env = {
  ORIGIN_URL: 'https://diagram-zip.fly.dev',
  RENDERER_BUILD: 'gateway-test',
} as unknown as Env
const context = {
  waitUntil() {},
  passThroughOnException() {},
  props: {},
} as unknown as ExecutionContext

describe('gateway renderer boundary', () => {
  for (const engine of migrated) {
    it(`does not proxy ${engine} to the compatibility origin`, async () => {
      const response = await worker.fetch(new Request('https://diagram.zip/render/v1/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine, source: 'A -> B', format: 'svg' }),
      }), env, context)

      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toMatchObject({
        error: { code: 'renderer_unit_required' },
      })
    })
  }
})
