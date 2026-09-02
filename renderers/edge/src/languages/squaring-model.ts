import { RenderError } from '../runtime/errors'
import type { SquaringDocument, SquaringNetworkSource, SquaringRectangleSource } from './squaring'

export interface SquaringSquare {
  index: number
  x: number
  y: number
  side: number
  top: number
  bottom: number
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

export interface SquaringModel {
  form: 'rectangle' | 'network'
  width: number
  height: number
  squares: SquaringSquare[]
  nodes: SquaringNode[]
  positive: number
  negative: number
  order: number
  perfect: boolean
  repeatedSides: number[]
  simple: boolean
  blocks: SquaringBlock[]
}

const SEARCH_BUDGET = 250_000
const MAXIMUM_ORDER = 2_000

function sourceError(line: number, message: string): never {
  throw new RenderError(422, 'invalid_source', `Line ${line}: ${message}`)
}

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

// Bouwkamp placement: every square goes to the leftmost point of the highest
// unfilled horizontal segment, in source order.
function placeBouwkamp(rectangle: SquaringRectangleSource): Array<{ x: number; y: number; side: number }> {
  const { width, height, sides, line } = rectangle
  if (sides.length > MAXIMUM_ORDER) sourceError(line, `At most ${MAXIMUM_ORDER} squares are supported.`)
  const area = sides.reduce((sum, side) => sum + side * side, 0)
  if (area !== width * height) {
    sourceError(line, `The squares cover an area of ${area}, but a ${width} × ${height} rectangle has area ${width * height}.`)
  }
  let skyline: Segment[] = [{ x0: 0, x1: width, depth: 0, node: 0 }]
  const placed: Array<{ x: number; y: number; side: number }> = []
  sides.forEach((side, index) => {
    const at = lowestSegment(skyline)
    const segment = skyline[at]
    if (segment === undefined) sourceError(line, 'The rectangle is already full.')
    if (segment.x0 + side > segment.x1 || segment.depth + side > height) {
      sourceError(line, `Square ${index + 1} (side ${side}) does not fit at column ${segment.x0}, row ${segment.depth}; only ${segment.x1 - segment.x0} × ${height - segment.depth} is free there.`)
    }
    placed.push({ x: segment.x0, y: segment.depth, side })
    const replacement: Segment[] = [{ x0: segment.x0, x1: segment.x0 + side, depth: segment.depth + side, node: 0 }]
    if (segment.x0 + side < segment.x1) replacement.push({ x0: segment.x0 + side, x1: segment.x1, depth: segment.depth, node: 0 })
    skyline = mergeSkyline([...skyline.slice(0, at), ...replacement, ...skyline.slice(at + 1)])
  })
  return placed
}

// Every maximal horizontal segment of the dissection is a node of the Smith
// diagram; its voltage is the height of the segment above the bottom edge.
function nodesFromGeometry(squares: Array<{ x: number; y: number; side: number }>, width: number, height: number): {
  nodes: SquaringNode[]
  topOf: number[]
  bottomOf: number[]
} {
  const intervals = new Map<number, Array<[number, number]>>()
  const add = (y: number, x0: number, x1: number): void => {
    const list = intervals.get(y) ?? []
    list.push([x0, x1])
    intervals.set(y, list)
  }
  add(0, 0, width)
  add(height, 0, width)
  for (const square of squares) {
    add(square.y, square.x, square.x + square.side)
    add(square.y + square.side, square.x, square.x + square.side)
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

// Exact rational arithmetic keeps the Kirchhoff solution integral after scaling.
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

const add = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d + b.n * a.d, a.d * b.d)
const sub = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d - b.n * a.d, a.d * b.d)
const mul = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.n, a.d * b.d)
const div = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d, a.d * b.n)

interface SolvedNetwork {
  voltages: number[]
  currents: number[]
}

