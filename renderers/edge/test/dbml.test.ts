import { describe, expect, it } from 'vitest'
import { dbmlAdapter } from '../src/adapters/dbml'
import { sanitizeAndDecorateSvg } from '../src/runtime/svg'
import type { RenderRequest } from '../src/runtime/types'
import { dbmlToDot } from '../artifacts/dbml/dbml-backend.js'

function request(source: string, options: Record<string, string> = {}): RenderRequest {
  return {
    engine: 'dbml',
    source,
    format: 'svg',
    options,
    metadata: { title: '', description: '' },
    presentation: { background: '', padding: 0, frame: false },
  }
}

describe('DBML upstream lowering', () => {
  it('retains tables, fields, indexes, and refs in the DOT model', () => {
    const dot = dbmlToDot(`
      Project app { database_type: 'PostgreSQL' }
      Table users {
        id int [pk]
        email varchar [unique, not null]
        indexes { (email) [name: 'users_email'] }
      }
      Table posts {
        id int [pk]
        user_id int
      }
      Ref: posts.user_id > users.id
    `.trim() + '\n')
    expect(dot).toContain('"users"')
    expect(dot).toContain('"posts"')
    expect(dot).toContain('email')
    expect(dot).toContain('( ! )'.replaceAll(' ', ''))
    expect(dot).toMatch(/posts.*users|users.*posts/s)
  })

  it('preserves useful parser locations for malformed input', () => {
    expect(() => dbmlToDot('Table users { id integer')).toThrow(/line 1:25|Expected/)
  })

  it('renders through the shared GraphViz-Wasm backend', async () => {
    const result = await dbmlAdapter.render(request('Table users { id integer [primary key] }'), new AbortController().signal)
    expect(result.runtime).toBe('edge-wasm')
    expect(result.engineVersion).toBe('dbml@1.0.31+graphviz@15.1.1')
    expect(result.body).toMatch(/<svg[\s>]/i)
    expect(result.body).toContain('users')
  })

  it('rejects renderer options and oversized or overly complex source', async () => {
    const signal = new AbortController().signal
    await expect(dbmlAdapter.render(request('Table users { id integer }', { layout: 'neato' }), signal))
      .rejects.toMatchObject({ status: 400, code: 'invalid_options' })
    await expect(dbmlAdapter.render(request('x'.repeat(262_145)), signal))
      .rejects.toMatchObject({ status: 413, code: 'request_too_large' })
    await expect(dbmlAdapter.render(request(Array.from({ length: 2_001 }, (_, index) => `Table t${index} { id int }`).join('\n')), signal))
      .rejects.toMatchObject({ status: 413, code: 'request_too_large' })
  })

  it('removes external DBML table links from the final SVG', async () => {
    const result = await dbmlAdapter.render(request("Table users [url: 'https://example.com/private'] { id integer }"), new AbortController().signal)
    expect(result.body).toContain('https://example.com/private')
    const sanitized = sanitizeAndDecorateSvg(result.body, request('').metadata, request('').presentation, 'dbml')
    expect(sanitized).not.toContain('https://example.com/private')
    expect(sanitized).toContain('users')
  })
})
