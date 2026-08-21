import { SaxesParser } from 'saxes'

const MAX_SVG_LENGTH = 4_194_304
const BLOCKED_ELEMENTS = new Set(['script', 'iframe', 'object', 'embed', 'audio', 'video'])
const FOREIGN_OBJECT_ELEMENTS = new Set([
  'foreignobject', 'div', 'span', 'p', 'br', 'b', 'strong', 'i', 'em', 'small', 'sub', 'sup', 'code', 'ul', 'ol', 'li', 'a',
])
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i
const SAFE_DATA_FONT = /^data:(?:font\/(?:woff2?|opentype|truetype)|application\/(?:x-)?font-woff2?);base64,[a-z0-9+/=\s]+$/i

export const SVG_SCHEMA = '1'
export const NORMALIZER_BUILD = 'svg-normalizer-1'
export const MATERIALIZER_BUILD = 'svg-materializer-1'
export const PALETTE_BUILD = 'diagramzip-palette-1'
export const RAW_PROFILE = 'safe-raw-1'
export const APPEARANCES = Object.freeze([
  'raw',
  'auto-transparent',
  'light-transparent',
  'dark-transparent',
  'auto-framed',
  'light-framed',
  'dark-framed',
])
export const RAW_NORMALIZATION = Object.freeze({
  schema: SVG_SCHEMA,
  normalizer: NORMALIZER_BUILD,
  profile: RAW_PROFILE,
  palette: 'renderer',
  conformance: 'raw',
  appearances: Object.freeze(['raw']),
})
const THEMED_APPEARANCES = Object.freeze(APPEARANCES.filter(appearance => appearance !== 'raw'))
const GRAPHVIZ_NORMALIZATION = Object.freeze({
  schema: SVG_SCHEMA,
  normalizer: NORMALIZER_BUILD,
  profile: 'graphviz-15-semantic-1',
  palette: PALETTE_BUILD,
  conformance: 'semantic',
  appearances: APPEARANCES,
  limitations: Object.freeze(['Authored non-neutral colors are preserved and may not adapt between palettes.']),
})

export function normalizationFor(engine, rendererVersion = '') {
  if (engine === 'graphviz' && rendererVersion.startsWith('graphviz@15.1.1')) return GRAPHVIZ_NORMALIZATION
  return RAW_NORMALIZATION
}

export class SvgNormalizationError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'SvgNormalizationError'
    this.status = status
    this.code = code
  }
}

function safeCssReference(value) {
  const normalized = value.trim()
  return normalized.startsWith('#') || SAFE_DATA_IMAGE.test(normalized) || SAFE_DATA_FONT.test(normalized)
}

