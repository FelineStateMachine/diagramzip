import { describe, expect, it } from 'vitest'
import { FRAME_URLS, RenderInputError, validateRenderRequest } from '../src/contracts'

describe('browser-run render contract', () => {
  it('accepts only the five pinned engines and validates the source', () => {
    const request = validateRenderRequest({ engine: 'bpmn', requestId: 'r-1', source: '<definitions />' })
    expect(request.engine).toBe('bpmn')
    expect(FRAME_URLS.bpmn).toBe('https://bpmn.render.diagram.zip/index.html?v=1')
  })

  it('rejects unknown engines, malformed ids, and oversized input', () => {
    expect(() => validateRenderRequest({ engine: 'evil', requestId: 'r', source: '' })).toThrow(RenderInputError)
    expect(() => validateRenderRequest({ engine: 'tikz', requestId: 'r bad', source: '' })).toThrow(RenderInputError)
    expect(() => validateRenderRequest({ engine: 'tikz', requestId: 'r', source: 'x'.repeat(524_289) })).toThrow(/512 KiB/)
  })
})
