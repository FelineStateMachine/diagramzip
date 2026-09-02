import { RenderError } from '../runtime/errors'
import type { SideExpression, SquareGroup, SquaringDocument, SquaringNetworkSource, SquaringRectangleSource, SquaringWire } from './squaring'

export interface SquaringSquare {
  index: number
  x: number
  y: number
  side: number
  top: number
  bottom: number
  label: string
}

export interface SquaringNode {
  id: string
  index: number
  y: number
  x0: number
  x1: number
  voltage: number
}

export interface SquaringBlock {
  x: number
  y: number
  width: number
  height: number
  squares: number
}

export interface BatteryCandidate {
  positive: string
  negative: string
  order: number
  width: number
  height: number
  simple: boolean
  perfect: boolean
  error: string | null
}

export interface SquaringModel {
  form: 'rectangle' | 'network'
  width: number
  height: number
  squares: SquaringSquare[]
  nodes: SquaringNode[]
  positive: number
  negative: number
  order: number
  complete: boolean
  problem: string | null
  perfect: boolean
  repeatedSides: number[]
  simple: boolean
  blocks: SquaringBlock[]
  search: BatteryCandidate[] | null
  searchIndex: number
}

const SEARCH_BUDGET = 250_000
const MAXIMUM_ORDER = 2_000
const MAXIMUM_BATTERY_SEARCH = 60

function sourceError(line: number, message: string): never {
  throw new RenderError(422, 'invalid_source', `Line ${line}: ${message}`)
}

// ---------------------------------------------------------------------------
// Exact rational arithmetic keeps Kirchhoff and Stone solutions integral.

type Fraction = { n: bigint; d: bigint }

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) [x, y] = [y, x % y]
  return x
}

function fraction(n: bigint, d = 1n): Fraction {
  if (d === 0n) throw new Error('Division by zero.')
  const sign = d < 0n ? -1n : 1n
  const divisor = gcd(n, d) || 1n
  return { n: (sign * n) / divisor, d: (sign * d) / divisor }
}

const ZERO = fraction(0n)
const add = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.n, a.d * b.d)
const div = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d, a.d * b.n)
const isZero = (a: Fraction): boolean => a.n === 0n

/** Row-reduce an augmented matrix in place; returns pivot columns. */
function reduce(matrix: Fraction[][], columns: number): number[] {
  const pivots: number[] = []
  let row = 0
  for (let column = 0; column < columns && row < matrix.length; column += 1) {
    let pivotRow = row
    while (pivotRow < matrix.length && isZero(matrix[pivotRow]?.[column] ?? ZERO)) pivotRow += 1
    if (pivotRow === matrix.length) continue
    ;[matrix[row], matrix[pivotRow]] = [matrix[pivotRow] as Fraction[], matrix[row] as Fraction[]]
    const pivotValues = matrix[row] as Fraction[]
    const pivotValue = pivotValues[column] as Fraction
    for (let index = 0; index < pivotValues.length; index += 1) pivotValues[index] = div(pivotValues[index] as Fraction, pivotValue)
    for (let other = 0; other < matrix.length; other += 1) {
      if (other === row) continue
      const values = matrix[other] as Fraction[]
      const factor = values[column] as Fraction
      if (isZero(factor)) continue
      for (let index = 0; index < values.length; index += 1) values[index] = sub(values[index] as Fraction, mul(factor, pivotValues[index] as Fraction))
    }
    pivots.push(column)
    row += 1
  }
  return pivots
}

function integerScale(values: Fraction[]): bigint[] {
  let scale = 1n
  for (const value of values) scale = (scale * value.d) / gcd(scale, value.d)
  const integral = values.map(value => (value.n * scale) / value.d)
  let reduction = 0n
  for (const value of integral) reduction = gcd(reduction, value)
  return reduction === 0n ? integral : integral.map(value => value / reduction)
}

function toSafeNumber(value: bigint, line: number): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < -BigInt(Number.MAX_SAFE_INTEGER)) {
    sourceError(line, 'The solution produces side lengths that are too large to draw.')
  }
  return Number(value)
}

// ---------------------------------------------------------------------------
// Skyline placement shared by Bouwkamp order and network arrangement.

interface Segment {
  x0: number
  x1: number
  depth: number
  node: number
}

