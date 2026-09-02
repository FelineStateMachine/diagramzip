import { RenderError } from '../runtime/errors'
import { POLYHEDRA, POLYHEDRON_NAMES } from './squaring-polyhedra'

export type SquaringView = 'rectangle' | 'circuit' | 'overlay' | 'both'
export type SquaringLabels = 'sides' | 'none'

/** A side length: a constant, a linear expression in named unknowns, or `?` for "as wide as the gap". */
export interface SideExpression {
  text: string
  constant: number
  terms: Record<string, number>
  auto: boolean
}

export interface SquareGroup {
  sides: SideExpression[]
  under: string[] | null
  line: number
}

export interface SquaringWire {
  from: string
  to: string
  line: number
}

export interface SquaringRectangleSource {
  width: number | null
  height: number | null
  groups: SquareGroup[]
  symbolic: boolean
  line: number
}

export interface SquaringNetworkSource {
  positive: string | null
  negative: string | null
  searchBattery: boolean
  nodes: string[]
  wires: SquaringWire[]
  line: number
}

export interface SquaringDocument {
  view: SquaringView
  labels: SquaringLabels
  title: string
  rectangle: SquaringRectangleSource | null
  network: SquaringNetworkSource | null
}

const IDENTIFIER = /^[A-Za-z0-9_]+$/
const SYMBOL = /^[A-Za-z_][A-Za-z0-9_]*$/
const CHAIN = /^[A-Za-z0-9_]+(?:\s*-+\s*[A-Za-z0-9_]+)+$/
const RECTANGLE = /^rectangle\s+(\d+|\?)\s*(?:x|×|by)\s*(\d+|\?)$/i
const TERM = /^([+-]?)(\d*)([A-Za-z_][A-Za-z0-9_]*)?$/
const VIEWS: readonly SquaringView[] = ['rectangle', 'circuit', 'overlay', 'both']
const LABELS: readonly SquaringLabels[] = ['sides', 'none']
const RESERVED = new Set(['under', 'squares', 'rectangle', 'battery', 'wire', 'face', 'polyhedron', 'title', 'any'])

function sourceError(line: number, message: string): never {
  throw new RenderError(422, 'invalid_source', `Line ${line}: ${message}`)
}

function stripComment(raw: string): string {
  let quoted = false
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index]
    if (character === '"') quoted = !quoted
    else if (character === '#' && !quoted) {
      // "#3" refers to the third square; a comment needs a space (or line start) before the # and no digit after it.
      const atBoundary = index === 0 || /\s/.test(raw[index - 1] ?? '')
      if (atBoundary && !/^\d/.test(raw[index + 1] ?? '')) return raw.slice(0, index)
    }
  }
  return raw
}

function identifier(value: string, line: number, role: string): string {
  if (!IDENTIFIER.test(value)) sourceError(line, `${role} "${value}" must use letters, digits, or underscores.`)
  return value
}

function positiveInteger(value: string, line: number, role: string): number {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number <= 0) sourceError(line, `${role} must be a positive whole number, not "${value}".`)
  return number
}

export function parseSideExpression(token: string, line: number): SideExpression {
  if (token === '?') return { text: '?', constant: 0, terms: {}, auto: true }
  const terms: Record<string, number> = {}
  let constant = 0
  const pieces = token.match(/[+-]?[^+-]+/g)
  if (pieces === null || pieces.join('') !== token) sourceError(line, `"${token}" is not a side length. Use a number, a name such as a, or an expression such as 2a+b.`)
  for (const piece of pieces) {
    const match = TERM.exec(piece)
    if (match === null) sourceError(line, `"${token}" is not a side length. Use a number, a name such as a, or an expression such as 2a+b.`)
    const sign = match[1] === '-' ? -1 : 1
    const digits = match[2] ?? ''
    const symbol = match[3]
    if (symbol === undefined) {
      if (digits === '') sourceError(line, `"${token}" is not a side length.`)
      constant += sign * Number(digits)
    } else {
      if (RESERVED.has(symbol)) sourceError(line, `"${symbol}" is a keyword and cannot name a side.`)
      terms[symbol] = (terms[symbol] ?? 0) + sign * (digits === '' ? 1 : Number(digits))
    }
  }
  for (const [symbol, coefficient] of Object.entries(terms)) if (coefficient === 0) delete terms[symbol]
  if (Object.keys(terms).length === 0 && constant <= 0) sourceError(line, `A side length must be positive, not "${token}".`)
  return { text: token, constant, terms, auto: false }
}

