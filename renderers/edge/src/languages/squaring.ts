import { RenderError } from '../runtime/errors'

export type SquaringView = 'rectangle' | 'circuit' | 'overlay' | 'both'
export type SquaringLabels = 'sides' | 'none'

export interface SquaringWire {
  from: string
  to: string
  line: number
}

export interface SquaringRectangleSource {
  width: number
  height: number
  sides: number[]
  line: number
}

export interface SquaringNetworkSource {
  positive: string
  negative: string
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
const CHAIN = /^[A-Za-z0-9_]+(?:\s*-+\s*[A-Za-z0-9_]+)+$/
const RECTANGLE = /^rectangle\s+(\d+)\s*(?:x|×|by)\s*(\d+)$/i
const NUMBER_LIST = /^[\d\s(),]+$/
const VIEWS: readonly SquaringView[] = ['rectangle', 'circuit', 'overlay', 'both']
const LABELS: readonly SquaringLabels[] = ['sides', 'none']

function sourceError(line: number, message: string): never {
  throw new RenderError(422, 'invalid_source', `Line ${line}: ${message}`)
}

function stripComment(raw: string): string {
  let quoted = false
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index]
    if (character === '"') quoted = !quoted
    else if (character === '#' && !quoted) return raw.slice(0, index)
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

function parseSides(text: string, line: number): number[] {
  const tokens = text.replaceAll(/[(),]/g, ' ').trim().split(/\s+/).filter(token => token !== '')
  return tokens.map(token => positiveInteger(token, line, 'Each square side'))
}

export function parseSquaring(source: string): SquaringDocument {
  let view: SquaringView | null = null
  let labels: SquaringLabels | null = null
  let title = ''
  let rectangle: SquaringRectangleSource | null = null
  let battery: { positive: string; negative: string; line: number } | null = null
  const wires: SquaringWire[] = []
  const nodes: string[] = []
  let firstNetworkLine = 0

  const rememberNode = (id: string): void => {
    if (!nodes.includes(id)) nodes.push(id)
  }
  const addWire = (from: string, to: string, line: number): void => {
    if (from === to) sourceError(line, `A wire cannot connect node "${from}" to itself.`)
    if (rectangle !== null) sourceError(line, 'A squaring is either a rectangle with squares or a network with a battery, not both.')
    if (firstNetworkLine === 0) firstNetworkLine = line
    rememberNode(from)
    rememberNode(to)
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
      rectangle = {
        width: positiveInteger(rectangleMatch[1] ?? '', line, 'The rectangle width'),
        height: positiveInteger(rectangleMatch[2] ?? '', line, 'The rectangle height'),
        sides: [],
        line,
      }
      continue
    }

    if (keyword === 'squares' || NUMBER_LIST.test(text)) {
      if (rectangle === null) sourceError(line, 'Declare the rectangle with "rectangle <width> x <height>" before listing squares.')
      const sides = parseSides(keyword === 'squares' ? rest : text, line)
      if (sides.length === 0) sourceError(line, 'List at least one square side.')
      rectangle.sides.push(...sides)
      continue
    }

    if (keyword === 'battery') {
      if (battery !== null) sourceError(line, 'Only one battery may be declared.')
      if (rectangle !== null) sourceError(line, 'A squaring is either a rectangle with squares or a network with a battery, not both.')
      if (restTokens.length !== 2) sourceError(line, 'Write the battery as "battery <positive node> <negative node>".')
      const positive = identifier(restTokens[0] ?? '', line, 'The positive node')
      const negative = identifier(restTokens[1] ?? '', line, 'The negative node')
      if (positive === negative) sourceError(line, 'The battery needs two different nodes.')
      if (firstNetworkLine === 0) firstNetworkLine = line
      rememberNode(positive)
      rememberNode(negative)
      battery = { positive, negative, line }
      continue
    }

    if (keyword === 'wire') {
      if (restTokens.length !== 2) sourceError(line, 'Write a wire as "wire <node> <node>" or "<node> - <node>".')
      addWire(identifier(restTokens[0] ?? '', line, 'A node'), identifier(restTokens[1] ?? '', line, 'A node'), line)
      continue
    }

    if (CHAIN.test(text)) {
      const chain = text.split(/\s*-+\s*/).map(node => identifier(node, line, 'A node'))
      for (let position = 1; position < chain.length; position += 1) {
        addWire(chain[position - 1] ?? '', chain[position] ?? '', line)
      }
      continue
    }

    sourceError(line, `Unrecognized line "${text}". Expected a rectangle, squares, battery, wire, title, or directive.`)
  }

  if (rectangle === null && battery === null && wires.length === 0) {
    sourceError(1, 'Declare a rectangle with its squares, or a network with a battery and wires.')
  }

  if (rectangle !== null) {
    if (rectangle.sides.length < 2) sourceError(rectangle.line, 'A squared rectangle needs at least two squares.')
    return { view: view ?? 'both', labels: labels ?? 'sides', title, rectangle, network: null }
  }

  if (battery === null) sourceError(firstNetworkLine, 'A network needs a battery: "battery <positive node> <negative node>".')
  if (wires.length === 0) sourceError(battery.line, 'A network needs at least one wire.')
  const connectedToWire = new Set(wires.flatMap(wire => [wire.from, wire.to]))
  for (const pole of [battery.positive, battery.negative]) {
    if (!connectedToWire.has(pole)) sourceError(battery.line, `Battery node "${pole}" must be connected to at least one wire.`)
  }

  return {
    view: view ?? 'both',
    labels: labels ?? 'sides',
    title,
    rectangle: null,
    network: { positive: battery.positive, negative: battery.negative, nodes, wires, line: firstNetworkLine },
  }
}
