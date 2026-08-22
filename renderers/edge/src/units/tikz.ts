import { tikzAdapter, setTikzAssetBase } from '../adapters/tikz'
import { createRendererUnit } from '../runtime/unit'

interface Env {
  RENDERER_BUILD: string
  ASSETS: Fetcher
}

const renderer = createRendererUnit({
  id: 'tikz',
  kind: 'render',
  adapter: tikzAdapter,
  knownLosses: [
    'The edge unit uses the pinned TikZJax TeX/PGF package set, not a full TeX Live installation.',
    'External files, package downloads, shell escape, hyperlinks, and external resources are unavailable.',
    'Typography and SVG details may differ from the browser TikZJax unit.',
  ],
})

export default {
  async fetch(request: Request<unknown, IncomingRequestCfProperties<unknown>>, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'GET' && !url.pathname.startsWith('/v1/')) return env.ASSETS.fetch(request.url)
    setTikzAssetBase(url.origin)
    if (!renderer.fetch) throw new Error('TikZ renderer handler is unavailable.')
    return renderer.fetch(request, env, ctx)
  },
}
