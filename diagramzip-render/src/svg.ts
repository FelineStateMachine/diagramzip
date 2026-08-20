import { SaxesParser, type SaxesTagNS } from 'saxes'
import { RenderError } from './errors'
import type { RenderMetadata, RenderPresentation } from './types'

type SvgNode = SvgElement | { type: 'text'; value: string }

interface SvgElement {
  type: 'element'
  name: string
  attributes: Map<string, string>
  children: SvgNode[]
}

const MAX_SVG_LENGTH = 4_194_304
const BLOCKED_ELEMENTS = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video'])
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i
const SAFE_DATA_FONT = /^data:font\/(?:woff2?|opentype|truetype);base64,[a-z0-9+/=\s]+$/i

function safeCssReference(value: string): boolean {
  const normalized = value.trim()
  return normalized.startsWith('#') || SAFE_DATA_IMAGE.test(normalized) || SAFE_DATA_FONT.test(normalized)
}

function unsafeCss(value: string): boolean {
  if (/@import|expression\s*\(|javascript\s*:|data\s*:\s*text\/html|behavior\s*:|-moz-binding/i.test(value)) return true
  const urlPattern = /url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi
  const urls = value.matchAll(urlPattern)
  for (const match of urls) {
    if (!safeCssReference(match[2] ?? '')) return true
  }
  return /url\s*\(/i.test(value.replace(urlPattern, ''))
}

function safeReference(value: string): boolean {
  const normalized = value.trim()
  return normalized.startsWith('#') || SAFE_DATA_IMAGE.test(normalized)
}

function safeAttribute(name: string, value: string): boolean {
  const normalizedName = name.toLowerCase()
  if (normalizedName.startsWith('on')) return false
  if (normalizedName === 'href' || normalizedName === 'xlink:href' || normalizedName === 'src') {
    return safeReference(value)
  }
  if (normalizedName === 'style' || normalizedName === 'filter' || normalizedName === 'fill' || normalizedName === 'stroke' || normalizedName === 'clip-path' || normalizedName === 'mask') {
    return !unsafeCss(value)
  }
  if (normalizedName === 'xml:base') return false
  return !/javascript\s*:/i.test(value)
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;')
}

function serialize(node: SvgNode): string {
  if (node.type === 'text') return escapeText(node.value)
  const attributes = [...node.attributes]
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join('')
  return `<${node.name}${attributes}>${node.children.map(serialize).join('')}</${node.name}>`
}

function numericDimension(value: string | undefined): number | null {
  if (value === undefined || !/^-?\d+(?:\.\d+)?(?:px)?$/.test(value.trim())) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function presentationBounds(root: SvgElement): [number, number, number, number] | null {
  const viewBox = root.attributes.get('viewBox')?.trim().split(/[\s,]+/).map(Number)
  if (viewBox?.length === 4 && viewBox.every(Number.isFinite) && viewBox[2]! > 0 && viewBox[3]! > 0) {
    return [viewBox[0]!, viewBox[1]!, viewBox[2]!, viewBox[3]!]
  }
  const width = numericDimension(root.attributes.get('width'))
  const height = numericDimension(root.attributes.get('height'))
  return width !== null && height !== null ? [0, 0, width, height] : null
}

function decorate(root: SvgElement, metadata: RenderMetadata, presentation: RenderPresentation): void {
  const additions: SvgNode[] = []
  if (metadata.title) additions.push({ type: 'element', name: 'title', attributes: new Map(), children: [{ type: 'text', value: metadata.title }] })
  if (metadata.description) additions.push({ type: 'element', name: 'desc', attributes: new Map(), children: [{ type: 'text', value: metadata.description }] })

  const bounds = presentationBounds(root)
  if ((presentation.padding || presentation.background || presentation.frame) && bounds === null) {
    throw new RenderError(422, 'missing_dimensions', 'Renderer output has no usable SVG dimensions for presentation settings.')
  }
  if (bounds !== null) {
    const [x, y, width, height] = bounds
    const padding = presentation.padding
    const next = [x - padding, y - padding, width + padding * 2, height + padding * 2]
    root.attributes.set('viewBox', next.join(' '))
    if (root.attributes.has('width')) root.attributes.set('width', String(next[2]))
    if (root.attributes.has('height')) root.attributes.set('height', String(next[3]))
    if (presentation.background || presentation.frame) {
      const attributes = new Map([
        ['x', String(next[0])],
        ['y', String(next[1])],
        ['width', String(next[2])],
        ['height', String(next[3])],
        ['fill', presentation.background || 'none'],
      ])
      if (presentation.frame) {
        attributes.set('stroke', '#000000')
        attributes.set('stroke-width', '1')
        attributes.set('vector-effect', 'non-scaling-stroke')
      }
      additions.push({ type: 'element', name: 'rect', attributes, children: [] })
    }
  }
  root.children.unshift(...additions)
}

export function sanitizeAndDecorateSvg(source: string, metadata: RenderMetadata, presentation: RenderPresentation): string {
  if (source.length > MAX_SVG_LENGTH) throw new RenderError(413, 'render_too_large', 'Rendered SVG is too large.')
  let root: SvgElement | null = null
  const stack: SvgElement[] = []
  let skippedDepth = 0
  let parseError: Error | null = null
  const parser = new SaxesParser({ xmlns: true })

  parser.on('doctype', value => {
    // Saxes does not fetch external DTDs. Standard renderer declarations are
    // discarded, while internal subsets are rejected to avoid custom entities.
    if (value.includes('[')) parseError = new Error('Internal DOCTYPE subsets are not allowed')
  })
  parser.on('opentag', (tag: SaxesTagNS) => {
    const localName = tag.local.toLowerCase()
    if (skippedDepth > 0 || BLOCKED_ELEMENTS.has(localName)) {
      skippedDepth++
      return
    }
    const element: SvgElement = { type: 'element', name: tag.name, attributes: new Map(), children: [] }
    for (const attribute of Object.values(tag.attributes)) {
      const name = attribute.name
      if (safeAttribute(name, attribute.value)) element.attributes.set(name, attribute.value)
    }
    const parent = stack.at(-1)
    if (parent) parent.children.push(element)
    else if (root === null) root = element
    else parseError = new Error('Multiple root elements')
    stack.push(element)
  })
  parser.on('text', value => {
    if (skippedDepth > 0 || value === '') return
    const parent = stack.at(-1)
    if (parent) {
      if (parent.name.toLowerCase() === 'style' && unsafeCss(value)) {
        throw new RenderError(422, 'unsafe_svg', 'Renderer output contains unsafe CSS.')
      }
      parent.children.push({ type: 'text', value })
    } else if (value.trim() !== '') {
      parseError = new Error('Text outside root element')
    }
  })
  parser.on('closetag', () => {
    if (skippedDepth > 0) {
      skippedDepth--
      return
    }
    stack.pop()
  })
  parser.on('error', error => {
    parseError = error
  })

  try {
    parser.write(source).close()
  } catch (error) {
    if (error instanceof RenderError) throw error
    parseError = error instanceof Error ? error : new Error(String(error))
  }
  if (parseError !== null || root === null) {
    throw new RenderError(422, 'invalid_svg', 'Renderer returned invalid SVG.')
  }
  const parsedRoot = root as SvgElement
  if (parsedRoot.name.toLowerCase() !== 'svg') throw new RenderError(422, 'invalid_svg', 'Renderer returned invalid SVG.')
  decorate(parsedRoot, metadata, presentation)
  return serialize(parsedRoot)
}