function mergeSkyline(segments: Segment[]): Segment[] {
  const merged: Segment[] = []
  for (const segment of segments) {
    const previous = merged.at(-1)
    if (previous !== undefined && previous.depth === segment.depth && previous.node === segment.node && previous.x1 === segment.x0) {
      previous.x1 = segment.x1
    } else {
      merged.push({ ...segment })
    }
  }
  return merged
}

function lowestSegment(skyline: Segment[]): number {
  let best = 0
  for (let index = 1; index < skyline.length; index += 1) {
    if ((skyline[index]?.depth ?? Infinity) < (skyline[best]?.depth ?? Infinity)) best = index
  }
  return best
}

interface Placed {
  x: number
  y: number
  side: number
  label: string
}

interface Placement {
  width: number
  height: number
  squares: Placed[]
  problem: string | null
}

// Bouwkamp placement: every square goes to the leftmost point of the highest
// unfilled segment, in source order. A "?" square is as wide as that segment.
// Placement stops at the first square that does not fit and reports why.
function placeBouwkamp(rectangle: SquaringRectangleSource): Placement {
  const { line } = rectangle
  const sides = rectangle.groups.flatMap(group => group.sides)
  if (sides.length > MAXIMUM_ORDER) sourceError(line, `At most ${MAXIMUM_ORDER} squares are supported.`)
  let width = rectangle.width
  if (width === null) {
    const first = rectangle.groups[0]
    if (first === undefined || first.sides.some(side => side.auto)) sourceError(line, 'With an unknown width, the first group must list the top row of squares with numbers, for example "(18 15)".')
    width = first.sides.reduce((sum, side) => sum + side.constant, 0)
  }
  const height = rectangle.height ?? Infinity
  let skyline: Segment[] = [{ x0: 0, x1: width, depth: 0, node: 0 }]
  const squares: Placed[] = []
  let problem: string | null = null
  for (const [index, expression] of sides.entries()) {
    const at = lowestSegment(skyline)
    const segment = skyline[at]
    if (segment === undefined || segment.depth >= height) {
      problem = `square ${index + 1} (${expression.text}) has nowhere to go; the rectangle is already full`
      break
    }
    const room = segment.x1 - segment.x0
    const side = expression.auto ? Math.min(room, height - segment.depth) : expression.constant
    if (side > room || segment.depth + side > height) {
      problem = `square ${index + 1} (side ${side}) does not fit at column ${segment.x0}, row ${segment.depth}; only ${room} × ${height === Infinity ? '∞' : height - segment.depth} is free there`
      break
    }
    squares.push({ x: segment.x0, y: segment.depth, side, label: String(side) })
    const replacement: Segment[] = [{ x0: segment.x0, x1: segment.x0 + side, depth: segment.depth + side, node: 0 }]
    if (segment.x0 + side < segment.x1) replacement.push({ x0: segment.x0 + side, x1: segment.x1, depth: segment.depth, node: 0 })
    skyline = mergeSkyline([...skyline.slice(0, at), ...replacement, ...skyline.slice(at + 1)])
  }
  const deepest = Math.max(...skyline.map(segment => segment.depth))
  const finalHeight = height === Infinity ? deepest : height
  if (problem === null && skyline.some(segment => segment.depth !== finalHeight)) {
    const gap = skyline[lowestSegment(skyline)]
    problem = `the squares do not fill the rectangle; the first gap is at column ${gap?.x0 ?? 0}, row ${gap?.depth ?? 0}`
  }
  return { width, height: finalHeight, squares, problem }
}

// ---------------------------------------------------------------------------
// Stone sketches: sides are linear expressions and each group names the
// squares it hangs under. The geometry gives a linear system whose one-
// dimensional solution is the squaring.

type Form = Map<string, Fraction>

const CONSTANT = '$1'
const WIDTH = '$W'
const HEIGHT = '$H'

function formOf(expression: SideExpression): Form {
  const form: Form = new Map()
  if (expression.constant !== 0) form.set(CONSTANT, fraction(BigInt(expression.constant)))
  for (const [symbol, coefficient] of Object.entries(expression.terms)) form.set(symbol, fraction(BigInt(coefficient)))
  return form
}

function addForms(a: Form, b: Form, sign = 1n): Form {
  const result: Form = new Map(a)
  for (const [key, value] of b) {
    const next = add(result.get(key) ?? ZERO, mul(value, fraction(sign)))
    if (isZero(next)) result.delete(key)
    else result.set(key, next)
  }
  return result
}

