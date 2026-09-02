import { SaxesParser } from 'saxes'

const MAX_SVG_LENGTH = 4_194_304
const MAX_EDITABLE_SVG_LENGTH = 5_242_880
const BLOCKED_ELEMENTS = new Set(['script', 'iframe', 'object', 'embed', 'audio', 'video'])
const FOREIGN_OBJECT_ELEMENTS = new Set([
  'foreignobject', 'div', 'span', 'p', 'br', 'b', 'strong', 'i', 'em', 'small', 'sub', 'sup', 'code', 'ul', 'ol', 'li', 'a',
])
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i
const SAFE_DATA_FONT = /^data:(?:font\/(?:woff2?|opentype|truetype)|application\/(?:x-)?font-woff2?);base64,[a-z0-9+/=\s]+$/i

export const SVG_SCHEMA = '1'
export const EDITABLE_SVG_SCHEMA = '1'
export const NORMALIZER_BUILD = 'svg-normalizer-2'
export const MATERIALIZER_BUILD = 'svg-materializer-4'
export const PALETTE_BUILD = 'diagramzip-palette-2'
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
const FRAMED_APPEARANCES = Object.freeze(['raw', 'auto-framed', 'light-framed', 'dark-framed'])

function capability(profile, conformance, limitations, appearances = APPEARANCES) {
  return Object.freeze({
    schema: SVG_SCHEMA,
    normalizer: NORMALIZER_BUILD,
    profile,
    palette: PALETTE_BUILD,
    conformance,
    appearances,
    limitations: Object.freeze(limitations),
  })
}

const GRAPHVIZ_NORMALIZATION = capability(
  'graphviz-15-semantic-2',
  'semantic',
  ['Authored non-neutral colors are preserved and may not adapt between palettes.'],
)
const D2_NORMALIZATION = capability(
  'd2-0.7-semantic-2',
  'semantic',
  ['Authored D2 colors are preserved; the pinned neutral and primary theme roles adapt.'],
)
const PLANTUML_NORMALIZATION = capability(
  'plantuml-2026-semantic-2',
  'semantic',
  ['Pinned neutral PlantUML paint adapts; explicit themes and authored colors remain renderer-defined.'],
)
const SVGBOB_NORMALIZATION = capability(
  'svgbob-0.7-semantic-2',
  'semantic',
  ['Line art, labels, and ordinary surfaces adapt; source-specific non-neutral paint is preserved.'],
)
const NEUTRAL_SVG_NORMALIZATION = capability(
  'neutral-svg-semantic-2',
  'adaptive',
  ['Neutral paint adapts; authored non-neutral fills, shadows, and data colors are preserved.'],
)
const DETAILED_SVG_NORMALIZATION = capability(
  'structured-svg-semantic-2',
  'adaptive',
  ['Stable structural roles adapt; authored categorical and semantic colors are preserved.'],
)
const PRESENTATION_NORMALIZATION = capability(
  'authored-svg-presentation-1',
  'presentation-only',
  ['The outer canvas and frame adapt. Paint inside the authored SVG remains unchanged.'],
  FRAMED_APPEARANCES,
)
const AUTHORED_NEUTRAL_NORMALIZATION = capability(
  'authored-neutral-semantic-1',
  'adaptive',
  ['Neutral canvas, ink, and line paint adapts; authored non-neutral paint remains renderer-defined.'],
)
const TRN_NORMALIZATION = capability(
  'trn-semantic-4',
  'semantic',
  ['Four relationship-zone branch colors adapt to the selected appearance and adjacent zones never share a color.'],
)

const SQUARING_NORMALIZATION = capability(
  'squaring-semantic-1',
  'semantic',
  ['Voltage bands for squares and nodes, wires, and block outlines use dedicated light and dark palettes.'],
)

const PROFILE_BY_ENGINE = Object.freeze({
  graphviz: GRAPHVIZ_NORMALIZATION,
  dbml: GRAPHVIZ_NORMALIZATION,
  erd: GRAPHVIZ_NORMALIZATION,
  wireviz: GRAPHVIZ_NORMALIZATION,
  d2: D2_NORMALIZATION,
  plantuml: PLANTUML_NORMALIZATION,
  c4plantuml: PLANTUML_NORMALIZATION,
  structurizr: PLANTUML_NORMALIZATION,
  svgbob: SVGBOB_NORMALIZATION,
  ditaa: SVGBOB_NORMALIZATION,
  blockdiag: NEUTRAL_SVG_NORMALIZATION,
  seqdiag: NEUTRAL_SVG_NORMALIZATION,
  actdiag: NEUTRAL_SVG_NORMALIZATION,
  nwdiag: NEUTRAL_SVG_NORMALIZATION,
  packetdiag: NEUTRAL_SVG_NORMALIZATION,
  rackdiag: NEUTRAL_SVG_NORMALIZATION,
  squaring: SQUARING_NORMALIZATION,
  bytefield: NEUTRAL_SVG_NORMALIZATION,
  mermaid: NEUTRAL_SVG_NORMALIZATION,
  bpmn: NEUTRAL_SVG_NORMALIZATION,
  nomnoml: NEUTRAL_SVG_NORMALIZATION,
  pikchr: NEUTRAL_SVG_NORMALIZATION,
  symbolator: NEUTRAL_SVG_NORMALIZATION,
  umlet: NEUTRAL_SVG_NORMALIZATION,
  goat: DETAILED_SVG_NORMALIZATION,
  vega: DETAILED_SVG_NORMALIZATION,
  vegalite: DETAILED_SVG_NORMALIZATION,
  wavedrom: DETAILED_SVG_NORMALIZATION,
  diagramsnet: PRESENTATION_NORMALIZATION,
  excalidraw: AUTHORED_NEUTRAL_NORMALIZATION,
  tikz: AUTHORED_NEUTRAL_NORMALIZATION,
  trn: TRN_NORMALIZATION,
})

