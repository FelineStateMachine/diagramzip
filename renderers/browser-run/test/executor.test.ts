import { describe, expect, it } from 'vitest'
import { browserHarness, createPageExecutor } from '../src/executor'

describe('browser page executor', () => {
  it('posts the renderer protocol message and accepts the matching result', async () => {
    const listeners = new Set<(event: MessageEvent) => void>()
    const fakeWindow = {
      addEventListener: (_type: string, listener: (event: MessageEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MessageEvent) => void) => listeners.delete(listener),
      postMessage: (data: unknown) => queueMicrotask(() => listeners.forEach(listener => listener({ source: globalThis, data: { channel: 'diagram.zip:renderer:v1', type: 'result', requestId: (data as any).requestId, ok: true, svg: '<svg/>', version: 'v', build: 'b', pipeline: ['bpmn'] } } as unknown as MessageEvent))),
    }
    const oldMethods = { addEventListener: (globalThis as any).addEventListener, removeEventListener: (globalThis as any).removeEventListener, postMessage: (globalThis as any).postMessage }
    Object.assign(globalThis, fakeWindow)
    await expect(browserHarness({ engine: 'bpmn', requestId: 'r', source: '<xml/>' })).resolves.toMatchObject({ ok: true, svg: '<svg/>' })
    Object.assign(globalThis, oldMethods)
  })

  it('navigates only to the pinned frame and returns the protocol result', async () => {
    const navigated: string[] = []
    const page = {
      async goto(url: string) { navigated.push(url) },
      async evaluate<T>(_fn: unknown, payload: any): Promise<T> {
        return { ok: true, svg: '<svg />', version: 'test', build: 'test', pipeline: [payload.engine] } as T
      },
    }
    const result = await createPageExecutor(page).render({ engine: 'mermaid', requestId: 'r', source: 'graph TD' })
    expect(result.ok).toBe(true)
    expect(navigated).toEqual(['https://mermaid.render.diagram.zip/index.html?v=1'])
  })

  it('rejects output above the hard limit', async () => {
    const page = {
      async goto() {},
      async evaluate<T>(): Promise<T> { return { ok: true, svg: 'x'.repeat(4_194_305), version: 'v', build: 'b', pipeline: [] } as T },
    }
    await expect(createPageExecutor(page).render({ engine: 'bpmn', requestId: 'r', source: '' })).rejects.toThrow(/output is too large/)
  })
})