function solveSketch(rectangle: SquaringRectangleSource): Placement {
  const { groups, line } = rectangle
  const sides = groups.flatMap(group => group.sides)
  if (sides.length > MAXIMUM_ORDER) sourceError(line, `At most ${MAXIMUM_ORDER} squares are supported.`)
  const groupOf = groups.flatMap((group, index) => group.sides.map(() => index))
  const sideForms = sides.map(formOf)
  const xForms: Form[] = []
  const yForms: Form[] = []
  const equations: Form[] = []
  const usedAsBase = new Map<number, number>()

  const resolve = (ref: string, group: SquareGroup, limit: number): number => {
    let matches: number[]
    if (ref.startsWith('#')) {
      const index = Number(ref.slice(1)) - 1
      matches = index >= 0 && index < sides.length ? [index] : []
    } else if (/^\d+$/.test(ref)) {
      matches = sides.flatMap((side, index) => Object.keys(side.terms).length === 0 && side.constant === Number(ref) ? [index] : [])
    } else {
      matches = sides.flatMap((side, index) => side.constant === 0 && Object.keys(side.terms).length === 1 && side.terms[ref] === 1 ? [index] : [])
    }
    if (matches.length === 0) sourceError(group.line, `"under ${ref}" does not name any square listed so far.`)
    if (matches.length > 1) sourceError(group.line, `"under ${ref}" is ambiguous; use #n to pick the n-th square.`)
    const index = matches[0] ?? 0
    if (index >= limit) sourceError(group.line, `"under ${ref}" refers to a square that is listed later; list the squares above first.`)
    return index
  }

  let cursor = 0
  groups.forEach((group, groupIndex) => {
    const first = cursor
    let x: Form
    let y: Form
    if (groupIndex === 0) {
      x = new Map()
      y = new Map()
    } else {
      const refs = (group.under ?? []).map(ref => resolve(ref, group, first))
      for (const [position, ref] of refs.entries()) {
        const previousUse = usedAsBase.get(ref)
        if (previousUse !== undefined) sourceError(group.line, `Square ${sides[ref]?.text ?? ref} already has a group under it (line ${previousUse}).`)
        usedAsBase.set(ref, group.line)
        if (position > 0) {
          const left = refs[position - 1] ?? ref
          // Consecutive base squares share a bottom edge and touch side by side.
          equations.push(addForms(addForms(yForms[left] ?? new Map(), sideForms[left] ?? new Map()), addForms(yForms[ref] ?? new Map(), sideForms[ref] ?? new Map()), -1n))
          equations.push(addForms(addForms(xForms[left] ?? new Map(), sideForms[left] ?? new Map()), xForms[ref] ?? new Map(), -1n))
        }
      }
      const base = refs[0] ?? 0
      x = xForms[base] ?? new Map()
      y = addForms(yForms[base] ?? new Map(), sideForms[base] ?? new Map())
      // The group is exactly as wide as the run of base squares.
      let runWidth: Form = new Map()
      for (const ref of refs) runWidth = addForms(runWidth, sideForms[ref] ?? new Map())
      let groupWidth: Form = new Map()
      for (const side of group.sides) groupWidth = addForms(groupWidth, formOf(side))
      equations.push(addForms(groupWidth, runWidth, -1n))
    }
    for (const side of group.sides) {
      xForms.push(x)
      yForms.push(y)
      x = addForms(x, formOf(side))
      cursor += 1
    }
  })

  // The top row spans the width; every square without anything under it rests on the bottom edge.
  const widthForm: Form = rectangle.width === null ? new Map([[WIDTH, fraction(1n)]]) : new Map([[CONSTANT, fraction(BigInt(rectangle.width))]])
  const heightForm: Form = rectangle.height === null ? new Map([[HEIGHT, fraction(1n)]]) : new Map([[CONSTANT, fraction(BigInt(rectangle.height))]])
  let topRow: Form = new Map()
  for (const side of groups[0]?.sides ?? []) topRow = addForms(topRow, formOf(side))
  equations.push(addForms(topRow, widthForm, -1n))
  sides.forEach((_, index) => {
    if (usedAsBase.has(index)) return
    equations.push(addForms(addForms(yForms[index] ?? new Map(), sideForms[index] ?? new Map()), heightForm, -1n))
  })

  const unknowns = [...new Set([...equations.flatMap(form => [...form.keys()]), ...sideForms.flatMap(form => [...form.keys()])])].filter(key => key !== CONSTANT).sort()
  const column = new Map(unknowns.map((name, index) => [name, index]))
  const homogeneous = equations.every(form => !form.has(CONSTANT))
  const matrix = equations.map(form => {
    const row = unknowns.map(() => ZERO)
    for (const [key, value] of form) {
      const index = column.get(key)
      if (index !== undefined) row[index] = value
    }
    row.push(mul(form.get(CONSTANT) ?? ZERO, fraction(-1n)))
    return row
  })
  const pivots = reduce(matrix, unknowns.length)
  const free = unknowns.filter((_, index) => !pivots.includes(index))
  const inconsistent = matrix.some(row => row.slice(0, unknowns.length).every(isZero) && !isZero(row[unknowns.length] ?? ZERO))
  if (inconsistent) sourceError(line, 'The sketch cannot close: its equations contradict each other. Check the "under" clauses and any given numbers.')

  const values = new Map<string, Fraction>()
  if (homogeneous) {
    if (free.length !== 1) {
      sourceError(line, free.length === 0
        ? 'The sketch only closes when every side is zero. Check the "under" clauses.'
        : `The sketch has ${free.length} free lengths (${free.join(', ')}); give a number for ${free.length - 1} of them or add a group that ties them together.`)
    }
    const freeName = free[0] ?? ''
    values.set(freeName, fraction(1n))
    pivots.forEach((columnIndex, rowIndex) => {
      const row = matrix[rowIndex] as Fraction[]
      const freeIndex = column.get(freeName) ?? 0
      values.set(unknowns[columnIndex] ?? '', mul(row[freeIndex] ?? ZERO, fraction(-1n)))
    })
  } else {
    if (free.length > 0) sourceError(line, `The sketch has ${free.length} free ${free.length === 1 ? 'length' : 'lengths'} (${free.join(', ')}); give a number for ${free.length === 1 ? 'it' : 'all but one'} or add a group that ties them together.`)
    pivots.forEach((columnIndex, rowIndex) => {
      values.set(unknowns[columnIndex] ?? '', (matrix[rowIndex] as Fraction[])[unknowns.length] ?? ZERO)
    })
  }

  const evaluate = (form: Form): Fraction => {
    let total = form.get(CONSTANT) ?? ZERO
    for (const [key, value] of form) {
      if (key === CONSTANT) continue
      total = add(total, mul(value, values.get(key) ?? ZERO))
    }
    return total
  }

  let width = evaluate(widthForm)
  let height = evaluate(heightForm)
  let sideValues = sideForms.map(evaluate)
  let xValues = xForms.map(evaluate)
  let yValues = yForms.map(evaluate)
  if (homogeneous) {
    // Scale the one-dimensional solution to the smallest positive integers.
    const scaled = integerScale([width, height, ...sideValues, ...xValues, ...yValues])
    const sign = (scaled[0] ?? 0n) < 0n ? -1n : 1n
    const [w = 0n, h = 0n, ...rest] = scaled.map(value => value * sign)
    width = fraction(w)
    height = fraction(h)
    sideValues = rest.slice(0, sides.length).map(value => fraction(value))
    xValues = rest.slice(sides.length, sides.length * 2).map(value => fraction(value))
    yValues = rest.slice(sides.length * 2).map(value => fraction(value))
  } else {
    const fractional = [width, height, ...sideValues].find(value => value.d !== 1n)
    if (fractional !== undefined) sourceError(line, `The given numbers force a side of ${fractional.n}/${fractional.d}; adjust them so every side is a whole number.`)
  }
  const bad = sideValues.findIndex(value => value.n <= 0n)
  if (bad >= 0) sourceError(line, `The sketch closes only if square ${bad + 1} (${sides[bad]?.text ?? ''}) has side ${sideValues[bad]?.n ?? 0n}; check the "under" clauses.`)

  const squares: Placed[] = sides.map((side, index) => ({
    x: toSafeNumber(xValues[index]?.n ?? 0n, line),
    y: toSafeNumber(yValues[index]?.n ?? 0n, line),
    side: toSafeNumber(sideValues[index]?.n ?? 0n, line),
    label: Object.keys(side.terms).length === 0 ? String(sideValues[index]?.n ?? 0n) : `${side.text}=${sideValues[index]?.n ?? 0n}`,
  }))
  const widthNumber = toSafeNumber(width.n, line)
  const heightNumber = toSafeNumber(height.n, line)
  return { width: widthNumber, height: heightNumber, squares, problem: tilingProblem(squares, widthNumber, heightNumber) }
}

