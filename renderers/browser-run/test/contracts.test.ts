import { describe, expect, it } from 'vitest'
import { FRAME_URLS, RenderInputError, validateRenderRequest } from '../src/contracts'

describe('browser-run render contract', () => {
  it('accepts only the two pinned engines and validates the source', () => {
    const request = validateRenderRequest({ engine: 'mermaid', requestId: 'r-1', source: 'graph TD' })
    expect(request.engine).toBe('mermaid')
    expect(FRAME_URLS.mermaid).toBe('https://mermaid.render.diagram.zip/index.html?v=1')
  })

  it('rejects unknown engines, malformed ids, and oversized input', () => {
    expect(() => validateRenderRequest({ engine: 'evil', requestId: 'r', source: '' })).toThrow(RenderInputError)
    expect(() => validateRenderRequest({ engine: 'mermaid', requestId: 'r bad', source: '' })).toThrow(RenderInputError)
    expect(() => validateRenderRequest({ engine: 'mermaid', requestId: 'r', source: 'x'.repeat(524_289) })).toThrow(/512 KiB/)
  })
})
