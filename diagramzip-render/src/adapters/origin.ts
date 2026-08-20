import { RenderError } from '../errors'
import type { EngineId, RendererAdapter, RenderRequest, RenderResult } from '../types'

const MAX_ORIGIN_RESPONSE_BYTES = 4_194_304

async function boundedText(response: Response): Promise<string> {
  const declaredLength = response.headers.get('Content-Length')
  if (declaredLength !== null && Number(declaredLength) > MAX_ORIGIN_RESPONSE_BYTES) {
    throw new RenderError(413, 'render_too_large', 'Compatibility renderer output is too large.')
  }
  if (response.body === null) throw new RenderError(502, 'empty_render', 'Compatibility renderer returned an empty response.')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > MAX_ORIGIN_RESPONSE_BYTES) {
      await reader.cancel('render too large')
      throw new RenderError(413, 'render_too_large', 'Compatibility renderer output is too large.')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

export function originAdapter(id: EngineId, originUrl: string): RendererAdapter {
  return {
    id,
    runtime: 'origin',
    version: 'compatibility-origin',
    async render(request: RenderRequest, signal: AbortSignal): Promise<RenderResult> {
      const url = new URL(`/${encodeURIComponent(id)}/svg`, originUrl)
      for (const [name, value] of Object.entries(request.options)) url.searchParams.append(name, value)
      let response: Response
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { Accept: 'image/svg+xml', 'Content-Type': 'text/plain; charset=utf-8' },
          body: request.source,
          signal,
        })
      } catch (error) {
        if (signal.aborted) throw error
        throw new RenderError(502, 'origin_unavailable', 'The compatibility renderer is unavailable.')
      }
      if (!response.ok) {
        await response.body?.cancel()
        const status = response.status >= 400 && response.status < 500 ? 422 : 502
        throw new RenderError(status, 'render_failed', `The ${id} renderer could not render this source.`)
      }
      return {
        body: await boundedText(response),
        contentType: 'image/svg+xml',
        engineVersion: response.headers.get('X-Kroki-Version') ?? 'compatibility-origin',
        runtime: 'origin',
      }
    },
  }
}