const VERSION_PATTERNS = Object.freeze({
  graphviz: /graphviz@15\.1\.1/,
  dbml: /(?:dbml@1\.0\.31|graphviz@15\.1\.1)/,
  erd: /(?:erd@0\.2\.1\.0|graphviz@15\.1\.1)/,
  wireviz: /(?:wireviz@)?0\.3\.2/,
  d2: /d2@0\.7\.1/,
  plantuml: /plantuml@1\.2026\.6/,
  c4plantuml: /(?:c4plantuml@2\.7\.0|plantuml@1\.2026\.6)/,
  structurizr: /structurizr@6\.2\.2/,
  svgbob: /svgbob@0\.7\.6/,
  ditaa: /(?:ditaa-ascii|svgbob@0\.7\.6)/,
  blockdiag: /(?:blockdiag@)?3\.4\.2/,
  seqdiag: /(?:seqdiag@)?3\.0\.0/,
  actdiag: /(?:actdiag@)?3\.0\.0/,
  nwdiag: /(?:nwdiag@)?3\.0\.0/,
  packetdiag: /(?:packetdiag@)?3\.0\.0/,
  rackdiag: /(?:rackdiag@)?3\.0\.0/,
  squaring: /diagramzip-squaring@2/,
  bytefield: /bytefield-svg@1\.11\.0/,
  mermaid: /mermaid@11\.17\.0/,
  bpmn: /(?:bpmn-js@18\.25\.1|diagramzip-bpmn-svg@1)/,
  nomnoml: /nomnoml@1\.7\.0/,
  pikchr: /pikchr@85e65b9686/,
  symbolator: /(?:symbolator@)?1\.2\.2/,
  umlet: /diagramzip-umlet-svg@1/,
  goat: /goat@0\.5\.1/,
  vega: /vega@6\.3\.1/,
  vegalite: /vega-lite@6\.4\.3/,
  wavedrom: /wavedrom@3\.6\.2/,
  diagramsnet: /diagrams\.net@29\.6\.1/,
  excalidraw: /@excalidraw\/excalidraw@0\.18\.1/,
  tikz: /@planktimerr\/tikzjax@1\.0\.63/,
  trn: /diagramzip-trn@16/,
})

