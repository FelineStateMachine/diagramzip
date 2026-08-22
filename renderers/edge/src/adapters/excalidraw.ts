import { parseHTML } from 'linkedom'
import { RenderError } from '../runtime/errors'
import type { RendererAdapter } from '../runtime/types'
import { edgeFailure, edgeResult } from './types'

const VERSION = '@excalidraw/excalidraw@0.18.1'
const MAX_SOURCE_LENGTH = 524_288
const MAX_NODES = 10_000

let libraryPromise: Promise<typeof import('@excalidraw/excalidraw')> | undefined

function installDomShim(): void {
  const root = globalThis as Record<string, any>
  const window = root.window?.document?.createElement
    ? root.window as Record<string, any>
    : (parseHTML('<!doctype html><html><head></head><body></body></html>') as any).window as Record<string, any>
  root.window = window
  root.document = window.document
  root.location = { origin: 'https://excalidraw.render.diagram.zip', href: 'https://excalidraw.render.diagram.zip/' }
  root.window.location = root.location
  root.navigator ??= { userAgent: 'diagramzip-edge' }
  root.devicePixelRatio ??= 1
  for (const name of ['Element', 'Node', 'HTMLElement', 'SVGElement', 'HTMLCanvasElement', 'DOMParser', 'XMLSerializer', 'Event', 'CustomEvent']) {
    if (window[name]) root[name] = window[name]
  }
  const canvasContext = {
    filter: 'none',
    measureText: (text: unknown) => ({ width: String(text).length * 10 }),
    save() {}, restore() {}, scale() {}, translate() {}, rotate() {}, beginPath() {}, closePath() {},
    stroke() {}, fill() {}, clearRect() {}, setTransform() {}, drawImage() {}, fillText() {},
  }
  const originalCreateElement = window.document.createElement.bind(window.document)
  window.document.createElement = (tag: string, options?: unknown) => {
    if (tag.toLowerCase() === 'canvas') {
      return { width: 0, height: 0, style: {}, setAttribute() {}, getAttribute() { return null }, getContext() { return canvasContext }, toDataURL() { return 'data:image/png;base64,' }, addEventListener() {}, removeEventListener() {} }
    }
    return originalCreateElement(tag, options as any)
  }
  if (root.HTMLCanvasElement?.prototype) root.HTMLCanvasElement.prototype.getContext = () => canvasContext
  root.FontFace ??= class { family: string; source: string; unicodeRange = 'U+0-10FFFF'; style = 'normal'; weight = '400'; stretch = 'normal'; display = 'block'; status = 'loaded'; constructor(family: string, source: string, descriptors: Record<string, string> = {}) { this.family = family; this.source = source; Object.assign(this, descriptors) } async load() { return this } }
  root.document.fonts ??= { add() {}, delete() {}, check() { return true }, ready: Promise.resolve() }
  root.EXCALIDRAW_ASSET_PATH ??= 'https://excalidraw.render.diagram.zip/'
}

function parsedScene(source: string): Record<string, unknown> {
  if (typeof source !== 'string' || new TextEncoder().encode(source).byteLength > MAX_SOURCE_LENGTH) throw new RenderError(413, 'source_too_large', 'Excalidraw source must be a JSON object no larger than 512 KiB.')
  let value: unknown
  try { value = JSON.parse(source) } catch { throw new RenderError(422, 'invalid_source', 'Excalidraw source must be valid JSON.') }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new RenderError(422, 'invalid_source', 'Excalidraw source must be a JSON object.')
  const scene = value as Record<string, unknown>
  const elements = scene.elements
  if (!Array.isArray(elements) || elements.length > MAX_NODES) throw new RenderError(422, 'invalid_source', `Excalidraw elements must be an array with no more than ${MAX_NODES} items.`)
  rejectExternalResources(scene)
  return scene
}

function rejectExternalResources(value: unknown): void {
  const pending = [value]
  while (pending.length > 0) {
    const current = pending.pop()
    if (typeof current !== 'object' || current === null) continue
    for (const [key, nested] of Object.entries(current)) {
      if (['url', 'src', 'href', 'link', 'dataURL'].includes(key) && typeof nested === 'string' && /^(?:https?:|blob:|file:|javascript:)/i.test(nested)) {
        throw new RenderError(422, 'unsafe_include', 'External Excalidraw resources and links are disabled; embed image data in the scene.')
      }
      if (typeof nested === 'object' && nested !== null) pending.push(nested)
    }
  }
}

async function exportScene(scene: Record<string, unknown>): Promise<string> {
  installDomShim()
  libraryPromise ??= import('@excalidraw/excalidraw')
  const { exportToSvg } = await libraryPromise
  const svg = await exportToSvg({
    elements: scene.elements as Parameters<typeof exportToSvg>[0]['elements'],
    appState: scene.appState as Parameters<typeof exportToSvg>[0]['appState'],
    files: (scene.files ?? null) as Parameters<typeof exportToSvg>[0]['files'],
    exportPadding: 10,
  })
  return svg.outerHTML.replace(/<style\b[^>]*class="style-fonts"[^>]*>[\s\S]*?<\/style>/gi, '')
}

export const excalidrawAdapter: RendererAdapter = {
  id: 'excalidraw',
  runtime: 'edge-js',
  version: VERSION,
  async render(request, signal) {
    if (signal.aborted) throw signal.reason
    try {
      const body = await exportScene(parsedScene(request.source))
      return edgeResult('excalidraw', VERSION, body)
    } catch (error) {
      return edgeFailure('excalidraw', error)
    }
  },
}
