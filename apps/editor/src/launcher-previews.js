import { clientAdapterFor } from './client-renderers.js'
import { canonicalizeSvg, materializeSvg, supportedAppearances } from './client-svg.js'
import { httpRendererUnitFor } from './renderer-units.js'

const MAX_CONCURRENT_RENDERS = 4

export function createLauncherPreviewRenderer({
  fetchImpl = fetch,
  clientAdapterForImpl = clientAdapterFor,
  endpointFor = httpRendererUnitFor,
  createObjectURL = value => URL.createObjectURL(value),
  revokeObjectURL = value => URL.revokeObjectURL(value),
  transformSvg = materializeLauncherPreview,
  maxConcurrent = MAX_CONCURRENT_RENDERS,
} = {}) {
  const cache = new Map()
  const pending = new Map()
  const queued = []
  let active = 0

  function render(state, { priority = false, appearance = 'light-transparent' } = {}) {
    const key = previewKey(state, appearance)
    if (cache.has(key)) return Promise.resolve(cache.get(key))
    if (pending.has(key)) return pending.get(key)

    const promise = schedule(() => renderState(state), priority)
      .then(rendered => {
        const svg = transformSvg(rendered, state, appearance)
        const url = createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
        cache.set(key, url)
        pending.delete(key)
        return url
      })
      .catch(error => {
        pending.delete(key)
        throw error
      })
    pending.set(key, promise)
    return promise
  }

  function schedule(task, priority) {
    return new Promise((resolve, reject) => {
      const item = { task, resolve, reject }
      if (priority) queued.unshift(item)
      else queued.push(item)
      drain()
    })
  }

  function drain() {
    while (active < maxConcurrent && queued.length) {
      const item = queued.shift()
      active++
      Promise.resolve()
        .then(item.task)
        .then(item.resolve, item.reject)
        .finally(() => {
          active--
          drain()
        })
    }
  }

  async function renderState({ type, source, options = {}, meta = {}, presentation = {} }) {
    if (!type || typeof source !== 'string' || !source.trim()) throw new Error('A diagram source is required for its preview.')
    const clientAdapter = clientAdapterForImpl(type)
    if (clientAdapter) {
      const result = await clientAdapter.render({ type, source, options }, new AbortController().signal)
      return { body: validateSvg(result.body), version: result.version ?? result.build ?? '' }
    }

    const endpoint = endpointFor(type)
    if (!endpoint) throw new Error(`No renderer is registered for ${type}.`)
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { Accept: 'image/svg+xml', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        format: 'svg',
        options,
        metadata: meta,
        presentation: {
          background: presentation.background ?? '',
          padding: presentation.padding ?? 0,
          frame: presentation.frame ?? false,
        },
      }),
    })
    if (!response.ok) throw new Error(`Preview render failed with HTTP ${response.status}.`)
    return {
      body: validateSvg(await response.text()),
      version: response.headers?.get?.('X-Diagram-Engine-Version')
        ?? response.headers?.get?.('X-Renderer-Build')
        ?? '',
    }
  }

  function dispose() {
    for (const url of cache.values()) revokeObjectURL(url)
    cache.clear()
  }

  return { render, dispose }
}

export function previewKey({ type, source, options = {} }, appearance = 'light-transparent') {
  return JSON.stringify({ type, source, options, appearance })
}

export function materializeLauncherPreview({ body, version = '' }, { type, meta = {} }, requestedAppearance) {
  const canonical = canonicalizeSvg(body, meta, type, version)
  const appearances = supportedAppearances(canonical)
  const appearance = appearances.includes(requestedAppearance)
    ? requestedAppearance
    : appearances.find(value => value.endsWith('-transparent')) ?? 'raw'
  return appearance === 'raw' ? canonical : materializeSvg(canonical, appearance)
}

function validateSvg(source) {
  if (typeof source !== 'string') throw new Error('The renderer did not return an SVG preview.')
  const documentStart = source
    .replace(/^\uFEFF/, '')
    .trimStart()
    .replace(/^<\?xml[\s\S]*?\?>\s*/i, '')
  if (!/^<svg(?:\s|>)/i.test(documentStart)) throw new Error('The renderer did not return an SVG preview.')
  return source
}
