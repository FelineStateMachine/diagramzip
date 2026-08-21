import { SaxesParser, type SaxesTagPlain } from 'saxes'
import { RenderError } from './errors'

const MAX_SOURCE_BYTES = 262_144
const MAX_ELEMENTS = 1_000
const MAX_XML_NODES = 12_000
const MAX_ELEMENT_TEXT = 32_768
const MAX_TOTAL_TEXT = 262_144
const MAX_COORDINATE = 8_192
const MAX_OUTPUT_LENGTH = 4_194_304
const MARGIN = 20

interface XmlNode {
  name: string
  text: string
  children: XmlNode[]
}

interface UmletElement {
  rawType: string
  kind: string
  x: number
  y: number
  width: number
  height: number
  panel: string
  additional: string
}

interface Panel {
  controls: Map<string, string>
  lines: string[]
}

const LEGACY_TYPES = new Map<string, string>([
  ['com.umlet.element.base.Relation', 'Relation'],
  ['com.umlet.element.base.Class', 'UMLClass'],
  ['com.umlet.element.base.UseCase', 'UMLUseCase'],
  ['com.umlet.element.base.Interface', 'UMLInterface'],
  ['com.umlet.element.base.Actor', 'UMLActor'],
  ['com.umlet.element.base.State', 'UMLState'],
  ['com.umlet.element.base.Object', 'UMLObject'],
  ['com.umlet.element.base.Timer', 'UMLTimer'],
  ['com.umlet.element.base.SpecialState', 'UMLSpecialState'],
  ['com.umlet.element.base.Note', 'UMLNote'],
  ['com.umlet.element.base.Package', 'UMLPackage'],
  ['com.umlet.element.base.Frame', 'UMLFrame'],
  ['com.umlet.element.base.Deployment', 'UMLDeployment'],
  ['com.umlet.element.base.Generic', 'UMLGeneric'],
  ['com.umlet.element.base.Hierarchy', 'UMLHierarchy'],
  ['com.umlet.element.base.Text', 'Text'],
  ['com.umlet.element.base.SequenceAllInOne', 'UMLSequenceAllInOne'],
  ['com.umlet.element.custom.State', 'CustomState'],
  ['com.umlet.element.custom.FinalState', 'CustomFinalState'],
  ['com.umlet.element.custom.InitialState', 'CustomInitialState'],
  ['com.umlet.element.custom.HistoryState', 'CustomHistoryState'],
  ['com.umlet.element.custom.ThreeWayRelation', 'CustomThreeWayRelation'],
])

const STANDARD_IDS = new Set([
  'Relation', 'UMLClass', 'UMLUseCase', 'UMLInterface', 'UMLActor', 'UMLState',
  'UMLObject', 'UMLTimer', 'UMLSpecialState', 'UMLNote', 'UMLSyncBarHorizontal',
  'UMLSyncBarVertical', 'UMLPackage', 'UMLFrame', 'UMLDeployment', 'UMLGeneric',
  'UMLHierarchy', 'Text', 'PlotGrid', 'UMLSequenceAllInOne',
])

const CONTROL_KEYS = new Set([
  'bg', 'fg', 'fontsize', 'halign', 'valign', 'lt', 'type', 'style', 'layer',
  'group', 'transparentselection',
])

function fail(code: string, message: string): never {
  throw new RenderError(422, code, message)
}

function child(node: XmlNode, name: string): XmlNode | undefined {
  return node.children.find(value => value.name.toLowerCase() === name)
}

function content(node: XmlNode | undefined): string {
  if (!node) return ''
  return `${node.text}${node.children.map(content).join('')}`
}

function integer(value: string, name: string): number {
  if (!/^-?\d+$/.test(value.trim())) fail('invalid_source', `UMLet ${name} must be an integer.`)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) fail('invalid_source', `UMLet ${name} is outside the supported range.`)
  return parsed
}

