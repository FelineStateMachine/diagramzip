import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { FRAME_URLS, RenderInputError, validateRenderRequest } from '../src/contracts'

describe('browser-run render contract', () => {
  it('accepts only the two pinned engines and validates the source', () => {
    const request = validateRenderRequest({ engine: 'mermaid', requestId: 'r-1', source: 'graph TD' })
    expect(request.engine).toBe('mermaid')
    expect(FRAME_URLS.mermaid).toBe('https://mermaid.render.diagram.zip/index.html?v=2')
  })

  it('rejects unknown engines, malformed ids, and oversized input', () => {
    expect(() => validateRenderRequest({ engine: 'evil', requestId: 'r', source: '' })).toThrow(RenderInputError)
    expect(() => validateRenderRequest({ engine: 'mermaid', requestId: 'r bad', source: '' })).toThrow(RenderInputError)
    expect(() => validateRenderRequest({ engine: 'mermaid', requestId: 'r', source: 'x'.repeat(524_289) })).toThrow(/512 KiB/)
  })

  it('pins Mermaid to SVG labels and protects that setting from directives', () => {
    const frame = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../frames/mermaid/src/frame.js'), 'utf8')
    expect(frame).toMatch(/htmlLabels:\s*false/)
    expect(frame).toMatch(/secure:\s*\[[\s\S]*['"]htmlLabels['"]/) 
  })
})
