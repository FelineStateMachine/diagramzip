import renderBytefield from 'bytefield-svg'
import JSON5 from 'json5'
import { renderSvg as renderNomnoml } from 'nomnoml'
import { s as serializeOnml } from 'onml'
import { parse as parseVega, View as VegaView, type Loader as VegaLoader, type Spec as VegaSpec } from 'vega'
import { expressionInterpreter } from 'vega-interpreter'
import { compile as compileVegaLite, type TopLevelSpec as VegaLiteSpec } from 'vega-lite'
import { renderAny as renderWavedrom } from 'wavedrom'
import darkSkins from 'wavedrom/skins/dark.js'
import defaultSkins from 'wavedrom/skins/default.js'
import lowkeySkins from 'wavedrom/skins/lowkey.js'
import narrowSkins from 'wavedrom/skins/narrow.js'
import narrowerSkins from 'wavedrom/skins/narrower.js'
import narrowererSkins from 'wavedrom/skins/narrowerer.js'
import { RenderError } from '../errors'
import type { EngineId, RendererAdapter, RenderRequest, RenderResult } from '../types'

type EdgeEngineId = 'bytefield' | 'nomnoml' | 'vega' | 'vegalite' | 'wavedrom'

const versions: Record<EdgeEngineId, string> = {
  bytefield: 'bytefield-svg@1.11.0',
  nomnoml: 'nomnoml@1.7.0',
  vega: 'vega@6.3.1',
  vegalite: 'vega-lite@6.4.3',
  wavedrom: 'wavedrom@3.6.2',
}

const waveSkins = {
  dark: darkSkins.dark,
  default: defaultSkins.default,
  lowkey: lowkeySkins.lowkey,
  narrow: narrowSkins.narrow,
  narrower: narrowerSkins.narrower,
  narrowerer: narrowererSkins.narrowerer,
}
function result(id: EdgeEngineId, body: string): RenderResult {
  if (typeof body !== 'string' || body.trim() === '') {
    throw new RenderError(422, 'empty_render', `The ${id} renderer returned no SVG.`)
  }
  return { body, contentType: 'image/svg+xml', engineVersion: versions[id], runtime: 'edge-js' }
}

function parsedSpecification(source: string): unknown {
  const parsed: unknown = JSON.parse(source)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new RenderError(422, 'render_failed', 'Vega source must be a JSON object.')
  }
  return parsed
}

function isVegaSpec(value: unknown): value is VegaSpec {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isVegaLiteSpec(value: unknown): value is VegaLiteSpec {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const specification = value as Record<string, unknown>
  return ['mark', 'layer', 'facet', 'repeat', 'concat', 'hconcat', 'vconcat'].some(name => name in specification)
}

function containsUrl(value: unknown): boolean {
  const pending: unknown[] = [value]
  let visited = 0
  while (pending.length > 0) {
    const current = pending.pop()
    if (++visited > 100_000) throw new RenderError(413, 'render_too_large', 'Vega specification is too complex.')
    if (Array.isArray(current)) {
      pending.push(...current)
      continue
    }
    if (typeof current !== 'object' || current === null) continue
    for (const [name, nested] of Object.entries(current)) {
      if (name.toLowerCase() === 'url' && nested !== undefined && nested !== null && nested !== '') return true
      pending.push(nested)
    }
  }
  return false
}

const disabledVegaLoader: VegaLoader = {
  load: async () => { throw new Error('External Vega data loading is disabled.') },
  http: async () => { throw new Error('External Vega HTTP loading is disabled.') },
  file: async () => { throw new Error('External Vega file loading is disabled.') },
  sanitize: async uri => ({ href: uri }),
}

async function renderVega(id: 'vega' | 'vegalite', source: string): Promise<string> {
  const input = parsedSpecification(source)
  if (containsUrl(input)) {
    throw new RenderError(422, 'unsafe_include', 'URL-backed Vega data and images are disabled; embed data as values.')
  }
  let specification: VegaSpec
  if (id === 'vegalite') {
    if (!isVegaLiteSpec(input)) throw new RenderError(422, 'render_failed', 'Vega-Lite source has no top-level view specification.')
    specification = compileVegaLite(input).spec
  } else {
    if (!isVegaSpec(input)) throw new RenderError(422, 'render_failed', 'Vega source must be a JSON object.')
    specification = input
  }
  const view = new VegaView(parseVega(specification, undefined, { ast: true }), {
    expr: expressionInterpreter,
    loader: disabledVegaLoader,
    renderer: 'none',
  })
  try {
    return await view.toSVG()
  } finally {
    view.finalize()
  }
}

async function renderEdge(id: EdgeEngineId, request: RenderRequest, signal: AbortSignal): Promise<RenderResult> {
  if (signal.aborted) throw signal.reason
  try {
    switch (id) {
      case 'nomnoml':
        return result(id, renderNomnoml(request.source))
      case 'bytefield':
        return result(id, renderBytefield(request.source))
      case 'vega':
      case 'vegalite':
        return result(id, await renderVega(id, request.source))
      case 'wavedrom': {
        const specification: unknown = JSON5.parse(request.source)
        const skin = request.options.skin
        if (skin !== undefined && !(skin in waveSkins)) {
          throw new RenderError(400, 'invalid_options', `Unknown WaveDrom skin: ${skin}.`)
        }
        if (skin !== undefined && typeof specification === 'object' && specification !== null) {
          const currentConfig = 'config' in specification && typeof specification.config === 'object' && specification.config !== null
            ? specification.config
            : {}
          Object.assign(specification, { config: { ...currentConfig, skin } })
        }
        return result(id, serializeOnml(renderWavedrom(0, specification, waveSkins)))
      }
    }
  } catch (error) {
    if (error instanceof RenderError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new RenderError(422, 'render_failed', message.slice(0, 500) || `The ${id} renderer could not render this source.`)
  }
}

export function isEdgeEngine(id: EngineId): id is EdgeEngineId {
  return id in versions
}

export function edgeAdapter(id: EdgeEngineId): RendererAdapter {
  return {
    id,
    runtime: 'edge-js',
    version: versions[id],
    render: (request, signal) => renderEdge(id, request, signal),
  }
}
