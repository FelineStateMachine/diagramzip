import { describe, expect, it } from 'vitest'
import { edgeAdapter } from '../src/adapters/edge'
import type { RenderRequest } from '../src/types'

const fixtures = {
  graphviz: 'digraph { a -> b }',
  dbml: 'Table users { id integer [primary key] }',
  erd: '[Person]\n*name\n\n[Place]\n*id\n\nPerson *--1 Place',
  nomnoml: '[Alice]->[Bob]',
  bytefield: '[{:bits 8 :name "field"}]',
  vega: '{"width":100,"height":50,"marks":[{"type":"rect","encode":{"enter":{"x":{"value":0},"y":{"value":0},"width":{"value":100},"height":{"value":50}}}}]}',
  vegalite: '{"data":{"values":[{"x":"A","y":2}]},"mark":"bar","encoding":{"x":{"field":"x"},"y":{"field":"y","type":"quantitative"}}}',
  wavedrom: '{ signal: [{ name: "clock", wave: "p..." }] }',
} as const

type FixtureEngine = keyof typeof fixtures

function request(engine: FixtureEngine): RenderRequest {
  return {
    engine,
    source: fixtures[engine]!,
    format: 'svg',
    options: {},
    metadata: { title: '', description: '' },
    presentation: { background: '', padding: 0, frame: false },
  }
}

describe('edge renderers', () => {
  for (const engine of Object.keys(fixtures) as FixtureEngine[]) {
    it(`renders ${engine} as SVG`, async () => {
      const result = await edgeAdapter(engine).render(request(engine), new AbortController().signal)
      expect(result.contentType).toBe('image/svg+xml')
      expect(result.body).toMatch(/<svg[\s>]/i)
    })
  }
})