function parseXml(source: string): XmlNode {
  if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) {
    throw new RenderError(413, 'source_too_large', 'UMLet source may not exceed 256 KiB.')
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) fail('invalid_source', 'UMLet source may not contain a doctype or entity declaration.')
  let root: XmlNode | null = null
  const stack: XmlNode[] = []
  let nodes = 0
  let parseError: Error | null = null
  const parser = new SaxesParser({ xmlns: false })
  parser.on('doctype', () => { parseError = new Error('DOCTYPE is not allowed') })
  parser.on('processinginstruction', () => { parseError = new Error('Processing instructions are not allowed') })
  parser.on('opentag', (tag: SaxesTagPlain) => {
    if (++nodes > MAX_XML_NODES) {
      parseError = new Error('Too many XML nodes')
      return
    }
    const node: XmlNode = { name: tag.name, text: '', children: [] }
    const parent = stack.at(-1)
    if (parent) parent.children.push(node)
    else if (root === null) root = node
    else parseError = new Error('Multiple XML roots')
    stack.push(node)
  })
  const append = (value: string) => {
    const node = stack.at(-1)
    if (node) node.text += value
    else if (value.trim()) parseError = new Error('Text outside XML root')
  }
  parser.on('text', append)
  parser.on('cdata', append)
  parser.on('closetag', () => { stack.pop() })
  parser.on('error', error => { parseError = error })
  try { parser.write(source).close() } catch (error) { parseError = error instanceof Error ? error : new Error(String(error)) }
  if (parseError || !root) fail('invalid_source', 'UMLet source is not valid bounded XML.')
  return root
}

export function parseUmlet(source: string): UmletElement[] {
  const root = parseXml(source)
  if (!['diagram', 'umlet_diagram'].includes(root.name.toLowerCase())) fail('invalid_source', 'UMLet source must contain a diagram or umlet_diagram root.')
  const nodes = root.children.filter(node => node.name.toLowerCase() === 'element')
  if (nodes.length === 0) fail('invalid_source', 'UMLet source contains no elements.')
  if (nodes.length > MAX_ELEMENTS) throw new RenderError(413, 'source_too_large', `UMLet source may not contain more than ${MAX_ELEMENTS} elements.`)
  let totalText = 0
  const elements = nodes.map(node => {
    const id = content(child(node, 'id')).trim()
    const type = content(child(node, 'type')).trim()
    const rawType = id || type
    if (!rawType) fail('invalid_source', 'Every UMLet element needs an id or type.')
    const kind = id && STANDARD_IDS.has(id) ? id : LEGACY_TYPES.get(type) ?? (type.startsWith('com.umlet.element.custom.') ? 'CustomFallback' : 'GenericFallback')
    const coordinates = child(node, 'coordinates')
    if (!coordinates) fail('invalid_source', `UMLet element ${rawType} has no coordinates.`)
    const x = integer(content(child(coordinates, 'x')), 'x coordinate')
    const y = integer(content(child(coordinates, 'y')), 'y coordinate')
    const width = integer(content(child(coordinates, 'w')), 'width')
    const height = integer(content(child(coordinates, 'h')), 'height')
    if (width < 1 || height < 1) fail('invalid_source', 'UMLet element dimensions must be positive.')
    if (Math.abs(x) > MAX_COORDINATE || Math.abs(y) > MAX_COORDINATE || width > MAX_COORDINATE || height > MAX_COORDINATE || Math.abs(x + width) > MAX_COORDINATE || Math.abs(y + height) > MAX_COORDINATE) {
      fail('invalid_source', `UMLet coordinates may not exceed ${MAX_COORDINATE}px.`)
    }
    const panel = content(child(node, 'panel_attributes'))
    const additional = content(child(node, 'additional_attributes'))
    if (panel.length > MAX_ELEMENT_TEXT || additional.length > MAX_ELEMENT_TEXT) fail('invalid_source', 'A UMLet element contains too much text or geometry data.')
    totalText += panel.length + additional.length
    return { rawType, kind, x, y, width, height, panel, additional }
  })
  if (totalText > MAX_TOTAL_TEXT) throw new RenderError(413, 'source_too_large', 'UMLet source contains too much element text.')
  return elements
}

function escape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function panel(value: string): Panel {
  const controls = new Map<string, string>()
  const lines: string[] = []
  for (const raw of value.replaceAll('\r', '').split('\n')) {
    const line = raw.trimEnd()
    const match = /^([a-z][a-z0-9_-]*)=(.*)$/i.exec(line.trim())
    if (match && CONTROL_KEYS.has(match[1]!.toLowerCase())) controls.set(match[1]!.toLowerCase(), match[2]!.trim())
    else if (line.trim() || lines.length) lines.push(line.trim())
  }
  while (lines.at(-1) === '') lines.pop()
  return { controls, lines }
}