function tilingProblem(squares: Placed[], width: number, height: number): string | null {
  for (const [index, square] of squares.entries()) {
    if (square.x < 0 || square.y < 0 || square.x + square.side > width || square.y + square.side > height) {
      return `square ${index + 1} (${square.label}) sticks out of the ${width} × ${height} rectangle`
    }
    for (const [otherIndex, other] of squares.entries()) {
      if (otherIndex <= index) continue
      if (square.x < other.x + other.side && other.x < square.x + square.side && square.y < other.y + other.side && other.y < square.y + square.side) {
        return `squares ${index + 1} (${square.label}) and ${otherIndex + 1} (${other.label}) overlap`
      }
    }
  }
  const area = squares.reduce((sum, square) => sum + square.side * square.side, 0)
  if (area !== width * height) return `the squares cover ${area} of the ${width * height} area; the sketch leaves a gap`
  return null
}

// ---------------------------------------------------------------------------
// Smith diagram from geometry: every maximal horizontal segment is a node.

function nodesFromGeometry(squares: Placed[], width: number, height: number): { nodes: SquaringNode[]; topOf: number[]; bottomOf: number[] } {
  const intervals = new Map<number, Array<[number, number]>>()
  const addInterval = (y: number, x0: number, x1: number): void => {
    const list = intervals.get(y) ?? []
    list.push([x0, x1])
    intervals.set(y, list)
  }
  addInterval(0, 0, width)
  addInterval(height, 0, width)
  for (const square of squares) {
    addInterval(square.y, square.x, square.x + square.side)
    addInterval(square.y + square.side, square.x, square.x + square.side)
  }
  const nodes: SquaringNode[] = []
  for (const y of [...intervals.keys()].sort((a, b) => a - b)) {
    const list = (intervals.get(y) ?? []).sort((a, b) => a[0] - b[0])
    let current: [number, number] | null = null
    const flush = (): void => {
      if (current === null) return
      nodes.push({ id: '', index: nodes.length, y, x0: current[0], x1: current[1], voltage: height - y })
      current = null
    }
    for (const [x0, x1] of list) {
      if (current !== null && x0 <= current[1]) current[1] = Math.max(current[1], x1)
      else {
        flush()
        current = [x0, x1]
      }
    }
    flush()
  }
  nodes.forEach((node, index) => {
    node.id = index === 0 ? 'top' : index === nodes.length - 1 ? 'bottom' : `n${index}`
  })
  const find = (y: number, x: number): number => {
    const node = nodes.find(candidate => candidate.y === y && candidate.x0 <= x && x < candidate.x1)
    if (node === undefined) throw new RenderError(422, 'invalid_source', `No horizontal segment contains column ${x} at row ${y}.`)
    return node.index
  }
  return {
    nodes,
    topOf: squares.map(square => find(square.y, square.x)),
    bottomOf: squares.map(square => find(square.y + square.side, square.x)),
  }
}