function unsafeCss(value) {
  if (/@import|expression\s*\(|javascript\s*:|data\s*:\s*text\/html|behavior\s*:|-moz-binding/i.test(value)) return true
  const urlPattern = /url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi
  for (const match of value.matchAll(urlPattern)) {
    if (!safeCssReference(match[2] ?? '')) return true
  }
  return /url\s*\(/i.test(value.replace(urlPattern, ''))
}

function safeReference(value) {
  const normalized = value.trim()
  return normalized.startsWith('#') || SAFE_DATA_IMAGE.test(normalized)
}

function safeAttribute(name, value) {
  const normalizedName = name.toLowerCase()
  if (normalizedName.startsWith('on')) return false
  if (normalizedName === 'href' || normalizedName === 'xlink:href' || normalizedName === 'src') return safeReference(value)
  if (['style', 'filter', 'fill', 'stroke', 'clip-path', 'mask'].includes(normalizedName)) return !unsafeCss(value)
  if (normalizedName === 'xml:base') return false
  return !/javascript\s*:/i.test(value)
}

function escapeText(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttribute(value) {
  return escapeText(value).replaceAll('"', '&quot;')
}

function serialize(node) {
  if (node.type === 'text') return escapeText(node.value)
  const attributes = [...node.attributes].map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join('')
  return `<${node.name}${attributes}>${node.children.map(serialize).join('')}</${node.name}>`
}

function localName(element) {
  return element.name.toLowerCase().split(':').at(-1) ?? element.name.toLowerCase()
}

function numericDimension(value) {
  if (value === undefined || !/^-?\d+(?:\.\d+)?(?:px)?$/.test(value.trim())) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function presentationBounds(root) {
  const viewBox = root.attributes.get('viewBox')?.trim().split(/[\s,]+/).map(Number)
  if (viewBox?.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0) return viewBox
  const width = numericDimension(root.attributes.get('width'))
  const height = numericDimension(root.attributes.get('height'))
  return width !== null && height !== null ? [0, 0, width, height] : null
}

function styleValue(element, property) {
  const style = element.attributes.get('style')
  if (!style) return null
  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':')
    if (separator >= 0 && declaration.slice(0, separator).trim().toLowerCase() === property) {
      return declaration.slice(separator + 1).trim()
    }
  }
  return null
}

function whiteFill(element) {
  const fill = (element.attributes.get('fill') ?? styleValue(element, 'fill') ?? '').replaceAll(' ', '').toLowerCase()
  return fill === 'white' || fill === '#fff' || fill === '#ffffff' || fill === 'rgb(255,255,255)'
}

function numericCoordinate(value) {
  if (value === undefined || !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function rectCoversBounds(element, bounds) {
  const widthValue = element.attributes.get('width')?.trim()
  const heightValue = element.attributes.get('height')?.trim()
  if (widthValue === '100%' && heightValue === '100%') return true
  const x = numericCoordinate(element.attributes.get('x') ?? '0')
  const y = numericCoordinate(element.attributes.get('y') ?? '0')
  const width = numericCoordinate(widthValue)
  const height = numericCoordinate(heightValue)
  if ([x, y, width, height].some(value => value === null)) return false
  const [boundX, boundY, boundWidth, boundHeight] = bounds
  const tolerance = 0.01
  return x <= boundX + tolerance
    && y <= boundY + tolerance
    && x + width >= boundX + boundWidth - tolerance
    && y + height >= boundY + boundHeight - tolerance
}

function rendererBackdrop(element, bounds, engine) {
  const name = localName(element)
  const classes = new Set((element.attributes.get('class') ?? '').toLowerCase().split(/\s+/))
  if (name === 'rect' && classes.has('backdrop')) return true
  if (name === 'rect' && bounds !== null && whiteFill(element) && rectCoversBounds(element, bounds)) return true
  return engine === 'graphviz' && name === 'polygon' && whiteFill(element) && (element.attributes.get('stroke') ?? '').toLowerCase() === 'none'
}

function removeRendererBackdrops(element, inheritedBounds, engine) {
  const bounds = localName(element) === 'svg' ? presentationBounds(element) ?? inheritedBounds : inheritedBounds
  element.children = element.children.filter(child => {
    if (child.type === 'text') return true
    if (rendererBackdrop(child, bounds, engine)) return false
    removeRendererBackdrops(child, bounds, engine)
    return true
  })
}

function neutralPaint(element, property, accepted) {
  const value = (element.attributes.get(property) ?? styleValue(element, property) ?? '').replaceAll(' ', '').toLowerCase()
  return accepted.has(value)
}

function applyGraphvizProfile(root) {
  const visit = (node, context = '') => {
    if (node.type === 'text') return
    const classes = new Set((node.attributes.get('class') ?? '').toLowerCase().split(/\s+/).filter(Boolean))
    const nextContext = classes.has('node') ? 'node' : classes.has('edge') ? 'edge' : classes.has('cluster') ? 'cluster' : context
    const name = localName(node)
    if (rendererBackdrop(node, presentationBounds(root), 'graphviz')) node.attributes.set('data-dz-role', 'canvas')
    if (name === 'text' && neutralPaint(node, 'fill', new Set(['', 'black', '#000', '#000000', 'rgb(0,0,0)']))) {
      node.attributes.set('data-dz-fill', nextContext === 'edge' ? 'ink-muted' : 'ink')
    }
    if (nextContext === 'node' && ['ellipse', 'polygon', 'path', 'rect'].includes(name)) {
      if (neutralPaint(node, 'fill', new Set(['', 'none', 'white', '#fff', '#ffffff']))) node.attributes.set('data-dz-fill', 'surface-1')
      if (neutralPaint(node, 'stroke', new Set(['', 'black', '#000', '#000000']))) node.attributes.set('data-dz-stroke', 'line')
    }
    if (nextContext === 'cluster' && ['polygon', 'path', 'rect'].includes(name)) {
      if (neutralPaint(node, 'fill', new Set(['', 'none', 'white', '#fff', '#ffffff']))) node.attributes.set('data-dz-fill', 'surface-2')
      if (neutralPaint(node, 'stroke', new Set(['', 'black', '#000', '#000000']))) node.attributes.set('data-dz-stroke', 'line-muted')
    }
    if (nextContext === 'edge') {
      if (['path', 'polyline', 'line'].includes(name) && neutralPaint(node, 'stroke', new Set(['', 'black', '#000', '#000000']))) node.attributes.set('data-dz-stroke', 'line')
      if (['polygon', 'path'].includes(name) && neutralPaint(node, 'fill', new Set(['black', '#000', '#000000']))) node.attributes.set('data-dz-fill', 'line')
    }
    for (const child of node.children) visit(child, nextContext)
  }
  visit(root)
}

function applyProfile(root, capability) {
  if (capability.profile === 'graphviz-15-semantic-1') applyGraphvizProfile(root)
}

function applyRootBackgroundStyle(root, background) {
  const declarations = (root.attributes.get('style') ?? '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean)
    .filter(value => !/^background(?:-color)?\s*:/i.test(value))
  declarations.push(`background-color:${background}`)
  root.attributes.set('style', `${declarations.join(';')};`)
}

function element(name, attributes = [], children = []) {
  return { type: 'element', name, attributes: new Map(attributes), children }
}

function addMetadata(root, metadata) {
  const additions = []
  if (metadata.title) additions.push(element('title', [], [{ type: 'text', value: metadata.title }]))
  if (metadata.description) additions.push(element('desc', [], [{ type: 'text', value: metadata.description }]))
  root.children.unshift(...additions)
}

function applyLegacyPresentation(root, presentation, engine) {
  const additions = []
  let frame = null
  const bounds = presentationBounds(root)
  if ((presentation.padding || presentation.background || presentation.frame) && bounds === null) {
    throw new SvgNormalizationError(422, 'missing_dimensions', 'Renderer output has no usable SVG dimensions for presentation settings.')
  }
  if (bounds !== null) {
    const [x, y, width, height] = bounds
    const padding = presentation.padding
    const next = [x - padding, y - padding, width + padding * 2, height + padding * 2]
    root.attributes.set('viewBox', next.join(' '))
    if (root.attributes.has('width')) root.attributes.set('width', String(next[2]))
    if (root.attributes.has('height')) root.attributes.set('height', String(next[3]))
    if (presentation.background) {
      additions.push(element('rect', [
        ['x', String(next[0])], ['y', String(next[1])], ['width', String(next[2])], ['height', String(next[3])], ['fill', presentation.background],
      ]))
    }
    if (presentation.frame) {
      frame = element('rect', [
        ['x', String(next[0] + 0.5)], ['y', String(next[1] + 0.5)],
        ['width', String(Math.max(0, next[2] - 1))], ['height', String(Math.max(0, next[3] - 1))],
        ['fill', 'none'], ['stroke', '#000000'], ['stroke-width', '1'], ['vector-effect', 'non-scaling-stroke'],
      ])
    }
  }
  if (presentation.background) {
    removeRendererBackdrops(root, bounds, engine)
    applyRootBackgroundStyle(root, presentation.background)
  }
  root.children.unshift(...additions)
  if (frame) root.children.push(frame)
}

function parseSafeSvg(source) {
  if (source.length > MAX_SVG_LENGTH) throw new SvgNormalizationError(413, 'render_too_large', 'Rendered SVG is too large.')
  let root = null
  const stack = []
  let skippedDepth = 0
  let parseError = null
  const parser = new SaxesParser({ xmlns: true })

  parser.on('doctype', value => {
    if (value.includes('[')) parseError = new Error('Internal DOCTYPE subsets are not allowed')
  })
  parser.on('opentag', tag => {
    const tagLocalName = tag.local.toLowerCase()
    const insideForeignObject = tagLocalName === 'foreignobject' || stack.some(item => localName(item) === 'foreignobject')
    if (skippedDepth > 0 || BLOCKED_ELEMENTS.has(tagLocalName) || (insideForeignObject && !FOREIGN_OBJECT_ELEMENTS.has(tagLocalName))) {
      skippedDepth++
      return
    }
    const next = element(tag.name)
    for (const attribute of Object.values(tag.attributes)) {
      if (safeAttribute(attribute.name, attribute.value)) next.attributes.set(attribute.name, attribute.value)
    }
    const parent = stack.at(-1)
    if (parent) parent.children.push(next)
    else if (root === null) root = next
    else parseError = new Error('Multiple root elements')
    stack.push(next)
  })
  const appendText = value => {
    if (skippedDepth > 0 || value === '') return
    const parent = stack.at(-1)
    if (parent) {
      if (localName(parent) === 'style' && unsafeCss(value)) throw new SvgNormalizationError(422, 'unsafe_svg', 'Renderer output contains unsafe CSS.')
      parent.children.push({ type: 'text', value })
    } else if (value.trim() !== '') {
      parseError = new Error('Text outside root element')
    }
  }
  parser.on('text', appendText)
  parser.on('cdata', appendText)
  parser.on('closetag', () => {
    if (skippedDepth > 0) skippedDepth--
    else stack.pop()
  })
  parser.on('error', error => { parseError = error })

  try {
    parser.write(source).close()
  } catch (error) {
    if (error instanceof SvgNormalizationError) throw error
    parseError = error
  }
  if (parseError !== null || root === null || localName(root) !== 'svg') {
    throw new SvgNormalizationError(422, 'invalid_svg', 'Renderer returned invalid SVG.')
  }
  return root
}

export function sanitizeAndDecorateSvg(source, metadata, presentation, engine, rendererVersion = '') {
  return materializePresentation(canonicalizeSvg(source, metadata, engine, rendererVersion), presentation)
}

export function canonicalizeSvg(source, metadata, engine, rendererVersion = '') {
  const root = parseSafeSvg(source)
  const capability = normalizationFor(engine, rendererVersion)
  applyProfile(root, capability)
  root.attributes.set('data-dz-schema', SVG_SCHEMA)
  root.attributes.set('data-dz-normalizer', NORMALIZER_BUILD)
  root.attributes.set('data-dz-profile', capability.profile)
  root.attributes.set('data-dz-palette', capability.palette)
  root.attributes.set('data-dz-engine', engine)
  root.attributes.set('data-dz-appearance', 'raw')
  root.attributes.set('data-dz-conformance', capability.conformance)
  if (capability !== RAW_NORMALIZATION) root.attributes.set('data-dz-appearances', THEMED_APPEARANCES.join(' '))
  const bounds = presentationBounds(root)
  if (bounds !== null) root.attributes.set('data-dz-bounds', bounds.join(' '))
  addMetadata(root, metadata)
  return serialize(root)
}

export function materializePresentation(canonical, presentation) {
  const root = parseSafeSvg(canonical)
  if (root.attributes.get('data-dz-schema') !== SVG_SCHEMA) {
    throw new SvgNormalizationError(422, 'not_canonical', 'SVG does not use the current Diagram.zip canonical schema.')
  }
  applyLegacyPresentation(root, presentation, root.attributes.get('data-dz-engine') ?? '')
  return serialize(root)
}

const LIGHT_PALETTE = Object.freeze({
  canvas: '#f8fafc', surface1: '#ffffff', surface2: '#f1f5f9', surface3: '#e2e8f0',
  ink: '#0f172a', inkMuted: '#475569', line: '#334155', lineMuted: '#94a3b8',
  accent1: '#2563eb', accent2: '#7c3aed', accent3: '#c2410c', onAccent: '#ffffff', frame: '#cbd5e1',
})
const DARK_PALETTE = Object.freeze({
  canvas: '#0f172a', surface1: '#1e293b', surface2: '#273449', surface3: '#334155',
  ink: '#f8fafc', inkMuted: '#cbd5e1', line: '#e2e8f0', lineMuted: '#94a3b8',
  accent1: '#60a5fa', accent2: '#c4b5fd', accent3: '#fb923c', onAccent: '#0f172a', frame: '#475569',
})

function paletteVariables(palette) {
  return `--dz-canvas:${palette.canvas};--dz-surface-1:${palette.surface1};--dz-surface-2:${palette.surface2};--dz-surface-3:${palette.surface3};--dz-ink:${palette.ink};--dz-ink-muted:${palette.inkMuted};--dz-line:${palette.line};--dz-line-muted:${palette.lineMuted};--dz-accent-1:${palette.accent1};--dz-accent-2:${palette.accent2};--dz-accent-3:${palette.accent3};--dz-on-accent:${palette.onAccent};--dz-frame:${palette.frame};`
}

function materializerCss(appearance) {
  const scheme = appearance.startsWith('dark-') ? DARK_PALETTE : LIGHT_PALETTE
  const automatic = appearance.startsWith('auto-')
  const variables = automatic
    ? `:root{${paletteVariables(LIGHT_PALETTE)}}@media(prefers-color-scheme:dark){:root{${paletteVariables(DARK_PALETTE)}}}`
    : `:root{${paletteVariables(scheme)}}`
  return `${variables}[data-dz-role="canvas"]:not([data-dz-owned="materializer"]){display:none!important}[data-dz-fill="surface-1"]{fill:var(--dz-surface-1)!important}[data-dz-fill="surface-2"]{fill:var(--dz-surface-2)!important}[data-dz-fill="surface-3"]{fill:var(--dz-surface-3)!important}[data-dz-fill="ink"]{fill:var(--dz-ink)!important;color:var(--dz-ink)!important}[data-dz-fill="ink-muted"]{fill:var(--dz-ink-muted)!important;color:var(--dz-ink-muted)!important}[data-dz-fill="line"]{fill:var(--dz-line)!important}[data-dz-fill="accent-1"]{fill:var(--dz-accent-1)!important}[data-dz-fill="accent-2"]{fill:var(--dz-accent-2)!important}[data-dz-fill="accent-3"]{fill:var(--dz-accent-3)!important}[data-dz-fill="on-accent"]{fill:var(--dz-on-accent)!important;color:var(--dz-on-accent)!important}[data-dz-stroke="line"]{stroke:var(--dz-line)!important}[data-dz-stroke="line-muted"]{stroke:var(--dz-line-muted)!important}[data-dz-stroke="accent-1"]{stroke:var(--dz-accent-1)!important}[data-dz-stroke="accent-2"]{stroke:var(--dz-accent-2)!important}[data-dz-stroke="accent-3"]{stroke:var(--dz-accent-3)!important}`
}

function canonicalBounds(root) {
  const value = root.attributes.get('data-dz-bounds')?.trim().split(/\s+/).map(Number)
  if (value?.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0) return value
  return presentationBounds(root)
}

function removeMaterializerOutput(root) {
  root.children = root.children.filter(child => child.type === 'text' || child.attributes.get('data-dz-owned') !== 'materializer')
}

export function materializeSvg(canonical, appearance) {
  if (!APPEARANCES.includes(appearance)) {
    throw new SvgNormalizationError(400, 'invalid_appearance', `Unknown SVG appearance: ${appearance}.`)
  }
  const root = parseSafeSvg(canonical)
  if (root.attributes.get('data-dz-schema') !== SVG_SCHEMA) {
    throw new SvgNormalizationError(422, 'not_canonical', 'SVG does not use the current Diagram.zip canonical schema.')
  }
  removeMaterializerOutput(root)
  if (appearance === 'raw') {
    root.attributes.set('data-dz-appearance', 'raw')
    root.attributes.set('data-dz-palette', 'renderer')
    root.attributes.delete('data-dz-materializer')
    return serialize(root)
  }
  const supported = new Set((root.attributes.get('data-dz-appearances') ?? '').split(/\s+/).filter(Boolean))
  if (!supported.has(appearance)) {
    throw new SvgNormalizationError(422, 'unsupported_appearance', `The active SVG normalization profile does not support ${appearance}.`)
  }
  const bounds = canonicalBounds(root)
  if (bounds === null) throw new SvgNormalizationError(422, 'missing_dimensions', 'Canonical SVG has no usable bounds for appearance materialization.')
  root.attributes.set('data-dz-appearance', appearance)
  root.attributes.set('data-dz-palette', PALETTE_BUILD)
  root.attributes.set('data-dz-materializer', MATERIALIZER_BUILD)
  root.children.unshift(element('style', [['data-dz-owned', 'materializer']], [{ type: 'text', value: materializerCss(appearance) }]))
  if (appearance.endsWith('-framed')) {
    const [x, y, width, height] = bounds
    const padding = 24
    const next = [x - padding, y - padding, width + padding * 2, height + padding * 2]
    root.attributes.set('viewBox', next.join(' '))
    if (root.attributes.has('width')) root.attributes.set('width', String(next[2]))
    if (root.attributes.has('height')) root.attributes.set('height', String(next[3]))
    root.children.splice(1, 0, element('rect', [
      ['data-dz-owned', 'materializer'], ['data-dz-role', 'canvas'], ['x', String(next[0])], ['y', String(next[1])],
      ['width', String(next[2])], ['height', String(next[3])], ['fill', 'var(--dz-canvas)'],
    ]))
    root.children.push(element('rect', [
      ['data-dz-owned', 'materializer'], ['data-dz-role', 'frame'], ['x', String(next[0] + 0.5)], ['y', String(next[1] + 0.5)],
      ['width', String(next[2] - 1)], ['height', String(next[3] - 1)], ['fill', 'none'], ['stroke', 'var(--dz-frame)'],
      ['stroke-width', '1'], ['vector-effect', 'non-scaling-stroke'],
    ]))
  } else {
    root.attributes.set('viewBox', bounds.join(' '))
    if (root.attributes.has('width')) root.attributes.set('width', String(bounds[2]))
    if (root.attributes.has('height')) root.attributes.set('height', String(bounds[3]))
  }
  return serialize(root)
}