function solveNetwork(network: SquaringNetworkSource): SolvedNetwork {
  const { nodes, wires, positive, negative, line } = network
  const indexOf = new Map(nodes.map((id, index) => [id, index]))
  const positiveIndex = indexOf.get(positive) ?? 0
  const negativeIndex = indexOf.get(negative) ?? 0
  const interior = nodes.map((_, index) => index).filter(index => index !== positiveIndex && index !== negativeIndex)
  const column = new Map(interior.map((node, position) => [node, position]))
  const size = interior.length

  const matrix: Fraction[][] = interior.map(() => interior.map(() => fraction(0n)))
  const rhs: Fraction[] = interior.map(() => fraction(0n))
  for (const wire of wires) {
    const a = indexOf.get(wire.from) ?? 0
    const b = indexOf.get(wire.to) ?? 0
    for (const [self, other] of [[a, b], [b, a]] as const) {
      const row = column.get(self)
      if (row === undefined) continue
      const rowValues = matrix[row]
      if (rowValues === undefined) continue
      rowValues[row] = add(rowValues[row] ?? fraction(0n), fraction(1n))
      const otherColumn = column.get(other)
      if (otherColumn !== undefined) rowValues[otherColumn] = sub(rowValues[otherColumn] ?? fraction(0n), fraction(1n))
      else if (other === positiveIndex) rhs[row] = add(rhs[row] ?? fraction(0n), fraction(1n))
    }
  }

  // Gaussian elimination with exact fractions.
  for (let pivot = 0; pivot < size; pivot += 1) {
    let pivotRow = pivot
    while (pivotRow < size && (matrix[pivotRow]?.[pivot]?.n ?? 0n) === 0n) pivotRow += 1
    if (pivotRow === size) {
      sourceError(line, 'The network is not connected: every node must have a wire path to both battery nodes.')
    }
    if (pivotRow !== pivot) {
      ;[matrix[pivot], matrix[pivotRow]] = [matrix[pivotRow] as Fraction[], matrix[pivot] as Fraction[]]
      ;[rhs[pivot], rhs[pivotRow]] = [rhs[pivotRow] as Fraction, rhs[pivot] as Fraction]
    }
    const pivotValues = matrix[pivot] as Fraction[]
    const pivotValue = pivotValues[pivot] as Fraction
    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue
      const rowValues = matrix[row] as Fraction[]
      const factor = div(rowValues[pivot] as Fraction, pivotValue)
      if (factor.n === 0n) continue
      for (let col = pivot; col < size; col += 1) {
        rowValues[col] = sub(rowValues[col] as Fraction, mul(factor, pivotValues[col] as Fraction))
      }
      rhs[row] = sub(rhs[row] as Fraction, mul(factor, rhs[pivot] as Fraction))
    }
  }

  const solution: Fraction[] = nodes.map(() => fraction(0n))
  solution[positiveIndex] = fraction(1n)
  interior.forEach((node, position) => {
    solution[node] = div(rhs[position] as Fraction, (matrix[position] as Fraction[])[position] as Fraction)
  })

  let scale = 1n
  for (const value of solution) scale = (scale * value.d) / gcd(scale, value.d)
  const integral = solution.map(value => (value.n * scale) / value.d)
  const currentValues = wires.map(wire => (integral[indexOf.get(wire.from) ?? 0] ?? 0n) - (integral[indexOf.get(wire.to) ?? 0] ?? 0n))
  let reduction = 0n
  for (const current of currentValues) reduction = gcd(reduction, current)
  if (reduction === 0n) sourceError(line, 'No current flows through the network.')
  const toNumber = (value: bigint): number => {
    const reduced = value / reduction
    if (reduced > BigInt(Number.MAX_SAFE_INTEGER) || reduced < -BigInt(Number.MAX_SAFE_INTEGER)) {
      sourceError(line, 'The network produces square sides that are too large to draw.')
    }
    return Number(reduced)
  }
  return { voltages: integral.map(toNumber), currents: currentValues.map(toNumber) }
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

// Rebuild the dissection from the circuit: fill the rectangle top-down, and at
// every horizontal segment try each left-to-right order of the squares that
// hang from it. Polyhedral networks admit one arrangement up to mirroring.
function arrangeNetwork(network: SquaringNetworkSource, solved: SolvedNetwork): { squares: SquaringSquare[]; nodes: SquaringNode[]; positive: number; negative: number } {
  const { nodes, wires, positive, negative, line } = network
  const indexOf = new Map(nodes.map((id, index) => [id, index]))
  const positiveIndex = indexOf.get(positive) ?? 0
  const negativeIndex = indexOf.get(negative) ?? 0
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
    sourceError(line, `The network cannot be arranged into a squared rectangle with the battery between ${positive} and ${negative}. Check that the wires form a planar network and try another battery.`)
  }

  const squares: SquaringSquare[] = oriented.map(wire => {
    const at = placement.get(wire.index) ?? { x: 0, y: 0 }
    return { index: wire.index, x: at.x, y: at.y, side: wire.side, top: wire.from, bottom: wire.to }
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
  return { squares, nodes: modelNodes, positive: positiveIndex, negative: negativeIndex }
}

// A compound block is a proper sub-rectangle tiled by at least two squares.
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

function analyse(form: 'rectangle' | 'network', width: number, height: number, squares: SquaringSquare[], nodes: SquaringNode[], positive: number, negative: number): SquaringModel {
  const counts = new Map<number, number>()
  for (const square of squares) counts.set(square.side, (counts.get(square.side) ?? 0) + 1)
  const repeatedSides = [...counts.entries()].filter(([, count]) => count > 1).map(([side]) => side).sort((a, b) => a - b)
  const blocks = findBlocks(squares, width, height)
  return {
    form,
    width,
    height,
    squares,
    nodes,
    positive,
    negative,
    order: squares.length,
    perfect: repeatedSides.length === 0,
    repeatedSides,
    simple: blocks.length === 0,
    blocks,
  }
}

export function buildSquaring(document: SquaringDocument): SquaringModel {
  if (document.rectangle !== null) {
    const rectangle = document.rectangle
    const placed = placeBouwkamp(rectangle)
    const { nodes, topOf, bottomOf } = nodesFromGeometry(placed, rectangle.width, rectangle.height)
    const squares = placed.map((square, index) => ({ index, ...square, top: topOf[index] ?? 0, bottom: bottomOf[index] ?? 0 }))
    return analyse('rectangle', rectangle.width, rectangle.height, squares, nodes, 0, nodes.length - 1)
  }
  if (document.network === null) throw new RenderError(422, 'invalid_source', 'The squaring source is empty.')
  const network = document.network
  if (network.wires.length > MAXIMUM_ORDER) sourceError(network.line, `At most ${MAXIMUM_ORDER} wires are supported.`)
  const solved = solveNetwork(network)
  const arranged = arrangeNetwork(network, solved)
  const width = arranged.nodes[arranged.positive]?.x1 ?? 0
  const height = arranged.nodes[arranged.positive]?.voltage ?? 0
  return analyse('network', width, height, arranged.squares, arranged.nodes, arranged.positive, arranged.negative)
}
