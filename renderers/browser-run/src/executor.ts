import puppeteer from '@cloudflare/puppeteer'
import type { Browser, Page, BrowserWorker } from '@cloudflare/puppeteer'
import { CHANNEL, FRAME_URLS, LIMITS, type RenderRequest, type RenderResponse } from './contracts'

export interface BrowserExecutor {
  render(request: RenderRequest): Promise<RenderResponse>
  close(): Promise<void>
}

export interface PageLike {
  goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' }): Promise<unknown>
  evaluate<T>(pageFunction: (payload: unknown) => Promise<T>, payload: unknown): Promise<T>
}

export interface BrowserLike {
  newPage(): Promise<PageLike>
  close(): Promise<void>
  isConnected(): boolean
}

/** This function is serialized by Puppeteer and executed in the renderer page. */
export async function browserHarness(payload: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    const pageWindow = globalThis as unknown as {
      addEventListener(type: string, listener: (event: { source: unknown; data: unknown }) => void): void
      removeEventListener(type: string, listener: (event: { source: unknown; data: unknown }) => void): void
      postMessage(message: unknown, targetOrigin: string): void
    }
    const request = payload as { engine: string; requestId: string; source: string }
    const channel = 'diagram.zip:renderer:v1'
    let settled = false
    const finish = (value: unknown) => {
      if (!settled) { settled = true; pageWindow.removeEventListener('message', onMessage); resolve(value) }
    }
    const onMessage = (event: { source: unknown; data: unknown }) => {
      const message = event.data
      if (event.source !== pageWindow || (message as Record<string, unknown>)?.channel !== channel || (message as Record<string, unknown>)?.type !== 'result' || (message as Record<string, unknown>)?.requestId !== request.requestId) return
      finish(message)
    }
    pageWindow.addEventListener('message', onMessage)
    pageWindow.postMessage({ channel, type: 'render', engine: request.engine, requestId: request.requestId, source: request.source }, '*')
  })
}

export function createPageExecutor(page: PageLike, timeoutMs = LIMITS.timeoutMs, initialEngine?: string): BrowserExecutor {
  let loadedEngine: string | undefined = initialEngine
  return {
    async render(request) {
      if (loadedEngine !== request.engine) {
        await page.goto(FRAME_URLS[request.engine], { waitUntil: 'domcontentloaded' })
        loadedEngine = request.engine
      }
      const result = await Promise.race([
        page.evaluate<RenderResponse>(browserHarness as unknown as (payload: unknown) => Promise<RenderResponse>, request),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Renderer timed out.')), timeoutMs)),
      ])
      if (!isFrameResponse(result)) throw new Error('Renderer returned an invalid response.')
      if (result.ok && result.svg.length > LIMITS.output) throw new Error('Renderer SVG output is too large.')
      return result
    },
    async close() { /* Page ownership is managed by the browser session. */ },
  }
}

function isFrameResponse(value: unknown): value is RenderResponse {
  if (typeof value !== 'object' || value === null) return false
  const result = value as Record<string, unknown>
  if (result.ok === false) return typeof result.error === 'string' && result.error.length > 0 && result.error.length <= 500
  return result.ok === true
    && typeof result.svg === 'string'
    && typeof result.version === 'string' && result.version.length > 0
    && typeof result.build === 'string' && result.build.length > 0
    && Array.isArray(result.pipeline)
    && result.pipeline.every(item => typeof item === 'string')
}

export class PuppeteerExecutor implements BrowserExecutor {
  private browser?: Browser
  private page?: Page
  private loadedEngine?: string

  constructor(private readonly endpoint: BrowserWorker) {}

  private async pageFor(engine: RenderRequest['engine']): Promise<Page> {
    if (!this.browser?.isConnected()) {
      this.browser = await puppeteer.launch(this.endpoint, {
        keep_alive: 60_000,
        guardrails: {
          allowedDomains: ['mermaid.render.diagram.zip', 'diagramsnet.render.diagram.zip', 'tikz.render.diagram.zip'],
        },
      })
      this.page = undefined
      this.loadedEngine = undefined
    }
    if (!this.page) this.page = await this.browser!.newPage()
    if (this.loadedEngine !== engine) {
      await this.page.goto(FRAME_URLS[engine], { waitUntil: 'domcontentloaded' })
      this.loadedEngine = engine
    }
    return this.page
  }

  async render(request: RenderRequest): Promise<RenderResponse> {
    const page = await this.pageFor(request.engine)
    return createPageExecutor(page, LIMITS.timeoutMs, this.loadedEngine).render(request)
  }

  async close(): Promise<void> {
    if (this.browser?.isConnected()) await this.browser.close()
    this.browser = undefined
    this.page = undefined
    this.loadedEngine = undefined
  }
}