export function normalizationFor(engine, rendererVersion = '') {
  const profile = PROFILE_BY_ENGINE[engine]
  const pattern = VERSION_PATTERNS[engine]
  return profile && pattern?.test(rendererVersion) ? profile : RAW_NORMALIZATION
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
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttribute(value) {
  return escapeText(value).replaceAll('"', '&quot;')
}

function serialize(node) {
  if (node.type === 'text') return escapeText(node.value)
  let attributes = ''
  node.attributes.forEach((value, name) => {
    attributes += ` ${name}="${escapeAttribute(value)}"`
  })
  return `<${node.name}${attributes}>${node.children.map(serialize).join('')}</${node.name}>`
}

function canonicalJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(item => canonicalJson(item)).join(',')}]`
  if (typeof value !== 'object' || value === null) {
    throw new SvgNormalizationError(422, 'invalid_editable_document', 'Editable SVG data must contain only JSON values.')
  }
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
}

function localName(element) {
  return element.name.toLowerCase().split(':').at(-1) ?? element.name.toLowerCase()
}

function qualifiedName(node) {
  if (typeof node.name === 'string' && node.name !== '') return node.name
  if (typeof node.prefix === 'string' && node.prefix !== '') return `${node.prefix}:${node.local}`
  return node.local
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

function polygonCoversBounds(element, bounds) {
  const numbers = (element.attributes.get('points') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  if (numbers.length < 8 || numbers.length % 2 !== 0 || numbers.some(value => !Number.isFinite(value))) return false
  const xs = numbers.filter((_, index) => index % 2 === 0)
  const ys = numbers.filter((_, index) => index % 2 === 1)
  const [boundX, boundY, boundWidth, boundHeight] = bounds
  const tolerance = 0.01
  return Math.min(...xs) <= boundX + tolerance
    && Math.max(...xs) >= boundX + boundWidth - tolerance
    && Math.min(...ys) <= boundY + tolerance
    && Math.max(...ys) >= boundY + boundHeight - tolerance
}

function rendererBackdrop(element, bounds, engine) {
  if (element.attributes.get('data-dz-role') === 'canvas') return true
  const name = localName(element)
  const classes = new Set((element.attributes.get('class') ?? '').toLowerCase().split(/\s+/))
  if (name === 'rect' && classes.has('backdrop')) return true
  if (name === 'rect' && bounds !== null && whiteFill(element) && rectCoversBounds(element, bounds)) return true
  return engine === 'graphviz'
    && name === 'polygon'
    && bounds !== null
    && whiteFill(element)
    && (element.attributes.get('stroke') ?? '').toLowerCase() === 'none'
    && polygonCoversBounds(element, bounds)
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

function applyGraphvizProfile(root, engine) {
  const neutralInk = new Set(['', 'black', '#000', '#000000', 'rgb(0,0,0)'])
  const graphvizLine = new Set([...neutralInk, ...(engine === 'dbml' ? ['#29235c'] : [])])
  const visit = (node, context = '', inheritedBounds = presentationBounds(root)) => {
    if (node.type === 'text') return
    const classes = new Set((node.attributes.get('class') ?? '').toLowerCase().split(/\s+/).filter(Boolean))
    const nextContext = classes.has('node') ? 'node' : classes.has('edge') ? 'edge' : classes.has('cluster') ? 'cluster' : classes.has('graph') ? 'graph' : context
    const name = localName(node)
    const bounds = name === 'svg' ? presentationBounds(node) ?? inheritedBounds : inheritedBounds
    const backdrop = rendererBackdrop(node, bounds, 'graphviz')
      || (nextContext === 'graph' && name === 'polygon' && whiteFill(node) && ownPaint(node, 'stroke') === 'none')
    const fill = ownPaint(node, 'fill')
    const stroke = ownPaint(node, 'stroke')
    if (backdrop) node.attributes.set('data-dz-role', 'canvas')
    if (name === 'text' && (neutralInk.has(fill) || (engine === 'dbml' && fill === '#29235c'))) {
      node.attributes.set('data-dz-fill', nextContext === 'edge' ? 'ink-muted' : 'ink')
    }
    if (name === 'text' && engine === 'dbml' && WHITE_PAINT.has(fill)) node.attributes.set('data-dz-fill', 'on-accent')
    if (nextContext === 'node' && ['ellipse', 'polygon', 'path', 'rect'].includes(name) && !backdrop && !zeroStroke(node)) {
      if ((WHITE_PAINT.has(fill) && !(engine === 'wireviz' && stroke === 'none'))
        || (engine !== 'dbml' && !(engine === 'wireviz' && name === 'path') && transparentPaint(fill))) {
        node.attributes.set('data-dz-fill', 'surface-1')
      }
      if (engine === 'dbml' && fill === '#e7e2dd') node.attributes.set('data-dz-fill', 'surface-1')
      if (engine === 'dbml' && fill === '#1d71b8') node.attributes.set('data-dz-fill', 'accent-1')
      if (graphvizLine.has(stroke)) node.attributes.set('data-dz-stroke', 'line')
    }
    if (nextContext === 'cluster' && ['polygon', 'path', 'rect'].includes(name)) {
      if (neutralPaint(node, 'fill', new Set(['', 'none', 'white', '#fff', '#ffffff']))) node.attributes.set('data-dz-fill', 'surface-2')
      if (graphvizLine.has(stroke)) node.attributes.set('data-dz-stroke', 'line-muted')
    }
    if (nextContext === 'edge') {
      if (['path', 'polyline', 'line', 'polygon'].includes(name) && graphvizLine.has(stroke)) node.attributes.set('data-dz-stroke', 'line')
      if (['polygon', 'path'].includes(name) && graphvizLine.has(fill)) node.attributes.set('data-dz-fill', 'line')
    }
    for (const child of node.children) visit(child, nextContext, bounds)
  }
  visit(root)
}

const BLACK_PAINT = new Set(['black', '#000', '#000000', '#111', '#111111', '#111827', '#181818', '#22242a', '#333', '#333333', '#33322e', 'rgb(0,0,0)', 'rgb(34,36,42)'])
const WHITE_PAINT = new Set(['white', '#fff', '#ffffff', '#e2e2f0', '#e8e8e8', '#eee8d5', '#f1f1f1', '#f7f8fe', 'rgb(255,255,255)'])
const MUTED_PAINT = new Set(['gray', 'grey', '#666', '#666666', '#7f7f7f', '#888', '#888888', '#aaa', '#aaaaaa'])
const SHAPE_ELEMENTS = new Set(['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect'])
const TEXT_ELEMENTS = new Set(['text', 'tspan', 'div', 'span', 'p', 'b', 'strong', 'i', 'em', 'small', 'sub', 'sup', 'code', 'li'])
const NON_PAINT_CONTEXTS = new Set(['clippath', 'filter', 'mask', 'pattern'])

function normalizedPaint(value) {
  return (value ?? '').replaceAll(' ', '').toLowerCase()
}

function ownPaint(element, property) {
  return normalizedPaint(element.attributes.get(property) ?? styleValue(element, property) ?? '')
}

function transparentPaint(value) {
  return value === '' || value === 'none' || value === 'transparent' || value === '#00000000' || value === 'rgba(0,0,0,0)'
}

function zeroStroke(element) {
  const value = element.attributes.get('stroke-width') ?? styleValue(element, 'stroke-width')
  return value !== null && Number.parseFloat(value) === 0
}

function classNames(element) {
  return new Set((element.attributes.get('class') ?? '').split(/\s+/).filter(Boolean))
}

function filteredShadow(element) {
  const style = element.attributes.get('style') ?? ''
  return /(?:^|;)\s*filter\s*:/i.test(style) && /(?:^|;)\s*opacity\s*:/i.test(style)
}

function applyNeutralSvgProfile(root, engine, extraSurfacePaint = []) {
  const surfaces = new Set([...WHITE_PAINT, ...extraSurfacePaint.map(normalizedPaint)])
  const visit = (node, inheritedFill = '', inheritedStroke = '', inheritedBounds = presentationBounds(root), skipPaint = false) => {
    if (node.type === 'text') return
    const name = localName(node)
    const nextSkipPaint = skipPaint || NON_PAINT_CONTEXTS.has(name)
    const bounds = name === 'svg' ? presentationBounds(node) ?? inheritedBounds : inheritedBounds
    const fill = ownPaint(node, 'fill') || inheritedFill
    const stroke = ownPaint(node, 'stroke') || inheritedStroke
    const classes = classNames(node)
    const backdrop = !nextSkipPaint && (rendererBackdrop(node, bounds, engine) || (engine === 'd2' && name === 'rect' && classes.has('fill-N7')))
    if (backdrop) node.attributes.set('data-dz-role', 'canvas')
    if (!nextSkipPaint && TEXT_ELEMENTS.has(name)) {
      if (BLACK_PAINT.has(fill) || transparentPaint(fill)) node.attributes.set('data-dz-fill', 'ink')
      else if (MUTED_PAINT.has(fill)) node.attributes.set('data-dz-fill', 'ink-muted')
    } else if (!nextSkipPaint && SHAPE_ELEMENTS.has(name) && !backdrop) {
      if (surfaces.has(fill)) node.attributes.set('data-dz-fill', 'surface-1')
      else if (BLACK_PAINT.has(fill) && !filteredShadow(node)) node.attributes.set('data-dz-fill', 'line')
      if (BLACK_PAINT.has(stroke)) node.attributes.set('data-dz-stroke', 'line')
      else if (MUTED_PAINT.has(stroke)) node.attributes.set('data-dz-stroke', 'line-muted')
      if (engine === 'pikchr' && name === 'path' && transparentPaint(fill) && /(?:z|Z)\s*$/.test(node.attributes.get('d') ?? '')) {
        node.attributes.set('data-dz-fill', 'surface-1')
      }
    }
    for (const child of node.children) visit(child, fill, stroke, bounds, nextSkipPaint)
  }
  visit(root)
}

function applyD2Profile(root) {
  applyNeutralSvgProfile(root, 'd2', ['#f7f8fe'])
  const visit = node => {
    if (node.type === 'text') return
    const classes = classNames(node)
    const name = localName(node)
    if (classes.has('fill-N1') && TEXT_ELEMENTS.has(name)) node.attributes.set('data-dz-fill', 'ink')
    if (classes.has('fill-N2') && TEXT_ELEMENTS.has(name)) node.attributes.set('data-dz-fill', 'ink-muted')
    if (classes.has('fill-B6') && SHAPE_ELEMENTS.has(name)) node.attributes.set('data-dz-fill', 'surface-1')
    if (classes.has('fill-B1')) node.attributes.set('data-dz-fill', 'accent-1')
    if (classes.has('stroke-B1') || classes.has('connection')) node.attributes.set('data-dz-stroke', 'accent-1')
    for (const child of node.children) visit(child)
  }
  visit(root)
}

function lineEndpoints(node) {
  if (node.type === 'text' || localName(node) !== 'line') return null
  const values = ['x1', 'y1', 'x2', 'y2'].map(name => numericCoordinate(node.attributes.get(name)))
  return values.some(value => value === null) ? null : values
}

function addSvgbobObjectSurfaces(root) {
  const additions = []
  const visit = node => {
    if (node.type === 'text') return
    if (node.children.some(child => child.type !== 'text' && child.attributes.get('data-dz-owned') === 'normalizer')) return
    const lines = node.children.map(lineEndpoints).filter(Boolean)
    const vertical = lines.filter(([x1, y1, x2, y2]) => x1 === x2 && y1 !== y2)
    const horizontal = lines.filter(([x1, y1, x2, y2]) => y1 === y2 && x1 !== x2)
    const key = values => values.join(',')
    const horizontalKeys = new Set(horizontal.map(([x1, y1, x2]) => key([Math.min(x1, x2), y1, Math.max(x1, x2)])))
    const nodeAdditions = []
    for (let first = 0; first < vertical.length; first++) {
      const [leftX, firstY1, , firstY2] = vertical[first]
      const top = Math.min(firstY1, firstY2)
      const bottom = Math.max(firstY1, firstY2)
      for (let second = first + 1; second < vertical.length; second++) {
        const [rightX, secondY1, , secondY2] = vertical[second]
        if (Math.min(secondY1, secondY2) !== top || Math.max(secondY1, secondY2) !== bottom || leftX === rightX) continue
        const minX = Math.min(leftX, rightX)
        const maxX = Math.max(leftX, rightX)
        if (!horizontalKeys.has(key([minX, top, maxX])) || !horizontalKeys.has(key([minX, bottom, maxX]))) continue
        nodeAdditions.push(element('rect', [
          ['x', String(minX)], ['y', String(top)], ['width', String(maxX - minX)], ['height', String(bottom - top)],
          ['fill', 'none'], ['data-dz-owned', 'normalizer'], ['data-dz-role', 'object-surface'], ['data-dz-fill', 'surface-1'],
        ]))
      }
    }
    if (nodeAdditions.length > 0) {
      const transform = node.attributes.get('transform')
      additions.push(...nodeAdditions.map(surface => transform
        ? element('g', [['transform', transform], ['data-dz-owned', 'normalizer']], [surface])
        : surface))
    }
    for (const child of node.children) visit(child)
  }
  visit(root)
  // The renderer may emit labels before the line group that defines their box.
  // Keep inferred surfaces in a root-level underlay so they cannot cover text.
  root.children.unshift(...additions)
}

function applySvgbobProfile(root) {
  applyNeutralSvgProfile(root, 'svgbob')
  addSvgbobObjectSurfaces(root)
  const visit = (node, marker = '') => {
    if (node.type === 'text') return
    const classes = classNames(node)
    const name = localName(node)
    const nextMarker = name === 'marker' ? node.attributes.get('id') ?? '' : marker
    if (classes.has('backdrop')) node.attributes.set('data-dz-role', 'canvas')
    if (TEXT_ELEMENTS.has(name)) node.attributes.set('data-dz-fill', 'ink')
    if (SHAPE_ELEMENTS.has(name)
      && !classes.has('backdrop')
      && node.attributes.get('data-dz-owned') !== 'normalizer') {
      node.attributes.set('data-dz-stroke', 'line')
    }
    const closedPath = name === 'path' && /(?:z|Z)\s*$/.test(node.attributes.get('d') ?? '')
    const objectSurface = classes.has('bg_filled')
      || (classes.has('nofill') && (['circle', 'ellipse', 'polygon', 'rect'].includes(name) || closedPath))
    if (objectSurface) node.attributes.set('data-dz-fill', 'surface-1')
    else if (classes.has('nofill') && node.attributes.get('data-dz-fill') === 'surface-1') {
      node.attributes.delete('data-dz-fill')
    }
    if (classes.has('filled') || ['arrow', 'diamond', 'circle'].includes(nextMarker)) node.attributes.set('data-dz-fill', 'line')
    if (classes.has('filled') || classes.has('bg_filled') || nextMarker !== '') node.attributes.set('data-dz-stroke', 'line')
    for (const child of node.children) visit(child, nextMarker)
  }
  visit(root)
}

function applyPlantumlProfile(root, engine) {
  applyNeutralSvgProfile(root, 'plantuml', ['#e2e2f0', '#f1f1f1'])
  const markActorHeads = node => {
    if (node.type === 'text') return
    const children = node.children.filter(child => child.type !== 'text')
    for (let index = 0; index < children.length - 1; index++) {
      const head = children[index]
      const body = children[index + 1]
      if (localName(head) === 'circle'
        && numericCoordinate(head.attributes.get('r')) === 8
        && localName(body) === 'path'
        && transparentPaint(ownPaint(body, 'fill'))
        && ((body.attributes.get('d') ?? '').match(/\bL\b|L(?=[\d.-])/g) ?? []).length >= 4) {
        head.attributes.set('data-dz-fill', 'none')
      }
    }
    for (const child of node.children) markActorHeads(child)
  }
  markActorHeads(root)
  if (engine !== 'c4plantuml') return
  const c4Accent = new Set(['#08427b', '#1168bd'])
  const visit = node => {
    if (node.type === 'text') return
    const name = localName(node)
    const fill = ownPaint(node, 'fill')
    if (SHAPE_ELEMENTS.has(name) && c4Accent.has(fill)) node.attributes.set('data-dz-fill', 'accent-1')
    for (const child of node.children) visit(child)
    const ownsAccent = node.children.some(child => child.type !== 'text' && child.attributes.get('data-dz-fill') === 'accent-1')
    if (ownsAccent) {
      for (const child of node.children) {
        if (child.type !== 'text' && TEXT_ELEMENTS.has(localName(child))) child.attributes.set('data-dz-fill', 'on-accent')
      }
    }
  }
  visit(root)
}

function applyGoatProfile(root) {
  applyNeutralSvgProfile(root, 'goat')
  const visit = node => {
    if (node.type === 'text') return
    const classes = classNames(node)
    const name = localName(node)
    if (TEXT_ELEMENTS.has(name)) node.attributes.set('data-dz-fill', 'ink')
    if (classes.has('path')) node.attributes.set('data-dz-stroke', 'line')
    if (classes.has('arrowhead') || classes.has('filled')) {
      node.attributes.set('data-dz-fill', 'line')
      node.attributes.set('data-dz-stroke', 'line')
    }
    if (classes.has('hollow')) {
      node.attributes.set('data-dz-fill', 'none')
      node.attributes.set('data-dz-stroke', 'line')
    }
    for (const child of node.children) visit(child)
  }
  visit(root)
}

function applyVegaProfile(root) {
  applyNeutralSvgProfile(root, 'vega')
  const visit = (node, context = '') => {
    if (node.type === 'text') return
    const classes = classNames(node)
    const nextContext = [...classes].find(value => value.startsWith('role-')) ?? context
    const name = localName(node)
    if (classes.has('background') && rendererBackdrop(node, presentationBounds(root), 'vega')) node.attributes.set('data-dz-role', 'canvas')
    if (nextContext === 'role-axis-label' || nextContext === 'role-legend-label' || nextContext === 'role-title') {
      if (TEXT_ELEMENTS.has(name)) node.attributes.set('data-dz-fill', 'ink')
    }
    if (nextContext === 'role-axis-tick' || nextContext === 'role-axis-domain' || nextContext === 'role-grid') {
      if (SHAPE_ELEMENTS.has(name)) node.attributes.set('data-dz-stroke', 'line-muted')
    }
    for (const child of node.children) visit(child, nextContext)
  }
  visit(root)
}

function applyWavedromProfile(root) {
  applyNeutralSvgProfile(root, 'wavedrom')
  const visit = node => {
    if (node.type === 'text') return
    const classes = classNames(node)
    const name = localName(node)
    if (TEXT_ELEMENTS.has(name)) {
      if ([...classes].some(value => ['muted', 'info'].includes(value))) node.attributes.set('data-dz-fill', 'ink-muted')
      else if (![...classes].some(value => ['warning', 'error', 'success'].includes(value))) node.attributes.set('data-dz-fill', 'ink')
    }
    if ([...classes].some(value => ['s1', 's2', 's3', 's4'].includes(value))) node.attributes.set('data-dz-stroke', 'line')
    if (classes.has('s5') || classes.has('s7')) node.attributes.set('data-dz-fill', 'surface-1')
    if (classes.has('s6')) node.attributes.set('data-dz-fill', 'line')
    // s8-s15 are authored categorical values. Preserve their renderer colors
    // instead of collapsing eight distinct values into three shared accents.
    if (classes.has('s16')) node.attributes.set('data-dz-stroke', 'accent-1')
    for (const child of node.children) visit(child)
  }
  visit(root)
}

function applyNeutralRendererDetails(root, engine) {
  const visit = node => {
    if (node.type === 'text') return
    const name = localName(node)
    const classes = classNames(node)
    const fill = ownPaint(node, 'fill')
    if (engine === 'mermaid') {
      if (classes.has('label-container')) {
        node.attributes.set('data-dz-fill', 'surface-1')
        node.attributes.set('data-dz-stroke', 'line')
      }
      if (classes.has('flowchart-link')) node.attributes.set('data-dz-stroke', 'line')
      if (classes.has('arrowMarkerPath')) {
        node.attributes.set('data-dz-fill', 'line')
        node.attributes.set('data-dz-stroke', 'line')
      }
    }
    if (engine === 'blockdiag' && SHAPE_ELEMENTS.has(name) && (fill === '#dbeafe' || fill === 'rgb(219,234,254)')) {
      node.attributes.set('data-dz-fill', 'surface-2')
    }
    if (engine === 'umlet' && classes.has('solid')) {
      node.attributes.set('data-dz-fill', 'line')
      node.attributes.set('data-dz-stroke', 'line')
    }
    for (const child of node.children) visit(child)
  }
  visit(root)
}

function elementPaintBounds(node) {
  if (node.type === 'text') return null
  const name = localName(node)
  if (name === 'rect') {
    const x = numericCoordinate(node.attributes.get('x') ?? '0')
    const y = numericCoordinate(node.attributes.get('y') ?? '0')
    const width = numericCoordinate(node.attributes.get('width'))
    const height = numericCoordinate(node.attributes.get('height'))
    return [x, y, width, height].some(value => value === null) ? null : [x, y, x + width, y + height]
  }
  if (name === 'circle' || name === 'ellipse') {
    const cx = numericCoordinate(node.attributes.get('cx'))
    const cy = numericCoordinate(node.attributes.get('cy'))
    const rx = numericCoordinate(node.attributes.get(name === 'circle' ? 'r' : 'rx'))
    const ry = numericCoordinate(node.attributes.get(name === 'circle' ? 'r' : 'ry'))
    return [cx, cy, rx, ry].some(value => value === null) ? null : [cx - rx, cy - ry, cx + rx, cy + ry]
  }
  if (name === 'polygon') {
    const values = (node.attributes.get('points') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
    if (values.length < 6 || values.length % 2 !== 0) return null
    const xs = values.filter((_, index) => index % 2 === 0)
    const ys = values.filter((_, index) => index % 2 === 1)
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  }
  return null
}

function resolveSiblingTextContrast(root) {
  const visit = node => {
    if (node.type === 'text') return
    const surfaces = []
    for (const child of node.children) {
      if (child.type === 'text') continue
      const bounds = elementPaintBounds(child)
      const role = child.attributes.get('data-dz-fill') ?? ''
      const structuralRole = child.attributes.get('data-dz-role') ?? ''
      const fill = ownPaint(child, 'fill')
      if (bounds !== null && structuralRole !== 'canvas' && !filteredShadow(child)
        && (role.startsWith('surface-') || role.startsWith('accent-') || (!transparentPaint(fill) && !BLACK_PAINT.has(fill)))) {
        surfaces.push({ bounds, role, fill })
      }
      if (TEXT_ELEMENTS.has(localName(child))) {
        const x = numericCoordinate(child.attributes.get('x'))
        const y = numericCoordinate(child.attributes.get('y'))
        const owner = x === null || y === null ? null : surfaces.findLast(surface => {
          const [left, top, right, bottom] = surface.bounds
          return x >= left && x <= right && y >= top && y <= bottom
        })
        if (owner?.role.startsWith('accent-')) child.attributes.set('data-dz-fill', 'on-accent')
        else if (owner?.role.startsWith('surface-')) child.attributes.set('data-dz-fill', 'ink')
        else if (owner !== null && owner !== undefined && !(child.attributes.get('data-dz-fill') ?? '').startsWith('squaring-')) child.attributes.delete('data-dz-fill')
      }
    }
    for (const child of node.children) visit(child)
  }
  visit(root)
}

function applySquaringProfile(root) {
  applyNeutralSvgProfile(root, 'squaring')
  const visit = node => {
    if (node.type === 'text') return
    const classes = classNames(node)
    const band = node.attributes.get('data-band') ?? '0'
    if (classes.has('squaring-square-fill')) {
      node.attributes.set('data-dz-fill', `squaring-square-${band}`)
      node.attributes.set('data-dz-stroke', 'squaring-edge')
    }
    if (classes.has('squaring-node-dot')) node.attributes.set('data-dz-fill', `squaring-node-${band}`)
    if (classes.has('squaring-node-rung')) node.attributes.set('data-dz-stroke', `squaring-node-${band}`)
    if (classes.has('squaring-square-label')) node.attributes.set('data-dz-fill', 'squaring-label')
    if (classes.has('squaring-wire-path')) node.attributes.set('data-dz-stroke', 'squaring-wire')
    if (classes.has('squaring-wire-arrow')) node.attributes.set('data-dz-fill', 'squaring-wire')
    if (classes.has('squaring-wire-label') || classes.has('squaring-summary')) node.attributes.set('data-dz-fill', 'ink-muted')
    if (classes.has('squaring-node-label') || classes.has('squaring-title')) node.attributes.set('data-dz-fill', 'ink')
    if (classes.has('squaring-panel-title')) node.attributes.set('data-dz-fill', 'ink-muted')
    if (classes.has('squaring-frame')) node.attributes.set('data-dz-stroke', 'line-muted')
    if (classes.has('squaring-block')) node.attributes.set('data-dz-stroke', 'squaring-block')
    for (const child of node.children) visit(child)
  }
  visit(root)
}

function applyTrnProfile(root) {
  const visit = (node, inGrid = false) => {
    if (node.type === 'text') return
    const classes = classNames(node)
    const name = localName(node)
    const nextInGrid = inGrid || classes.has('trn-grid')

    if (classes.has('trn-canvas')) node.attributes.set('data-dz-role', 'canvas')
    if (classes.has('trn-header')) {
      node.attributes.set('data-dz-fill', 'surface-2')
      node.attributes.set('data-dz-stroke', 'line-muted')
    }
    if (classes.has('trn-table-surface')) node.attributes.set('data-dz-fill', 'surface-1')
    if (classes.has('trn-ingredient-cell') || classes.has('trn-flow-cell') || classes.has('trn-instruction-cell')) {
      node.attributes.set('data-dz-fill', 'surface-1')
      node.attributes.set('data-dz-stroke', 'line-muted')
    }
    if (classes.has('trn-zone-fill') || classes.has('trn-zone-shape')) {
      const branch = [1, 2, 3, 4].find(index => classes.has(`trn-branch-${index}`)) ?? 1
      node.attributes.set('data-dz-fill', `accent-${branch}`)
    }
    if (classes.has('trn-zone-border') || classes.has('trn-zone-shape')) node.attributes.set('data-dz-stroke', 'line-muted')
    if (nextInGrid && SHAPE_ELEMENTS.has(name)) node.attributes.set('data-dz-stroke', 'line-muted')
    if (classes.has('trn-title') || classes.has('trn-ingredient-label') || classes.has('trn-instruction-label')) {
      node.attributes.set('data-dz-fill', 'ink')
    }
    if (classes.has('trn-operation-label')) node.attributes.set('data-dz-fill', 'on-accent')

    for (const child of node.children) visit(child, nextInGrid)
  }
  visit(root)
}

function applyProfile(root, capability, engine) {
  if (capability.profile === 'graphviz-15-semantic-2') applyGraphvizProfile(root, engine)
  else if (capability.profile === 'd2-0.7-semantic-2') applyD2Profile(root)
  else if (capability.profile === 'plantuml-2026-semantic-2') applyPlantumlProfile(root, engine)
  else if (capability.profile === 'svgbob-0.7-semantic-2') applySvgbobProfile(root)
  else if (capability.profile === 'neutral-svg-semantic-2') {
    const surfacePaint = engine === 'mermaid' ? ['#ececff', '#f9f9f9'] : []
    applyNeutralSvgProfile(root, engine, surfacePaint)
    applyNeutralRendererDetails(root, engine)
  }
  else if (capability.profile === 'structured-svg-semantic-2') {
    if (engine === 'goat') applyGoatProfile(root)
    else if (engine === 'vega' || engine === 'vegalite') applyVegaProfile(root)
    else if (engine === 'wavedrom') applyWavedromProfile(root)
  }
  else if (capability.profile === 'authored-neutral-semantic-1') applyNeutralSvgProfile(root, engine)
  else if (capability.profile === 'trn-semantic-4') applyTrnProfile(root)
  else if (capability.profile === 'squaring-semantic-1') applySquaringProfile(root)
  if (capability.conformance !== 'presentation-only') resolveSiblingTextContrast(root)
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
  const directText = name => root.children.some(child => child.type !== 'text'
    && localName(child) === name
    && child.children.length === 1
    && child.children[0].type === 'text'
    && child.children[0].value === (name === 'title' ? metadata.title : metadata.description))
  if (metadata.title && !directText('title')) additions.push(element('title', [], [{ type: 'text', value: metadata.title }]))
  if (metadata.description && !directText('desc')) additions.push(element('desc', [], [{ type: 'text', value: metadata.description }]))
  root.children.unshift(...additions)
}

function removeStaleNormalizerOutput(root) {
  const visit = node => {
    if (node.type === 'text') return
    node.attributes.delete('data-dz-role')
    node.attributes.delete('data-dz-fill')
    node.attributes.delete('data-dz-stroke')
    node.children = node.children.filter(child => child.type === 'text'
      || !['materializer', 'normalizer'].includes(child.attributes.get('data-dz-owned')))
    for (const child of node.children) visit(child)
  }
  visit(root)
  root.attributes.delete('data-dz-materializer')
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

function parseSafeSvg(source, maximumLength = MAX_SVG_LENGTH) {
  if (source.length > maximumLength) throw new SvgNormalizationError(413, 'render_too_large', 'Rendered SVG is too large.')
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
    const next = element(qualifiedName(tag))
    for (const [attributeKey, attribute] of Object.entries(tag.attributes)) {
      const name = typeof attribute === 'string' ? attributeKey : qualifiedName(attribute) ?? attributeKey
      const value = typeof attribute === 'string' ? attribute : attribute.value
      if (safeAttribute(name, value)) next.attributes.set(name, value)
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

export function attachEditableDocument(source, document) {
  const root = parseSafeSvg(source, MAX_EDITABLE_SVG_LENGTH)
  if (root.attributes.get('data-dz-schema') !== SVG_SCHEMA) {
    throw new SvgNormalizationError(422, 'not_canonical', 'SVG does not use the current Diagram.zip canonical schema.')
  }
  const appearance = document?.diagram?.presentation?.appearance
  if (typeof appearance === 'string' && APPEARANCES.includes(appearance)) {
    root.attributes.set('data-dz-appearance', appearance)
  }
  root.children = root.children.filter(child => child.type === 'text'
    || !(localName(child) === 'metadata' && child.attributes.get('data-dz-kind') === 'document'))
  root.attributes.set('data-dz-document', EDITABLE_SVG_SCHEMA)
  const metadata = element('metadata', [
    ['data-dz-kind', 'document'],
    ['data-dz-schema', EDITABLE_SVG_SCHEMA],
  ], [{ type: 'text', value: canonicalJson(document) }])
  const descriptiveEnd = root.children.findLastIndex(child => child.type !== 'text'
    && ['title', 'desc'].includes(localName(child)))
  root.children.splice(descriptiveEnd + 1, 0, metadata)
  const serialized = serialize(root)
  if (serialized.length > MAX_EDITABLE_SVG_LENGTH) {
    throw new SvgNormalizationError(413, 'editable_svg_too_large', 'Editable SVG is too large.')
  }
  return serialized
}

export function extractEditableDocument(source) {
  const root = parseSafeSvg(source, MAX_EDITABLE_SVG_LENGTH)
  if (root.attributes.get('data-dz-document') !== EDITABLE_SVG_SCHEMA) {
    throw new SvgNormalizationError(422, 'not_editable', 'SVG does not contain a supported Diagram.zip document.')
  }
  const manifests = root.children.filter(child => child.type !== 'text'
    && localName(child) === 'metadata'
    && child.attributes.get('data-dz-kind') === 'document')
  if (manifests.length !== 1 || manifests[0].attributes.get('data-dz-schema') !== EDITABLE_SVG_SCHEMA) {
    throw new SvgNormalizationError(422, 'invalid_editable_document', 'Editable SVG must contain exactly one supported Diagram.zip document.')
  }
  const manifest = manifests[0]
  if (manifest.children.some(child => child.type !== 'text')) {
    throw new SvgNormalizationError(422, 'invalid_editable_document', 'Editable SVG document metadata must contain JSON text only.')
  }
  try {
    return JSON.parse(manifest.children.map(child => child.value).join(''))
  } catch {
    throw new SvgNormalizationError(422, 'invalid_editable_document', 'Editable SVG document metadata is not valid JSON.')
  }
}

export function sanitizeAndDecorateSvg(source, metadata, presentation, engine, rendererVersion = '') {
  return materializePresentation(canonicalizeSvg(source, metadata, engine, rendererVersion), presentation)
}

export function canonicalizeSvg(source, metadata, engine, rendererVersion = '') {
  const root = parseSafeSvg(source)
  const previousNormalizer = root.attributes.get('data-dz-normalizer')
  if (previousNormalizer !== undefined && previousNormalizer !== NORMALIZER_BUILD) removeStaleNormalizerOutput(root)
  else if (root.attributes.has('data-dz-materializer')) {
    removeMaterializerOutput(root)
    root.attributes.delete('data-dz-materializer')
  }
  const capability = normalizationFor(engine, rendererVersion)
  applyProfile(root, capability, engine)
  root.attributes.set('data-dz-schema', SVG_SCHEMA)
  root.attributes.set('data-dz-normalizer', NORMALIZER_BUILD)
  root.attributes.set('data-dz-profile', capability.profile)
  root.attributes.set('data-dz-palette', 'renderer')
  root.attributes.set('data-dz-engine', engine)
  root.attributes.set('data-dz-appearance', 'raw')
  root.attributes.set('data-dz-conformance', capability.conformance)
  root.attributes.delete('data-dz-appearances')
  const appearances = capability.appearances.filter(appearance => appearance !== 'raw')
  if (appearances.length > 0) root.attributes.set('data-dz-appearances', appearances.join(' '))
  root.attributes.delete('data-dz-bounds')
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
  accent1: '#2563eb', accent2: '#7c3aed', accent3: '#c2410c', accent4: '#047857', onAccent: '#ffffff', frame: '#cbd5e1',
})
const DARK_PALETTE = Object.freeze({
  canvas: '#0f172a', surface1: '#1e293b', surface2: '#273449', surface3: '#334155',
  ink: '#f8fafc', inkMuted: '#cbd5e1', line: '#e2e8f0', lineMuted: '#94a3b8',
  accent1: '#60a5fa', accent2: '#c4b5fd', accent3: '#fb923c', accent4: '#34d399', onAccent: '#0f172a', frame: '#475569',
})
const TRN_LIGHT_BRANCH_PALETTE = Object.freeze({
  accent1: '#dbeafe', accent2: '#fef3c7', accent3: '#ede9fe', accent4: '#ccfbf1', onAccent: '#0f172a',
})

const SQUARING_LIGHT_PALETTE = Object.freeze({
  squares: ['#93c5fd', '#b3d1fb', '#cddaf2', '#e2e4e8', '#f1d6d2', '#fbbfba', '#fca5a5', '#f87171'],
  nodes: ['#2563eb', '#3b6fe0', '#4f74c8', '#6b7280', '#b45454', '#d13b3b', '#dc2626', '#b91c1c'],
  edge: '#1e293b', label: '#0f172a', wire: '#1e293b', block: '#db2777',
})
const SQUARING_DARK_PALETTE = Object.freeze({
  squares: ['#1e40af', '#2d55b8', '#3f5f9f', '#4f5b73', '#7f414d', '#a23a3f', '#c12f33', '#dc2626'],
  nodes: ['#60a5fa', '#7cb0f5', '#93b7e8', '#a8b0c4', '#d6a3a3', '#f38f8f', '#f87171', '#ef4444'],
  edge: '#0b1220', label: '#f8fafc', wire: '#a5b4fc', block: '#f472b6',
})

function squaringPaletteVariables(palette) {
  const bands = palette.squares.map((value, index) => `--dz-sq-square-${index}:${value};--dz-sq-node-${index}:${palette.nodes[index]};`).join('')
  return `${bands}--dz-sq-edge:${palette.edge};--dz-sq-label:${palette.label};--dz-sq-wire:${palette.wire};--dz-sq-block:${palette.block};`
}

function squaringRoleCss(themed) {
  const scope = `${themed}[data-dz-profile="squaring-semantic-1"]`
  const bands = SQUARING_LIGHT_PALETTE.squares.map((_, index) =>
    `${scope} [data-dz-fill="squaring-square-${index}"]{fill:var(--dz-sq-square-${index})!important}${scope} [data-dz-fill="squaring-node-${index}"]{fill:var(--dz-sq-node-${index})!important}${scope} [data-dz-stroke="squaring-node-${index}"]{stroke:var(--dz-sq-node-${index})!important}`,
  ).join('')
  return `${bands}${scope} [data-dz-stroke="squaring-edge"]{stroke:var(--dz-sq-edge)!important}${scope} [data-dz-fill="squaring-label"]{fill:var(--dz-sq-label)!important}${scope} [data-dz-stroke="squaring-wire"]{stroke:var(--dz-sq-wire)!important}${scope} [data-dz-fill="squaring-wire"]{fill:var(--dz-sq-wire)!important}${scope} [data-dz-stroke="squaring-block"]{stroke:var(--dz-sq-block)!important}`
}

function paletteVariables(palette) {
  return `--dz-canvas:${palette.canvas};--dz-surface-1:${palette.surface1};--dz-surface-2:${palette.surface2};--dz-surface-3:${palette.surface3};--dz-ink:${palette.ink};--dz-ink-muted:${palette.inkMuted};--dz-line:${palette.line};--dz-line-muted:${palette.lineMuted};--dz-accent-1:${palette.accent1};--dz-accent-2:${palette.accent2};--dz-accent-3:${palette.accent3};--dz-accent-4:${palette.accent4};--dz-on-accent:${palette.onAccent};--dz-frame:${palette.frame};`
}

function branchPaletteVariables(palette) {
  return `--dz-accent-1:${palette.accent1};--dz-accent-2:${palette.accent2};--dz-accent-3:${palette.accent3};--dz-accent-4:${palette.accent4};--dz-on-accent:${palette.onAccent};`
}

function materializerCss() {
  const light = ':root[data-dz-appearance^="light-"]'
  const dark = ':root[data-dz-appearance^="dark-"]'
  const automatic = ':root[data-dz-appearance^="auto-"]'
  const themed = ':root:not([data-dz-appearance="raw"])'
  const trnLight = ':root[data-dz-profile="trn-semantic-4"][data-dz-appearance^="light-"]'
  const trnAutomatic = ':root[data-dz-profile="trn-semantic-4"][data-dz-appearance^="auto-"]'
  const variables = `${light}{${paletteVariables(LIGHT_PALETTE)}}${dark}{${paletteVariables(DARK_PALETTE)}}${automatic}{${paletteVariables(LIGHT_PALETTE)}}@media(prefers-color-scheme:dark){${automatic}{${paletteVariables(DARK_PALETTE)}}}`
  const squaringLight = ':root[data-dz-profile="squaring-semantic-1"][data-dz-appearance^="light-"]'
  const squaringDark = ':root[data-dz-profile="squaring-semantic-1"][data-dz-appearance^="dark-"]'
  const squaringAutomatic = ':root[data-dz-profile="squaring-semantic-1"][data-dz-appearance^="auto-"]'
  const squaringVariables = `${squaringLight}{${squaringPaletteVariables(SQUARING_LIGHT_PALETTE)}}${squaringDark}{${squaringPaletteVariables(SQUARING_DARK_PALETTE)}}${squaringAutomatic}{${squaringPaletteVariables(SQUARING_LIGHT_PALETTE)}}@media(prefers-color-scheme:dark){${squaringAutomatic}{${squaringPaletteVariables(SQUARING_DARK_PALETTE)}}}`
  const trnVariables = `${trnLight}{${branchPaletteVariables(TRN_LIGHT_BRANCH_PALETTE)}}${trnAutomatic}{${branchPaletteVariables(TRN_LIGHT_BRANCH_PALETTE)}}@media(prefers-color-scheme:dark){${trnAutomatic}{${branchPaletteVariables(DARK_PALETTE)}}}`
  const materializerVisibility = `:root[data-dz-appearance="raw"] [data-dz-owned="materializer"],:root[data-dz-appearance$="-transparent"] [data-dz-owned="materializer"]{display:none!important}`
  const roles = `${themed} [data-dz-role="canvas"]:not([data-dz-owned="materializer"]){display:none!important}${themed} [data-dz-fill="none"]{fill:none!important}${themed} [data-dz-fill="surface-1"]{fill:var(--dz-surface-1)!important}${themed} [data-dz-fill="surface-2"]{fill:var(--dz-surface-2)!important}${themed} [data-dz-fill="surface-3"]{fill:var(--dz-surface-3)!important}${themed} [data-dz-fill="ink"]{fill:var(--dz-ink)!important;color:var(--dz-ink)!important}${themed} [data-dz-fill="ink-muted"]{fill:var(--dz-ink-muted)!important;color:var(--dz-ink-muted)!important}${themed} [data-dz-fill="line"]{fill:var(--dz-line)!important}${themed} [data-dz-fill="accent-1"]{fill:var(--dz-accent-1)!important}${themed} [data-dz-fill="accent-2"]{fill:var(--dz-accent-2)!important}${themed} [data-dz-fill="accent-3"]{fill:var(--dz-accent-3)!important}${themed} [data-dz-fill="accent-4"]{fill:var(--dz-accent-4)!important}${themed} [data-dz-fill="on-accent"]{fill:var(--dz-on-accent)!important;color:var(--dz-on-accent)!important}${themed} [data-dz-stroke="line"]{stroke:var(--dz-line)!important}${themed} [data-dz-stroke="line-muted"]{stroke:var(--dz-line-muted)!important}${themed} [data-dz-stroke="accent-1"]{stroke:var(--dz-accent-1)!important}${themed} [data-dz-stroke="accent-2"]{stroke:var(--dz-accent-2)!important}${themed} [data-dz-stroke="accent-3"]{stroke:var(--dz-accent-3)!important}${themed} [data-dz-stroke="accent-4"]{stroke:var(--dz-accent-4)!important}`
  return `${variables}${trnVariables}${squaringVariables}${materializerVisibility}${roles}${squaringRoleCss(themed)}`
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
  root.children.unshift(element('style', [['data-dz-owned', 'materializer']], [{ type: 'text', value: materializerCss() }]))
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

export function supportedAppearances(canonical) {
  const root = parseSafeSvg(canonical)
  if (root.attributes.get('data-dz-schema') !== SVG_SCHEMA) {
    throw new SvgNormalizationError(422, 'not_canonical', 'SVG does not use the current Diagram.zip canonical schema.')
  }
  return Object.freeze([
    'raw',
    ...(root.attributes.get('data-dz-appearances') ?? '').split(/\s+/).filter(appearance => APPEARANCES.includes(appearance)),
  ])
}