// ---------------------------------------------------------------------------
// Networks: solve Kirchhoff and Ohm exactly, then arrange the squares.

interface SolvedNetwork {
  voltages: number[]
  currents: number[]
}

interface Battery {
  positive: string
  negative: string
}

function solveNetwork(nodes: string[], wires: SquaringWire[], battery: Battery, line: number): SolvedNetwork {
  const indexOf = new Map(nodes.map((id, index) => [id, index]))
  const positiveIndex = indexOf.get(battery.positive) ?? 0
  const negativeIndex = indexOf.get(battery.negative) ?? 0
  const interior = nodes.map((_, index) => index).filter(index => index !== positiveIndex && index !== negativeIndex)
  const column = new Map(interior.map((node, position) => [node, position]))
  const size = interior.length

  const matrix: Fraction[][] = interior.map(() => [...interior.map(() => ZERO), ZERO])
  for (const wire of wires) {
    const a = indexOf.get(wire.from) ?? 0
    const b = indexOf.get(wire.to) ?? 0
    for (const [self, other] of [[a, b], [b, a]] as const) {
      const row = column.get(self)
      if (row === undefined) continue
      const rowValues = matrix[row] as Fraction[]
      rowValues[row] = add(rowValues[row] ?? ZERO, fraction(1n))
      const otherColumn = column.get(other)
      if (otherColumn !== undefined) rowValues[otherColumn] = sub(rowValues[otherColumn] ?? ZERO, fraction(1n))
      else if (other === positiveIndex) rowValues[size] = add(rowValues[size] ?? ZERO, fraction(1n))
    }
  }
  const pivots = reduce(matrix, size)
  if (pivots.length !== size) sourceError(line, 'The network is not connected: every node must have a wire path to both battery nodes.')

  const solution: Fraction[] = nodes.map(() => ZERO)
  solution[positiveIndex] = fraction(1n)
  interior.forEach((node, position) => {
    solution[node] = (matrix[position] as Fraction[])[size] ?? ZERO
  })
  const integral = integerScale(solution)
  const currentValues = wires.map(wire => (integral[indexOf.get(wire.from) ?? 0] ?? 0n) - (integral[indexOf.get(wire.to) ?? 0] ?? 0n))
  if (currentValues.every(value => value === 0n)) sourceError(line, 'No current flows through the network.')
  return { voltages: integral.map(value => toSafeNumber(value, line)), currents: currentValues.map(value => toSafeNumber(value, line)) }
}

