import { SaxesParser, type SaxesTagNS } from 'saxes'
import { RenderError } from './errors'
import type { EngineId, RenderMetadata, RenderPresentation } from './types'

type SvgNode = SvgElement | { type: 'text'; value: string }

interface SvgElement {
  type: 'element'
  name: string
  attributes: Map<string, string>
  children: SvgNode[]
}

const MAX_SVG_LENGTH = 4_194_304
const BLOCKED_ELEMENTS = new Set(['script', 'iframe', 'object', 'embed', 'audio', 'video'])
const FOREIGN_OBJECT_ELEMENTS = new Set([
  'foreignobject', 'div', 'span', 'p', 'br', 'b', 'strong', 'i', 'em', 'small', 'sub', 'sup', 'code', 'ul', 'ol', 'li', 'a',
])
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i
const SAFE_DATA_FONT = /^data:(?:font\/(?:woff2?|opentype|truetype)|application\/(?:x-)?font-woff2?);base64,[a-z0-9+/=\s]+$/i

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

function localName(element: SvgElement): string {
  return element.name.toLowerCase().split(':').at(-1) ?? element.name.toLowerCase()
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

function styleValue(element: SvgElement, property: string): string | null {
  const style = element.attributes.get('style')
  if (!style) return null
  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':')
    if (separator < 0) continue
    if (declaration.slice(0, separator).trim().toLowerCase() === property) {
      return declaration.slice(separator + 1).trim()
    }
  }
  return null
}

function whiteFill(element: SvgElement): boolean {
  const fill = (element.attributes.get('fill') ?? styleValue(element, 'fill') ?? '').replaceAll(' ', '').toLowerCase()
  return fill === 'white' || fill === '#fff' || fill === '#ffffff' || fill === 'rgb(255,255,255)'
}

function numericCoordinate(value: string | undefined): number | null {
  if (value === undefined || !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function rectCoversBounds(element: SvgElement, bounds: [number, number, number, number]): boolean {
  const widthValue = element.attributes.get('width')?.trim()
  const heightValue = element.attributes.get('height')?.trim()
  if (widthValue === '100%' && heightValue === '100%') return true
  const x = numericCoordinate(element.attributes.get('x') ?? '0')
  const y = numericCoordinate(element.attributes.get('y') ?? '0')
  const width = numericCoordinate(widthValue)
  const height = numericCoordinate(heightValue)
  if (x === null || y === null || width === null || height === null) return false
  const [boundX, boundY, boundWidth, boundHeight] = bounds
  const tolerance = 0.01
  return x <= boundX + tolerance
    && y <= boundY + tolerance
    && x + width >= boundX + boundWidth - tolerance
    && y + height >= boundY + boundHeight - tolerance
}

function rendererBackdrop(element: SvgElement, bounds: [number, number, number, number] | null, engine: EngineId): boolean {
  const name = localName(element)
  const classes = new Set((element.attributes.get('class') ?? '').toLowerCase().split(/\s+/))
  if (name === 'rect' && classes.has('backdrop')) return true
  if (name === 'rect' && bounds !== null && whiteFill(element) && rectCoversBounds(element, bounds)) return true
  return engine === 'graphviz'
    && name === 'polygon'
    && whiteFill(element)
    && (element.attributes.get('stroke') ?? '').toLowerCase() === 'none'
}

function removeRendererBackdrops(element: SvgElement, inheritedBounds: [number, number, number, number] | null, engine: EngineId): void {
  const bounds = localName(element) === 'svg' ? presentationBounds(element) ?? inheritedBounds : inheritedBounds
  element.children = element.children.filter(child => {
    if (child.type === 'text') return true
    if (rendererBackdrop(child, bounds, engine)) return false
    removeRendererBackdrops(child, bounds, engine)
    return true
  })
}

function applyRootBackgroundStyle(root: SvgElement, background: string): void {
  const declarations = (root.attributes.get('style') ?? '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean)
    .filter(value => !/^background(?:-color)?\s*:/i.test(value))
  declarations.push(`background-color:${background}`)
  root.attributes.set('style', `${declarations.join(';')};`)
}

function decorate(root: SvgElement, metadata: RenderMetadata, presentation: RenderPresentation, engine: EngineId): void {
  const additions: SvgNode[] = []
  let frame: SvgElement | null = null
  if (metadata.title) additions.push({ type: 'element', name: 'title', attributes: new Map(), children: [{ type: 'text', value: metadata.title }] })
  if (metadata.description) additions.push({ type: 'element', name: 'desc', attributes: new Map(), children: [{ type: 'text', value: metadata.description }] })

  const bounds = presentationBounds(root)
  if ((presentation.padding || presentation.background || presentation.frame) && bounds === null) {
    throw new RenderError(422, 'missing_dimensions', 'Renderer output has no usable SVG dimensions for presentation settings.')
  }
  if (bounds !== null) {
    const [x, y, width, height] = bounds
    const padding = presentation.padding
    const next: [number, number, number, number] = [x - padding, y - padding, width + padding * 2, height + padding * 2]
    root.attributes.set('viewBox', next.join(' '))
    if (root.attributes.has('width')) root.attributes.set('width', String(next[2]))
    if (root.attributes.has('height')) root.attributes.set('height', String(next[3]))
    if (presentation.background) {
      const attributes = new Map([
        ['x', String(next[0])],
        ['y', String(next[1])],
        ['width', String(next[2])],
        ['height', String(next[3])],
        ['fill', presentation.background],
      ])
      additions.push({ type: 'element', name: 'rect', attributes, children: [] })
    }
    if (presentation.frame) {
      frame = {
        type: 'element',
        name: 'rect',
        attributes: new Map([
          ['x', String(next[0] + 0.5)],
          ['y', String(next[1] + 0.5)],
          ['width', String(Math.max(0, next[2] - 1))],
          ['height', String(Math.max(0, next[3] - 1))],
          ['fill', 'none'],
          ['stroke', '#000000'],
          ['stroke-width', '1'],
          ['vector-effect', 'non-scaling-stroke'],
        ]),
        children: [],
      }
    }
  }
  if (presentation.background) {
    removeRendererBackdrops(root, bounds, engine)
    applyRootBackgroundStyle(root, presentation.background)
  }
  root.children.unshift(...additions)
  if (frame) root.children.push(frame)
}

export function sanitizeAndDecorateSvg(source: string, metadata: RenderMetadata, presentation: RenderPresentation, engine: EngineId): string {
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
    const tagLocalName = tag.local.toLowerCase()
    const insideForeignObject = tagLocalName === 'foreignobject' || stack.some(element => localName(element) === 'foreignobject')
    if (skippedDepth > 0 || BLOCKED_ELEMENTS.has(tagLocalName) || (insideForeignObject && !FOREIGN_OBJECT_ELEMENTS.has(tagLocalName))) {
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
  const appendText = (value: string) => {
    if (skippedDepth > 0 || value === '') return
    const parent = stack.at(-1)
    if (parent) {
      if (localName(parent) === 'style' && unsafeCss(value)) {
        throw new RenderError(422, 'unsafe_svg', 'Renderer output contains unsafe CSS.')
      }
      parent.children.push({ type: 'text', value })
    } else if (value.trim() !== '') {
      parseError = new Error('Text outside root element')
    }
  }
  parser.on('text', appendText)
  parser.on('cdata', appendText)
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
  decorate(parsedRoot, metadata, presentation, engine)
  return serialize(parsedRoot)
}