function parseSquareLine(text: string, line: number): SquareGroup[] {
  const [body, ...underParts] = text.split(/\bunder\b/)
  if (underParts.length > 1) sourceError(line, 'Write at most one "under" clause per line.')
  const spaced = (body ?? '').replaceAll(',', ' ').replaceAll('(', ' ( ').replaceAll(')', ' ) ')
  const tokens = spaced.trim().split(/\s+/).filter(token => token !== '')
  const groups: SquareGroup[] = []
  let open: SideExpression[] | null = null
  let loose: SideExpression[] = []
  for (const token of tokens) {
    if (token === '(') {
      if (open !== null) sourceError(line, 'Groups cannot be nested.')
      if (loose.length > 0) {
        groups.push({ sides: loose, under: null, line })
        loose = []
      }
      open = []
    } else if (token === ')') {
      if (open === null) sourceError(line, 'Unexpected ")".')
      if (open.length === 0) sourceError(line, 'Empty group "()".')
      groups.push({ sides: open, under: null, line })
      open = null
    } else {
      const expression = parseSideExpression(token, line)
      if (open !== null) open.push(expression)
      else loose.push(expression)
    }
  }
  if (open !== null) sourceError(line, 'Missing ")".')
  if (loose.length > 0) groups.push({ sides: loose, under: null, line })
  if (groups.length === 0) sourceError(line, 'List at least one square side.')
  const underText = underParts[0]?.trim() ?? ''
  if (underParts.length === 1) {
    if (groups.length !== 1) sourceError(line, 'A line with "under" holds exactly one group of squares.')
    const refs = underText.split(/[\s,]+/).filter(ref => ref !== '')
    if (refs.length === 0) sourceError(line, 'Name the squares this group hangs under, for example "under a b".')
    for (const ref of refs) {
      if (!(SYMBOL.test(ref) || /^\d+$/.test(ref) || /^#\d+$/.test(ref))) sourceError(line, `"${ref}" is not a square reference. Use a side name, a number, or #n for the n-th square.`)
    }
    const group = groups[0]
    if (group !== undefined) group.under = refs
  }
  return groups
}

// Bare numbers are always squares. Named sides need a group "(a b)" or an
// "under" clause so that a stray line of words is reported, not solved.
function looksLikeSquareLine(text: string): boolean {
  const body = text.split(/\bunder\b/)[0] ?? ''
  const tokens = body.replaceAll(',', ' ').replaceAll('(', ' ').replaceAll(')', ' ').trim().split(/\s+/).filter(token => token !== '')
  if (tokens.length === 0 || !tokens.every(token => token === '?' || /^[+-]?[\dA-Za-z_+-]+$/.test(token))) return false
  const symbolic = tokens.some(token => /[A-Za-z_]/.test(token))
  return !symbolic || text.includes('(') || /\bunder\b/.test(text)
}

export function parseSquaring(source: string): SquaringDocument {
  let view: SquaringView | null = null
  let labels: SquaringLabels | null = null
  let title = ''
  let rectangle: SquaringRectangleSource | null = null
  let battery: { positive: string | null; negative: string | null; search: boolean; line: number } | null = null
  const wires: SquaringWire[] = []
  const wireKeys = new Set<string>()
  const nodes: string[] = []
  let firstNetworkLine = 0

  const rememberNode = (id: string): void => {
    if (!nodes.includes(id)) nodes.push(id)
  }
  const networkOnly = (line: number): void => {
    if (rectangle !== null) sourceError(line, 'A squaring is either a rectangle with squares or a network with a battery, not both.')
    if (firstNetworkLine === 0) firstNetworkLine = line
  }
  const addWire = (from: string, to: string, line: number): void => {
    if (from === to) sourceError(line, `A wire cannot connect node "${from}" to itself.`)
    networkOnly(line)
    rememberNode(from)
    rememberNode(to)
    const key = from < to ? `${from}|${to}` : `${to}|${from}`
    if (wireKeys.has(key)) return
    wireKeys.add(key)
    wires.push({ from, to, line })
  }

  const lines = source.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = index + 1
    const text = stripComment(lines[index] ?? '').trim()
    if (text === '') continue

    if (text.startsWith('.')) {
      const [directive = '', value = '', ...rest] = text.slice(1).split(/\s+/)
      if (rest.length > 0) sourceError(line, `The .${directive} directive takes one value.`)
      if (directive === 'view') {
        if (view !== null) sourceError(line, 'The .view directive may appear only once.')
        if (!VIEWS.includes(value as SquaringView)) sourceError(line, `Unknown view "${value}". Use rectangle, circuit, overlay, or both.`)
        view = value as SquaringView
      } else if (directive === 'labels') {
        if (labels !== null) sourceError(line, 'The .labels directive may appear only once.')
        if (!LABELS.includes(value as SquaringLabels)) sourceError(line, `Unknown labels value "${value}". Use sides or none.`)
        labels = value as SquaringLabels
      } else {
        sourceError(line, `Unknown directive ".${directive}". Use .view or .labels.`)
      }
      continue
    }

    const [keyword = '', ...restTokens] = text.split(/\s+/)
    const rest = text.slice(keyword.length).trim()

    if (keyword === 'title') {
      if (rest === '') sourceError(line, 'A title needs text after the keyword.')
      title = rest.startsWith('"') && rest.endsWith('"') && rest.length >= 2 ? rest.slice(1, -1) : rest
      continue
    }

    const rectangleMatch = RECTANGLE.exec(text)
    if (rectangleMatch !== null) {
      if (rectangle !== null) sourceError(line, 'Only one rectangle may be declared.')
      if (wires.length > 0 || battery !== null) sourceError(line, 'A squaring is either a rectangle with squares or a network with a battery, not both.')
      const width = rectangleMatch[1] ?? '?'
      const height = rectangleMatch[2] ?? '?'
      rectangle = {
        width: width === '?' ? null : positiveInteger(width, line, 'The rectangle width'),
        height: height === '?' ? null : positiveInteger(height, line, 'The rectangle height'),
        groups: [],
        symbolic: false,
        line,
      }
      continue
    }

    if (keyword === 'battery') {
      if (battery !== null) sourceError(line, 'Only one battery may be declared.')
      networkOnly(line)
      if (restTokens.length === 1 && (restTokens[0] === 'any' || restTokens[0] === '?')) {
        battery = { positive: null, negative: null, search: true, line }
        continue
      }
      if (restTokens.length !== 2) sourceError(line, 'Write the battery as "battery <positive node> <negative node>" or "battery any".')
      const positive = identifier(restTokens[0] ?? '', line, 'The positive node')
      const negative = identifier(restTokens[1] ?? '', line, 'The negative node')
      if (positive === negative) sourceError(line, 'The battery needs two different nodes.')
      rememberNode(positive)
      rememberNode(negative)
      battery = { positive, negative, search: false, line }
      continue
    }

    if (keyword === 'wire') {
      if (restTokens.length !== 2) sourceError(line, 'Write a wire as "wire <node> <node>" or "<node> - <node>".')
      addWire(identifier(restTokens[0] ?? '', line, 'A node'), identifier(restTokens[1] ?? '', line, 'A node'), line)
      continue
    }

    if (keyword === 'face') {
      if (restTokens.length < 3) sourceError(line, 'A face needs at least three nodes.')
      const face = restTokens.map(node => identifier(node, line, 'A node'))
      if (new Set(face).size !== face.length) sourceError(line, 'A face cannot repeat a node.')
      face.forEach((node, position) => addWire(node, face[(position + 1) % face.length] ?? node, line))
      continue
    }

    if (keyword === 'polyhedron') {
      const name = restTokens.join(' ').trim().toLowerCase()
      const preset = POLYHEDRA[name]
      if (preset === undefined) sourceError(line, `Unknown polyhedron "${name}". Choose one of: ${POLYHEDRON_NAMES.join(', ')}.`)
      const { edges } = preset()
      for (const [from, to] of edges) addWire(from, to, line)
      continue
    }

    if (keyword === 'squares' || (rectangle !== null && looksLikeSquareLine(text))) {
      if (rectangle === null) sourceError(line, 'Declare the rectangle with "rectangle <width> x <height>" before listing squares.')
      const groups = parseSquareLine(keyword === 'squares' ? rest : text, line)
      for (const group of groups) {
        if (group.sides.some(side => Object.keys(side.terms).length > 0)) rectangle.symbolic = true
        rectangle.groups.push(group)
      }
      continue
    }

    if (CHAIN.test(text)) {
      const chain = text.split(/\s*-+\s*/).map(node => identifier(node, line, 'A node'))
      for (let position = 1; position < chain.length; position += 1) {
        addWire(chain[position - 1] ?? '', chain[position] ?? '', line)
      }
      continue
    }

    sourceError(line, `Unrecognized line "${text}". Expected a rectangle, squares, battery, wire, face, polyhedron, title, or directive.`)
  }

  if (rectangle === null && battery === null && wires.length === 0) {
    sourceError(1, 'Declare a rectangle with its squares, or a network with a battery and wires.')
  }

  if (rectangle !== null) {
    const count = rectangle.groups.reduce((sum, group) => sum + group.sides.length, 0)
    if (count === 0) sourceError(rectangle.line, 'List the squares after the rectangle.')
    if (rectangle.symbolic) {
      rectangle.groups.forEach((group, index) => {
        if (index > 0 && group.under === null) sourceError(group.line, 'In a sketch with named sides, every group after the first needs "under" to say which squares it hangs from.')
        if (index === 0 && group.under !== null) sourceError(group.line, 'The first group is the top row and cannot hang under anything.')
      })
    } else if (rectangle.groups.some(group => group.under !== null) && rectangle.groups.some(group => group.sides.some(side => side.auto))) {
      sourceError(rectangle.line, 'Use "?" sides or "under" clauses, not both.')
    }
    return { view: view ?? 'both', labels: labels ?? 'sides', title, rectangle, network: null }
  }

  if (battery === null) sourceError(firstNetworkLine, 'A network needs a battery: "battery <positive node> <negative node>" or "battery any".')
  if (wires.length === 0) sourceError(battery.line, 'A network needs at least one wire.')
  if (!battery.search) {
    const connectedToWire = new Set(wires.flatMap(wire => [wire.from, wire.to]))
    for (const pole of [battery.positive, battery.negative]) {
      if (pole !== null && !connectedToWire.has(pole)) sourceError(battery.line, `Battery node "${pole}" must be connected to at least one wire.`)
    }
  } else if (wires.length < 2) {
    sourceError(battery.line, '"battery any" needs at least two wires so one can become the battery.')
  }

  return {
    view: view ?? 'both',
    labels: labels ?? 'sides',
    title,
    rectangle: null,
    network: { positive: battery.positive, negative: battery.negative, searchBattery: battery.search, nodes, wires, line: firstNetworkLine },
  }
}