interface OrientedWire {
  index: number
  from: number
  to: number
  side: number
}

function distinctPermutations<T>(items: T[], key: (item: T) => string): T[][] {
  const sorted = [...items].sort((a, b) => key(a).localeCompare(key(b)))
  const results: T[][] = []
  const used = sorted.map(() => false)
  const current: T[] = []
  const walk = (): void => {
    if (current.length === sorted.length) {
      results.push([...current])
      return
    }
    let previous: string | null = null
    sorted.forEach((item, index) => {
      if (used[index]) return
      const itemKey = key(item)
      if (itemKey === previous) return
      previous = itemKey
      used[index] = true
      current.push(item)
      walk()
      current.pop()
      used[index] = false
    })
  }
  walk()
  return results
}

interface Arranged {
  width: number
  height: number
  squares: SquaringSquare[]
  nodes: SquaringNode[]
  positive: number
  negative: number
}

// Rebuild the dissection from the circuit: fill the rectangle top-down, and at
// every horizontal segment try each left-to-right order of the squares that
// hang from it. Polyhedral networks admit one arrangement up to mirroring.
function arrangeNetwork(nodes: string[], wires: SquaringWire[], battery: Battery, solved: SolvedNetwork, line: number): Arranged {
  const indexOf = new Map(nodes.map((id, index) => [id, index]))
  const positiveIndex = indexOf.get(battery.positive) ?? 0
  const negativeIndex = indexOf.get(battery.negative) ?? 0
  const oriented: OrientedWire[] = wires.map((wire, index) => {
    const a = indexOf.get(wire.from) ?? 0
    const b = indexOf.get(wire.to) ?? 0
    const current = solved.currents[index] ?? 0
    if (current === 0) {
      sourceError(wire.line, `Wire ${wire.from} - ${wire.to} carries no current because both nodes settle at the same voltage, so it cannot become a square. Choose a different battery.`)
    }
    return current > 0 ? { index, from: a, to: b, side: current } : { index, from: b, to: a, side: -current }
  })
  const outgoing = nodes.map<OrientedWire[]>(() => [])
  const inflow = nodes.map(() => 0)
  for (const wire of oriented) {
    outgoing[wire.from]?.push(wire)
    inflow[wire.to] = (inflow[wire.to] ?? 0) + wire.side
  }
  const width = outgoing[positiveIndex]?.reduce((sum, wire) => sum + wire.side, 0) ?? 0
  const height = solved.voltages[positiveIndex] ?? 0
  const placement = new Map<number, { x: number; y: number }>()
  let budget = SEARCH_BUDGET

  const search = (skyline: Segment[]): boolean => {
    budget -= 1
    if (budget < 0) sourceError(line, 'The network has too many possible arrangements to explore. Choose a battery on the outer face of a polyhedral network.')
    const at = lowestSegment(skyline)
    const segment = skyline[at]
    if (segment === undefined) return false
    if (segment.depth >= height) return true
    const node = segment.node
    if (node === negativeIndex) return false
    let start = at
    while (start > 0 && skyline[start - 1]?.depth === segment.depth && skyline[start - 1]?.node === node) start -= 1
    let end = at
    while (end + 1 < skyline.length && skyline[end + 1]?.depth === segment.depth && skyline[end + 1]?.node === node) end += 1
    const x0 = skyline[start]?.x0 ?? 0
    const x1 = skyline[end]?.x1 ?? 0
    const hanging = outgoing[node] ?? []
    const outflow = hanging.reduce((sum, wire) => sum + wire.side, 0)
    if (x1 - x0 !== outflow) return false
    for (const order of distinctPermutations(hanging, wire => `${wire.side}:${wire.to}`)) {
      const replacement: Segment[] = []
      let x = x0
      for (const wire of order) {
        placement.set(wire.index, { x, y: segment.depth })
        replacement.push({ x0: x, x1: x + wire.side, depth: segment.depth + wire.side, node: wire.to })
        x += wire.side
      }
      if (search(mergeSkyline([...skyline.slice(0, start), ...replacement, ...skyline.slice(end + 1)]))) return true
      for (const wire of order) placement.delete(wire.index)
    }
    return false
  }

  if (!search([{ x0: 0, x1: width, depth: 0, node: positiveIndex }])) {
    sourceError(line, `The network cannot be arranged into a squared rectangle with the battery between ${battery.positive} and ${battery.negative}. Check that the wires form a planar network and try another battery.`)
  }

  const squares: SquaringSquare[] = oriented.map(wire => {
    const at = placement.get(wire.index) ?? { x: 0, y: 0 }
    return { index: wire.index, x: at.x, y: at.y, side: wire.side, top: wire.from, bottom: wire.to, label: String(wire.side) }
  })
  const x0 = nodes.map(() => Infinity)
  for (const square of squares) x0[square.bottom] = Math.min(x0[square.bottom] ?? Infinity, square.x)
  x0[positiveIndex] = 0
  const modelNodes: SquaringNode[] = nodes.map((id, index) => {
    const voltage = solved.voltages[index] ?? 0
    const left = x0[index] === Infinity ? 0 : (x0[index] ?? 0)
    const span = index === positiveIndex ? width : inflow[index] ?? 0
    return { id, index, y: height - voltage, x0: left, x1: left + span, voltage }
  })
  return { width, height, squares, nodes: modelNodes, positive: positiveIndex, negative: negativeIndex }
}

