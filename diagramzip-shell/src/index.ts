const ALIAS_PATH = /^\/d\/[A-Za-z0-9_-]{16}$/

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
  headers.set('cache-control', 'no-cache')
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
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

    if (url.pathname === '/healthz') {
      return textResponse('ok', 200, request.method)
    }

    return textResponse('Not found', 404, request.method)
  },
} satisfies ExportedHandler<Env>
