import Module from '../../vendor/graphviz-backend'
import { renderInput } from '../../vendor/graphviz-wrapper'
import { RenderError } from '../../errors'
import type { RendererAdapter } from '../../types'
import { edgeResult } from './types'

const VERSION = 'graphviz@15.1.1'
const LAYOUT_ENGINES = new Set(['circo', 'dot', 'fdp', 'neato', 'nop', 'nop1', 'nop2', 'osage', 'patchwork', 'sfdp', 'twopi'])
const RESOURCE_ATTRIBUTES = new Set(['fontpath', 'image', 'imagepath', 'shapefile', 'stylesheet'])

let modulePromise: ReturnType<typeof Module> | undefined
let renderTail: Promise<void> = Promise.resolve()

export function graphvizModule(): ReturnType<typeof Module> {
  modulePromise ??= Module()
  return modulePromise
}

async function withGraphvizLock<T>(operation: () => T): Promise<T> {
  const previous = renderTail
  let release!: () => void
  renderTail = new Promise(resolve => { release = resolve })
  await previous
  try {
    return operation()
  } finally {
    release()
  }
}

function withoutQuotedContent(source: string): string {
  let result = ''
  let quote = ''
  let escaped = false
  for (const char of source) {
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) {
        quote = ''
        result += char
      }
      continue
    }
    if (char === '"' || char === "'") quote = char
    result += char
  }
  return result
}

function hasResourceAttribute(source: string): boolean {
  return /\b(?:fontpath|image|imagepath|shapefile|stylesheet)\s*=|<\s*img\b/i.test(withoutQuotedContent(source))
}

export function optionsFor(options: Record<string, string>): Record<string, unknown> {
  const engine = options.layout ?? 'dot'
  if (!LAYOUT_ENGINES.has(engine)) throw new RenderError(400, 'invalid_options', `Unsupported GraphViz layout engine: ${engine}.`)
  const graphAttributes: Record<string, string> = {}
  const nodeAttributes: Record<string, string> = {}
  const edgeAttributes: Record<string, string> = {}
  for (const [name, value] of Object.entries(options)) {
    if (name === 'layout') continue
    if (name === 'scale') throw new RenderError(400, 'unsupported_options', 'GraphViz scale is not supported by the edge-Wasm adapter.')
    const attributeName = name.replace(/^(?:graph|node|edge)-attribute-/, '')
    if (attributeName !== name && RESOURCE_ATTRIBUTES.has(attributeName.toLowerCase())) {
      throw new RenderError(400, 'unsafe_options', `GraphViz resource attribute '${attributeName}' is not supported by the edge renderer.`)
    }
    if (name.startsWith('graph-attribute-')) graphAttributes[attributeName] = value
    if (name.startsWith('node-attribute-')) nodeAttributes[attributeName] = value
    if (name.startsWith('edge-attribute-')) edgeAttributes[attributeName] = value
    if (!name.startsWith('graph-attribute-') && !name.startsWith('node-attribute-') && !name.startsWith('edge-attribute-')) {
      throw new RenderError(400, 'invalid_options', `Unsupported GraphViz option: ${name}.`)
    }
  }
  return {
    engine,
    format: 'svg',
    yInvert: false,
    reduce: false,
    graphAttributes,
    nodeAttributes,
    edgeAttributes,
  }
}

/** Shared in-process GraphViz runtime for translators such as ERD and WireViz. */
export async function renderGraphvizSource(source: string, options: Record<string, string> = {}): Promise<string> {
  const module = await graphvizModule()
  const result: any = await withGraphvizLock(() => renderInput(module, source, ['svg'], optionsFor(options)))
  if (result.status !== 'success' || typeof result.output?.svg !== 'string') {
    const message = result.errors?.find((entry: { level?: string }) => entry.level === 'error')?.message ?? 'GraphViz could not render this source.'
    throw new RenderError(422, 'render_failed', message)
  }
  return result.output.svg
}

export const graphvizAdapter: RendererAdapter = {
  id: 'graphviz',
  runtime: 'edge-wasm',
  version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    if (hasResourceAttribute(request.source)) {
      throw new RenderError(422, 'unsafe_include', 'GraphViz resource-loading attributes are not supported by the edge renderer.')
    }
    try {
      return edgeResult('graphviz', VERSION, await renderGraphvizSource(request.source, request.options), 'edge-wasm')
    } catch (error) {
      if (error instanceof RenderError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new RenderError(422, 'render_failed', message.slice(0, 500) || 'GraphViz could not render this source.')
    }
  },
}