// ---------------------------------------------------------------------------
// Analysis: perfect (no repeated side) and simple (no compound block).

function findBlocks(squares: SquaringSquare[], width: number, height: number): SquaringBlock[] {
  const xs = [...new Set(squares.flatMap(square => [square.x, square.x + square.side]))].sort((a, b) => a - b)
  const ys = [...new Set(squares.flatMap(square => [square.y, square.y + square.side]))].sort((a, b) => a - b)
  const blocks: SquaringBlock[] = []
  for (let left = 0; left < xs.length; left += 1) {
    const x0 = xs[left] ?? 0
    for (let right = left + 1; right < xs.length; right += 1) {
      const x1 = xs[right] ?? 0
      const overlapping = squares.filter(square => square.x < x1 && square.x + square.side > x0)
      const straddlers = overlapping.filter(square => square.x < x0 || square.x + square.side > x1)
      const inside = overlapping.filter(square => square.x >= x0 && square.x + square.side <= x1)
      const clean = ys.filter(y => !overlapping.some(square => square.y < y && square.y + square.side > y))
      for (const y0 of clean) {
        let limit = height
        for (const square of straddlers) {
          if (square.y + square.side > y0) limit = Math.min(limit, square.y)
        }
        for (const y1 of clean) {
          if (y1 <= y0) continue
          if (y1 > limit) break
          if (x0 === 0 && x1 === width && y0 === 0 && y1 === height) continue
          const count = inside.filter(square => square.y >= y0 && square.y + square.side <= y1).length
          if (count >= 2) blocks.push({ x: x0, y: y0, width: x1 - x0, height: y1 - y0, squares: count })
        }
      }
    }
  }
  const contains = (outer: SquaringBlock, inner: SquaringBlock): boolean =>
    outer !== inner && outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.width >= inner.x + inner.width && outer.y + outer.height >= inner.y + inner.height
  return blocks.filter(block => !blocks.some(other => contains(other, block)))
}

