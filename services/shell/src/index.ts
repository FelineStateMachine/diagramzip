import { attachEditableDocument, extractEditableDocument } from '../../../shared/svg/index.js'

const ALIAS_PATH = /^\/d\/[A-Za-z0-9_-]{16}$/
const PACKED_SVG_PATH = /^\/svg\/([A-Za-z0-9_-]+)$/
const MAX_PACKED_SVG_LENGTH = 5_242_880

function textResponse(message: string, status: number, method: string): Response {
  return new Response(method === 'HEAD' ? null : message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

async function applicationShell(request: Request, assets: Fetcher): Promise<Response> {
  const assetUrl = new URL('/index.html', request.url)
  const assetRequest = new Request(assetUrl, {
    method: request.method,
    headers: request.headers,
  })
  const response = await assets.fetch(assetRequest)
  const headers = new Headers(response.headers)
  headers.set('cache-control', 'no-cache, no-transform')
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function packedBytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function inflatePackedSvg(value: string): Promise<string> {
  const stream = new Blob([packedBytes(value)]).stream().pipeThrough(new DecompressionStream('deflate'))
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value: chunk } = await reader.read()
    if (done) break
    length += chunk.byteLength
    if (length > MAX_PACKED_SVG_LENGTH) {
      await reader.cancel()
      throw new Error('Packed SVG is too large.')
    }
    chunks.push(chunk)
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)
}

async function packedSvgResponse(request: Request, payload: string): Promise<Response> {
  try {
    const source = await inflatePackedSvg(payload)
    const safeSource = attachEditableDocument(source, extractEditableDocument(source))
    return new Response(request.method === 'HEAD' ? null : safeSource, {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
        'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        'content-type': 'image/svg+xml; charset=utf-8',
        'x-content-type-options': 'nosniff',
        'x-diagram-document': 'editable-svg-1',
      },
    })
  } catch {
    return textResponse('Invalid packed SVG.', 400, request.method)
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return textResponse('Not found', 404, request.method)
    }

    if (url.pathname === '/' || ALIAS_PATH.test(url.pathname)) {
      return applicationShell(request, env.ASSETS)
    }

    const packedSvg = url.pathname.match(PACKED_SVG_PATH)
    if (packedSvg) return packedSvgResponse(request, packedSvg[1])

    if (url.pathname === '/healthz') {
      return textResponse('ok', 200, request.method)
    }

    return textResponse('Not found', 404, request.method)
  },
} satisfies ExportedHandler<Env>
