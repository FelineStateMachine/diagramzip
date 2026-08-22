import { DurableObject } from 'cloudflare:workers'
import type { BrowserWorker } from '@cloudflare/puppeteer'
import { PuppeteerExecutor, type BrowserExecutor } from './executor'
import { errorResponse, FRAME_URLS, LIMITS, validateRenderRequest, type Engine, type RenderRequest } from './contracts'

export interface Env {
  BROWSER: BrowserWorker
  BROWSER_SESSIONS: DurableObjectNamespace<BrowserSession>
  INTERNAL_TOKEN?: string
}

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  return Response.json(value, { ...init, headers })
}

function sessionName(engine: Engine): string { return `renderer:${engine}` }

export function responseFromRenderResult(result: Awaited<ReturnType<BrowserExecutor['render']>>): Response {
  if (!result.ok) return json({ error: { code: 'frame_failed', message: result.error } }, { status: 422 })
  return json({ svg: result.svg, version: result.version, build: result.build, pipeline: result.pipeline })
}

export class BrowserSession extends DurableObject<Env> {
  private executor?: BrowserExecutor
  private queue: Promise<unknown> = Promise.resolve()

  private getExecutor(): BrowserExecutor {
    return this.executor ??= new PuppeteerExecutor(this.env.BROWSER)
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation, operation)
    this.queue = next.then(() => undefined, () => undefined)
    return next
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'POST required.' } }, { status: 405 })
    let input: RenderRequest
    try { input = validateRenderRequest(await request.json()) } catch (error) { return errorResponse(error) }
    return this.enqueue(async () => {
      try {
        const result = await this.getExecutor().render(input)
        await this.ctx.storage.setAlarm(Date.now() + 60_000)
        return responseFromRenderResult(result)
      } catch (error) {
        await this.close()
        return errorResponse(error)
      }
    })
  }

  async close(): Promise<void> {
    if (this.executor) await this.executor.close()
    this.executor = undefined
  }

  async alarm(): Promise<void> { await this.close() }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/render') return json({ error: { code: 'not_found', message: 'Route not found.' } }, { status: 404 })
    if (request.method !== 'POST') return json({ error: { code: 'method_not_allowed', message: 'POST required.' } }, { status: 405 })
    if (env.INTERNAL_TOKEN && request.headers.get('Authorization') !== `Bearer ${env.INTERNAL_TOKEN}`) return json({ error: { code: 'unauthorized', message: 'Internal authorization required.' } }, { status: 401 })
    const contentLength = Number(request.headers.get('Content-Length') ?? 0)
    if (contentLength > LIMITS.source + 4_096) return json({ error: { code: 'request_too_large', message: 'Request exceeds the source limit.' } }, { status: 413 })
    let input: RenderRequest
    try {
      const body = await request.arrayBuffer()
      if (body.byteLength > LIMITS.source + 16_384) return json({ error: { code: 'request_too_large', message: 'Request exceeds the source limit.' } }, { status: 413 })
      input = validateRenderRequest(JSON.parse(new TextDecoder().decode(body)))
    } catch (error) { return errorResponse(error) }
    const stub = env.BROWSER_SESSIONS.getByName(sessionName(input.engine))
    return stub.fetch(new Request('https://browser-session.internal/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }))
  },
}

export { FRAME_URLS }