interface AnalysisInput {
  form: 'rectangle' | 'network'
  width: number
  height: number
  squares: SquaringSquare[]
  nodes: SquaringNode[]
  positive: number
  negative: number
  problem: string | null
  search?: BatteryCandidate[] | null
  searchIndex?: number
}

function analyse(input: AnalysisInput): SquaringModel {
  const complete = input.problem === null
  const counts = new Map<number, number>()
  for (const square of input.squares) counts.set(square.side, (counts.get(square.side) ?? 0) + 1)
  const repeatedSides = [...counts.entries()].filter(([, count]) => count > 1).map(([side]) => side).sort((a, b) => a - b)
  const blocks = complete ? findBlocks(input.squares, input.width, input.height) : []
  return {
    form: input.form,
    width: input.width,
    height: input.height,
    squares: input.squares,
    nodes: input.nodes,
    positive: input.positive,
    negative: input.negative,
    order: input.squares.length,
    complete,
    problem: input.problem,
    perfect: repeatedSides.length === 0,
    repeatedSides,
    simple: complete && blocks.length === 0,
    blocks,
    search: input.search ?? null,
    searchIndex: input.searchIndex ?? -1,
  }
}

function fromPlacement(placement: Placement): SquaringModel {
  const { width, height, problem } = placement
  if (problem !== null) {
    const squares = placement.squares.map((square, index) => ({ index, ...square, top: -1, bottom: -1 }))
    return analyse({ form: 'rectangle', width, height, squares, nodes: [], positive: -1, negative: -1, problem })
  }
  const { nodes, topOf, bottomOf } = nodesFromGeometry(placement.squares, width, height)
  const squares = placement.squares.map((square, index) => ({ index, ...square, top: topOf[index] ?? 0, bottom: bottomOf[index] ?? 0 }))
  return analyse({ form: 'rectangle', width, height, squares, nodes, positive: 0, negative: nodes.length - 1, problem: null })
}

function solveBattery(network: SquaringNetworkSource, wires: SquaringWire[], battery: Battery): SquaringModel {
  const solved = solveNetwork(network.nodes, wires, battery, network.line)
  const arranged = arrangeNetwork(network.nodes, wires, battery, solved, network.line)
  return analyse({ form: 'network', ...arranged, problem: null })
}

function rank(model: SquaringModel): number {
  return (model.simple ? 2 : 0) + (model.perfect ? 1 : 0)
}

function searchBatteries(network: SquaringNetworkSource): SquaringModel {
  if (network.wires.length > MAXIMUM_BATTERY_SEARCH) sourceError(network.line, `"battery any" tries every wire, so the network can have at most ${MAXIMUM_BATTERY_SEARCH} wires.`)
  const candidates: BatteryCandidate[] = []
  let best: SquaringModel | null = null
  let bestIndex = -1
  network.wires.forEach((wire, index) => {
    const rest = network.wires.filter((_, other) => other !== index)
    const battery = { positive: wire.from, negative: wire.to }
    try {
      const model = solveBattery(network, rest, battery)
      candidates.push({ ...battery, order: model.order, width: model.width, height: model.height, simple: model.simple, perfect: model.perfect, error: null })
      const better = best === null
        || rank(model) > rank(best)
        || (rank(model) === rank(best) && model.width * model.height < best.width * best.height)
      if (better) {
        best = model
        bestIndex = candidates.length - 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^Line \d+: /, '') : String(error)
      candidates.push({ ...battery, order: rest.length, width: 0, height: 0, simple: false, perfect: false, error: message })
    }
  })
  if (best === null) {
    sourceError(network.line, `No wire works as the battery. ${candidates[0]?.error ?? ''}`.trim())
  }
  const chosen: SquaringModel = best
  return { ...chosen, search: candidates, searchIndex: bestIndex }
}

export function buildSquaring(document: SquaringDocument): SquaringModel {
  if (document.rectangle !== null) {
    const rectangle = document.rectangle
    return fromPlacement(rectangle.symbolic ? solveSketch(rectangle) : placeBouwkamp(rectangle))
  }
  if (document.network === null) throw new RenderError(422, 'invalid_source', 'The squaring source is empty.')
  const network = document.network
  if (network.wires.length > MAXIMUM_ORDER) sourceError(network.line, `At most ${MAXIMUM_ORDER} wires are supported.`)
  if (network.searchBattery) return searchBatteries(network)
  return solveBattery(network, network.wires, { positive: network.positive ?? '', negative: network.negative ?? '' })
}