function color(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const normalized = value.trim()
  return /^(?:#[0-9a-f]{3,8}|[a-z]{1,20})$/i.test(normalized) ? normalized : fallback
}

function fontSize(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 6 && parsed <= 72 ? parsed : 14
}

function wrapLine(value: string, width: number, size: number): string[] {
  if (!value) return ['']
  const maximum = Math.max(4, Math.floor(width / (size * 0.58)))
  if (value.length <= maximum) return [value]
  const result: string[] = []
  let current = ''
  for (const word of value.split(/\s+/)) {
    if (word.length > maximum * 1.5) {
      if (current) { result.push(current); current = '' }
      for (let index = 0; index < word.length; index += maximum) result.push(word.slice(index, index + maximum))
    } else if (!current) current = word
    else if (`${current} ${word}`.length <= maximum) current += ` ${word}`
    else { result.push(current); current = word }
  }
  if (current) result.push(current)
  return result
}

function textBlock(element: UmletElement, parsed: Panel, inset = 8, centered = false): string {
  let size = fontSize(parsed.controls.get('fontsize'))
  const available = Math.max(8, element.width - inset * 2)
  const makeLines = () => parsed.lines.flatMap(line => line === '--' ? ['--'] : wrapLine(line, available, size)).slice(0, 200)
  let lines = makeLines()
  const availableHeight = Math.max(8, element.height - inset * 2)
  if (lines.length * size * 1.25 > availableHeight) {
    size = Math.max(8, Math.min(size, availableHeight / Math.max(1, lines.length * 1.25)))
    lines = makeLines()
  }
  const lineHeight = size * 1.25
  const total = lines.length * lineHeight
  const align = parsed.controls.get('halign') ?? (centered ? 'center' : 'left')
  const anchor = align === 'right' ? 'end' : align === 'center' ? 'middle' : 'start'
  const x = align === 'right' ? element.x + element.width - inset : align === 'center' ? element.x + element.width / 2 : element.x + inset
  let y = parsed.controls.get('valign') === 'center' || centered
    ? element.y + Math.max(size, (element.height - total) / 2 + size)
    : element.y + inset + size
  const output: string[] = []
  for (const line of lines) {
    if (line === '--') {
      output.push(`<line x1="${element.x + inset}" y1="${y - size * 0.45}" x2="${element.x + element.width - inset}" y2="${y - size * 0.45}" class="separator"/>`)
    } else {
      output.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${escape(line)}</text>`)
    }
    y += lineHeight
  }
  return output.join('')
}

function points(element: UmletElement): Array<[number, number]> {
  const values = element.additional.split(';').map(value => value.trim()).filter(Boolean)
  if (values.length < 4 || values.length % 2 !== 0 || values.some(value => !/^-?\d+(?:\.\d+)?$/.test(value))) {
    return [[element.x, element.y + element.height / 2], [element.x + element.width, element.y + element.height / 2]]
  }
  const parsed = values.map(Number)
  if (parsed.some(value => !Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE)) {
    return [[element.x, element.y + element.height / 2], [element.x + element.width, element.y + element.height / 2]]
  }
  const result: Array<[number, number]> = []
  for (let index = 0; index < parsed.length; index += 2) result.push([element.x + parsed[index]!, element.y + parsed[index + 1]!])
  return result
}

function relation(element: UmletElement, parsed: Panel): string {
  const relationPoints = points(element)
  const lineType = parsed.controls.get('lt') ?? '-'
  const markerStart = lineType.includes('<') ? ' marker-start="url(#arrow)"' : ''
  const markerEnd = lineType.includes('>') ? ' marker-end="url(#arrow)"' : ''
  const dash = lineType.includes('.') ? ' stroke-dasharray="2 5"' : lineType.includes('/') ? ' stroke-dasharray="8 5"' : ''
  const serialized = relationPoints.map(([x, y]) => `${x},${y}`).join(' ')
  const middle = relationPoints[Math.floor((relationPoints.length - 1) / 2)]!
  const labels = parsed.lines.filter(line => line !== '--')
  return `<polyline points="${serialized}" fill="none"${markerStart}${markerEnd}${dash}/>${labels.map((line, index) => `<text x="${middle[0] + 6}" y="${middle[1] - 6 + index * 17}" font-size="13">${escape(line)}</text>`).join('')}`
}

function specialState(element: UmletElement, mode: string): string {
  const cx = element.x + element.width / 2
  const cy = element.y + element.height / 2
  const radius = Math.max(3, Math.min(element.width, element.height) / 2 - 2)
  if (mode === 'initial') return `<circle cx="${cx}" cy="${cy}" r="${radius}" class="solid"/>`
  if (mode === 'final') return `<circle cx="${cx}" cy="${cy}" r="${radius}"/><circle cx="${cx}" cy="${cy}" r="${Math.max(2, radius * 0.55)}" class="solid"/>`
  if (mode === 'history' || mode === 'history_shallow') return `<circle cx="${cx}" cy="${cy}" r="${radius}"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="${Math.max(8, radius)}">H</text>`
  if (mode === 'history_deep') return `<circle cx="${cx}" cy="${cy}" r="${radius}"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="${Math.max(8, radius)}">H*</text>`
  if (mode === 'termination') return `<line x1="${cx - radius}" y1="${cy - radius}" x2="${cx + radius}" y2="${cy + radius}"/><line x1="${cx + radius}" y1="${cy - radius}" x2="${cx - radius}" y2="${cy + radius}"/>`
  return `<path d="M ${cx} ${cy - radius} L ${cx + radius} ${cy} L ${cx} ${cy + radius} L ${cx - radius} ${cy} Z"/>`
}

function generic(element: UmletElement, parsed: Panel, label?: string): string {
  const heading = label ? `<text x="${element.x + 7}" y="${element.y + 14}" font-size="10" class="fallback-label">${escape(label)}</text>` : ''
  const shifted = label ? { ...element, y: element.y + 10, height: Math.max(1, element.height - 10) } : element
  return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="3"${label ? ' stroke-dasharray="5 4"' : ''}/>${heading}${textBlock(shifted, parsed, 7)}`
}

function draw(element: UmletElement): string {
  const parsed = panel(element.panel)
  const fill = color(parsed.controls.get('bg'), 'white')
  const stroke = color(parsed.controls.get('fg'), '#111827')
  const open = `<g fill="${fill}" stroke="${stroke}" color="${stroke}">`
  switch (element.kind) {
    case 'Relation': return `${open}${relation(element, parsed)}</g>`
    case 'CustomThreeWayRelation': {
      const cx = element.x + element.width / 2; const cy = element.y + element.height / 2
      return `${open}<path d="M ${cx} ${element.y} L ${cx} ${cy} M ${element.x} ${cy} L ${element.x + element.width} ${cy} M ${cx} ${cy} L ${cx} ${element.y + element.height}"/><circle cx="${cx}" cy="${cy}" r="2" class="solid"/></g>`
    }
    case 'CustomInitialState': return `${open}${specialState(element, 'initial')}</g>`
    case 'CustomFinalState': return `${open}${specialState(element, 'final')}</g>`
    case 'CustomHistoryState': return `${open}${specialState(element, 'history')}</g>`
    case 'UMLSpecialState': return `${open}${specialState(element, (parsed.controls.get('type') ?? 'decision').toLowerCase())}</g>`
    case 'UMLUseCase': return `${open}<ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}"/>${textBlock(element, parsed, 8, true)}</g>`
    case 'UMLActor': {
      const cx = element.x + element.width / 2; const top = element.y + 5; const unit = Math.min(element.width, element.height) / 5
      return `${open}<circle cx="${cx}" cy="${top + unit}" r="${unit * 0.55}"/><path d="M ${cx} ${top + unit * 1.55} L ${cx} ${top + unit * 3.1} M ${cx - unit} ${top + unit * 2.1} L ${cx + unit} ${top + unit * 2.1} M ${cx} ${top + unit * 3.1} L ${cx - unit} ${top + unit * 4.2} M ${cx} ${top + unit * 3.1} L ${cx + unit} ${top + unit * 4.2}"/>${textBlock({ ...element, y: element.y + element.height * 0.72, height: element.height * 0.28 }, parsed, 4, true)}</g>`
    }
    case 'UMLInterface': {
      const cx = element.x + element.width / 2; const radius = Math.min(element.width, element.height) * 0.18
      return `${open}<circle cx="${cx}" cy="${element.y + radius + 3}" r="${radius}"/><line x1="${cx}" y1="${element.y + radius * 2 + 3}" x2="${cx}" y2="${element.y + radius * 3 + 3}"/>${textBlock({ ...element, y: element.y + radius * 3, height: element.height - radius * 3 }, parsed, 4, true)}</g>`
    }
    case 'UMLNote': {
      const fold = Math.min(18, element.width / 4, element.height / 4)
      return `${open}<path d="M ${element.x} ${element.y} H ${element.x + element.width - fold} L ${element.x + element.width} ${element.y + fold} V ${element.y + element.height} H ${element.x} Z M ${element.x + element.width - fold} ${element.y} V ${element.y + fold} H ${element.x + element.width}"/>${textBlock(element, parsed)}</g>`
    }
    case 'UMLPackage': {
      const tab = Math.min(element.width * 0.45, 90); const tabHeight = Math.min(18, element.height * 0.25)
      return `${open}<path d="M ${element.x} ${element.y + tabHeight} V ${element.y} H ${element.x + tab} L ${element.x + tab + 8} ${element.y + tabHeight} H ${element.x + element.width} V ${element.y + element.height} H ${element.x} Z"/>${textBlock({ ...element, y: element.y + tabHeight, height: element.height - tabHeight }, parsed)}</g>`
    }
    case 'UMLDeployment': return `${open}<path d="M ${element.x + 8} ${element.y} H ${element.x + element.width} V ${element.y + element.height - 8} L ${element.x + element.width - 8} ${element.y + element.height} H ${element.x} V ${element.y + 8} Z M ${element.x} ${element.y + 8} L ${element.x + 8} ${element.y} M ${element.x + element.width - 8} ${element.y + element.height} L ${element.x + element.width} ${element.y + element.height - 8}"/>${textBlock(element, parsed)}</g>`
    case 'UMLSyncBarHorizontal': return `${open}<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" class="solid"/></g>`
    case 'UMLSyncBarVertical': return `${open}<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" class="solid"/></g>`
    case 'UMLTimer': {
      const cx = element.x + element.width / 2; const cy = element.y + element.height / 2; const r = Math.max(4, Math.min(element.width, element.height) / 2 - 3)
      return `${open}<circle cx="${cx}" cy="${cy}" r="${r}"/><path d="M ${cx} ${cy} V ${cy - r * 0.65} M ${cx} ${cy} L ${cx + r * 0.55} ${cy + r * 0.3}"/>${textBlock(element, parsed, 4, true)}</g>`
    }
    case 'UMLHierarchy': {
      const cx = element.x + element.width / 2; const mid = element.y + element.height / 2
      return `${open}<path d="M ${cx} ${element.y + 4} V ${mid} M ${element.x + 8} ${mid} H ${element.x + element.width - 8} M ${element.x + 8} ${mid} V ${element.y + element.height - 4} M ${element.x + element.width - 8} ${mid} V ${element.y + element.height - 4}"/>${textBlock(element, parsed, 4, true)}</g>`
    }
    case 'Text': return `${open}${textBlock(element, parsed, 0)}</g>`
    case 'CustomState':
    case 'UMLState': return `${open}<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${Math.min(14, element.height / 3)}"/>${textBlock(element, parsed)}</g>`
    case 'UMLClass':
    case 'UMLObject':
    case 'UMLFrame':
    case 'UMLGeneric': return `${open}${generic(element, parsed)}</g>`
    case 'PlotGrid':
    case 'UMLSequenceAllInOne': return `${open}${generic(element, parsed, `approximated ${element.kind}`)}</g>`
    case 'CustomFallback': return `${open}${generic(element, parsed, `custom ${element.rawType.split('.').at(-1)}`)}</g>`
    default: return `${open}${generic(element, parsed, `unknown ${element.rawType.split('.').at(-1)}`)}</g>`
  }
}

export function renderUmlet(source: string): string {
  const elements = parseUmlet(source)
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity
  for (const element of elements) {
    minX = Math.min(minX, element.x); minY = Math.min(minY, element.y)
    maxX = Math.max(maxX, element.x + element.width); maxY = Math.max(maxY, element.y + element.height)
    if (element.kind === 'Relation') {
      const relationPoints = points(element)
      for (const [pointX, pointY] of relationPoints) { minX = Math.min(minX, pointX); minY = Math.min(minY, pointY); maxX = Math.max(maxX, pointX); maxY = Math.max(maxY, pointY) }
      const labels = panel(element.panel).lines.filter(line => line !== '--')
      const middle = relationPoints[Math.floor((relationPoints.length - 1) / 2)]!
      maxX = Math.max(maxX, middle[0] + 12 + Math.max(0, ...labels.map(label => label.length * 7.5)))
      minY = Math.min(minY, middle[1] - 20)
      maxY = Math.max(maxY, middle[1] + labels.length * 18)
    }
  }
  const x = minX - MARGIN; const y = minY - MARGIN; const width = maxX - minX + MARGIN * 2; const height = maxY - minY + MARGIN * 2
  const body = elements.map(draw).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="context-stroke"/></marker></defs><style>g{stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}text{fill:currentColor;stroke:none;font-family:Arial,sans-serif}.solid{fill:currentColor}.separator{stroke:currentColor}.fallback-label{fill:#6b7280}</style>${body}</svg>`
  if (svg.length > MAX_OUTPUT_LENGTH) throw new RenderError(413, 'render_too_large', 'Rendered UMLet SVG is too large.')
  return svg
}
