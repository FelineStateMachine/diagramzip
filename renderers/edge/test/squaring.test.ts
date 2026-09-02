import { describe, expect, it } from 'vitest'
import orderNine from '../../../examples/diagrams/order-nine.squaring?raw'
import antiWedge from '../../../examples/diagrams/anti-wedge.squaring?raw'
import compound from '../../../examples/diagrams/compound.squaring?raw'
import stoneSketch from '../../../examples/diagrams/stone-sketch.squaring?raw'
import cubeSearch from '../../../examples/diagrams/cube-search.squaring?raw'
import gap from '../../../examples/diagrams/gap.squaring?raw'
import { squaringAdapter } from '../src/adapters/squaring'
import { parseSquaring } from '../src/languages/squaring'
import { buildSquaring } from '../src/languages/squaring-model'
import { POLYHEDRA } from '../src/languages/squaring-polyhedra'
import type { RenderRequest } from '../src/runtime/types'

function request(source: string, options: Record<string, string> = {}): RenderRequest {
  return {
    engine: 'squaring',
    source,
    format: 'svg',
    options,
    metadata: { title: '', description: '' },
    presentation: { background: '', padding: 0, frame: false },
  }
}

const render = (source: string, options: Record<string, string> = {}) => squaringAdapter.render(request(source, options), new AbortController().signal)
const build = (source: string) => buildSquaring(parseSquaring(source))

function expectTiling(model: ReturnType<typeof build>): void {
  expect(model.squares.reduce((sum, square) => sum + square.side * square.side, 0)).toBe(model.width * model.height)
  for (const first of model.squares) {
    for (const second of model.squares) {
      if (first === second) continue
      const overlap = first.x < second.x + second.side && second.x < first.x + first.side && first.y < second.y + second.side && second.y < first.y + first.side
      expect(overlap).toBe(false)
    }
  }
}

describe('squaring language', () => {
  it('parses a Bouwkamp rectangle with grouped, bare, and commented square lists', () => {
    const document = parseSquaring(orderNine)

    expect(document.view).toBe('both')
    expect(document.labels).toBe('sides')
    expect(document.title).toBe('Order 9 simple perfect squared rectangle')
    expect(document.rectangle).toMatchObject({ width: 33, height: 32, symbolic: false })
    expect(document.rectangle?.groups.map(group => group.sides.map(side => side.constant))).toEqual([[18, 15], [7, 8], [14, 4], [10, 1], [9]])
    expect(document.network).toBeNull()
    expect(parseSquaring('rectangle 3x2\n2, 1, 1 # trailing comment').rectangle?.groups[0]?.sides.map(side => side.text)).toEqual(['2', '1', '1'])
  })

  it('parses sketches with expressions, unknown dimensions, and under clauses', () => {
    const document = parseSquaring('rectangle ? x 10\n(a 2a+b)\n(b) under a\n(3) under #2 b')
    expect(document.rectangle).toMatchObject({ width: null, height: 10, symbolic: true })
    const groups = document.rectangle?.groups ?? []
    expect(groups[0]?.sides[1]).toMatchObject({ text: '2a+b', terms: { a: 2, b: 1 }, constant: 0 })
    expect(groups[1]?.under).toEqual(['a'])
    expect(groups[2]?.under).toEqual(['#2', 'b'])
    expect(parseSquaring('rectangle 5 x 5\n(3 ?)').rectangle?.groups[0]?.sides[1]?.auto).toBe(true)
  })

  it('parses a network with a battery, wire lines, chains, faces, and polyhedra', () => {
    const document = parseSquaring(antiWedge)
    expect(document.rectangle).toBeNull()
    expect(document.network?.positive).toBe('a')
    expect(document.network?.negative).toBe('e')
    expect(document.network?.nodes).toEqual(['a', 'e', 'b', 'c', 'd', 'f'])
    expect(document.network?.wires).toHaveLength(9)

    const faces = parseSquaring('battery any\nface a b c\nface a c d\nface a d b\nface b d c')
    expect(faces.network?.searchBattery).toBe(true)
    expect(faces.network?.wires).toHaveLength(6)

    const cube = parseSquaring(cubeSearch)
    expect(cube.network?.wires).toHaveLength(12)
    expect(cube.network?.nodes).toHaveLength(8)
  })

  it('rejects mixed, incomplete, and malformed sources with line numbers', () => {
    expect(() => parseSquaring('squares 1 2')).toThrow('Line 1: Declare the rectangle')
    expect(() => parseSquaring('rectangle 3 x 2\nsquares 2 1 1\nbattery a b')).toThrow('Line 3: A squaring is either a rectangle')
    expect(() => parseSquaring('a - b')).toThrow('Line 1: A network needs a battery')
    expect(() => parseSquaring('battery a b\nc - d')).toThrow('Battery node "a" must be connected')
    expect(() => parseSquaring('.view sideways\nrectangle 3 x 2\n2 1 1')).toThrow('Line 1: Unknown view "sideways"')
    expect(() => parseSquaring('rectangle 3 x 2\n2 1 1\nbogus line')).toThrow('Line 3: Unrecognized line')
    expect(() => parseSquaring('rectangle ? x ?\n(a b)\n(c d)')).toThrow('Line 3: In a sketch with named sides, every group after the first needs "under"')
    expect(() => parseSquaring('battery a b\npolyhedron teapot')).toThrow('Unknown polyhedron "teapot"')
    expect(() => parseSquaring('rectangle 3 x 2\n(a wire)')).toThrow('is a keyword')
  })
})

describe('polyhedron presets', () => {
  it('define connected graphs with the expected edge counts', () => {
    const expected: Record<string, [number, number]> = {
      tetrahedron: [4, 6], cube: [8, 12], octahedron: [6, 12], dodecahedron: [20, 30], icosahedron: [12, 30],
      'triangular-prism': [6, 9], 'square-pyramid': [5, 8], 'square-antiprism': [8, 16], 'tetragonal-antiwedge': [6, 10],
    }
    for (const [name, [vertices, edges]] of Object.entries(expected)) {
      const preset = POLYHEDRA[name]?.()
      expect(preset?.vertices, name).toHaveLength(vertices)
      expect(preset?.edges, name).toHaveLength(edges)
    }
  })
})

describe('squaring model', () => {
  it('places Bouwkamp squares and derives the Smith diagram from horizontal segments', () => {
    const model = build(orderNine)

    expect(model).toMatchObject({ form: 'rectangle', width: 33, height: 32, order: 9, complete: true, simple: true, perfect: true, repeatedSides: [], blocks: [] })
    expect(model.squares.map(square => [square.side, square.x, square.y])).toEqual([
      [18, 0, 0], [15, 18, 0], [7, 18, 15], [8, 25, 15], [14, 0, 18], [4, 14, 18], [10, 14, 22], [1, 24, 22], [9, 24, 23],
    ])
    expect(model.nodes.map(node => [node.id, node.voltage, node.x0, node.x1])).toEqual([
      ['top', 32, 0, 33], ['n1', 17, 18, 33], ['n2', 14, 0, 18], ['n3', 10, 14, 25], ['n4', 9, 24, 33], ['bottom', 0, 0, 33],
    ])
    for (const node of model.nodes.slice(1, -1)) {
      const inflow = model.squares.filter(square => square.bottom === node.index).reduce((sum, square) => sum + square.side, 0)
      const outflow = model.squares.filter(square => square.top === node.index).reduce((sum, square) => sum + square.side, 0)
      expect(inflow).toBe(outflow)
    }
  })

  it('renders partial dissections instead of rejecting them', () => {
    const stopped = build('rectangle 33 x 32\n15 18 7 8 14 4 10 1 9')
    expect(stopped.complete).toBe(false)
    expect(stopped.problem).toContain('square 7 (side 10) does not fit at column 0, row 22')
    expect(stopped.squares).toHaveLength(6)
    expect(stopped.nodes).toEqual([])

    const unfilled = build('rectangle 33 x 32\n18 15 7 8')
    expect(unfilled.complete).toBe(false)
    expect(unfilled.problem).toContain('do not fill the rectangle')

    const auto = build(gap)
    expect(auto.squares.map(square => square.side)).toEqual([18, 15, 7, 8, 14, 4])
    expect(auto.complete).toBe(false)

    const inferred = build('rectangle ? x ?\n(18 15) (7 8) (14 4) (10 1) (9)')
    expect(inferred).toMatchObject({ width: 33, height: 32, complete: true, simple: true, perfect: true })
  })

  it('solves a Stone sketch with unknown sides into the order-9 squaring', () => {
    const model = build(stoneSketch)
    expect(model).toMatchObject({ width: 33, height: 32, order: 9, complete: true, simple: true, perfect: true })
    expect(model.squares.map(square => square.side)).toEqual([18, 15, 7, 8, 14, 4, 10, 1, 9])
    expect(model.squares[0]?.label).toBe('a=18')
    expectTiling(model)

    const pinned = build('rectangle ? x ?\n(a 15)\n(c d) under 15\n(e f) under a\n(g h) under f c\n(i) under h d')
    expect(pinned.width).toBe(33)

    // Four equal squares: the sketch closes as a 2 × 2 block.
    expect(build('rectangle ? x ?\n(a b)\n(c) under a\n(d) under b')).toMatchObject({ width: 2, height: 2, complete: true, perfect: false })
    expect(() => build('rectangle ? x ?\n(a 16)\n(c d) under 16\n(e f) under a\n(g h) under f c\n(i) under h d')).toThrow(/whole number|cannot close|closes only/)
    expect(() => build('rectangle ? x ?\n(a b)\n(c) under b\n(d) under c a')).toThrow(/every side is zero|closes only|cannot close/)
    expect(() => build('rectangle ? x ?\n(a 1 1)\n(c) under 1')).toThrow('ambiguous')
    expect(() => build('rectangle ? x ?\n(a b)\n(c) under a\n(d) under a')).toThrow('already has a group under it')
  })

  it('solves a polyhedral network into an integer squared rectangle', () => {
    const model = build(antiWedge)

    expect(model).toMatchObject({ form: 'network', width: 15, height: 11, order: 9, simple: true, perfect: false, repeatedSides: [1, 4, 5, 6] })
    expect(model.nodes.find(node => node.id === 'a')?.voltage).toBe(11)
    expect(model.nodes.find(node => node.id === 'e')?.voltage).toBe(0)
    for (const square of model.squares) {
      expect((model.nodes[square.top]?.voltage ?? 0) - (model.nodes[square.bottom]?.voltage ?? 0)).toBe(square.side)
    }
    expectTiling(model)
  })

  it('tries every wire as the battery and keeps the best candidate', () => {
    const model = build(cubeSearch)
    expect(model.search).toHaveLength(12)
    expect(model.searchIndex).toBeGreaterThanOrEqual(0)
    expect(model.search?.every(candidate => candidate.error === null)).toBe(true)
    expect(model).toMatchObject({ order: 11, complete: true })
    expectTiling(model)

    const wedge = build('polyhedron tetragonal-antiwedge\nbattery any')
    expect(wedge.search).toHaveLength(10)
    expect(wedge.simple).toBe(true)
  })

  it('finds compound blocks and repeated sides', () => {
    const model = build(compound)
    expect(model).toMatchObject({ order: 10, simple: false, perfect: true })
    expect(model.blocks).toEqual([{ x: 32, y: 0, width: 33, height: 32, squares: 9 }])

    const quilt = build('rectangle 3 x 2\n2 1 1')
    expect(quilt.simple).toBe(false)
    expect(quilt.blocks).toEqual([{ x: 2, y: 0, width: 1, height: 2, squares: 2 }])
    expect(quilt.repeatedSides).toEqual([1])
  })

  it('explains why a network cannot become a squaring', () => {
    expect(() => build('battery a b\na - b\nc - d')).toThrow('not connected')
    expect(() => build('battery a c\na - b - c\na - d - c\nb - d')).toThrow('carries no current')
    expect(() => build('battery n1 n4\nn1 - n5\nn1 - n6\nn2 - n4\nn2 - n5\nn2 - n6\nn3 - n4\nn3 - n5\nn3 - n6\nn2 - n5')).toThrow('cannot be arranged')
    const cube = build('battery a b\na - b - c - d - a\ne - f - g - h - e\na - e\nb - f\nc - g\nd - h')
    expect(cube).toMatchObject({ width: 24, height: 14, order: 12, simple: false })
    expect(cube.squares[0]).toMatchObject({ side: 14, x: 0, y: 0 })
  })
})

describe('squaring renderer', () => {
  it('renders the rectangle and the Smith diagram side by side', async () => {
    const result = await render(orderNine)

    expect(result.engineVersion).toBe('diagramzip-squaring@3')
    expect(result.body).toContain('<title>Order 9 simple perfect squared rectangle</title>')
    expect(result.body).toContain('data-view="both" data-form="rectangle" data-order="9" data-width="33" data-height="32" data-complete="true" data-simple="true" data-perfect="true"')
    expect(result.body.match(/class="squaring-square"/g)).toHaveLength(9)
    expect(result.body.match(/class="squaring-wire"/g)).toHaveLength(9)
    expect(result.body.match(/class="squaring-node"/g)).toHaveLength(6)
    expect(result.body).toContain('class="squaring-wire" data-from="top" data-to="n2" data-current="18"')
    expect(result.body).toContain('class="squaring-node" data-node-id="n1" data-voltage="17"')
    expect(result.body).toContain('class="squaring-battery"')
    expect(result.body).toContain('Order 9 | 33 × 32 | simple | perfect')
    expect(result.body).not.toContain('class="squaring-block"')
    expect(result.body).not.toContain('squaring-hatch')
  })

  it('draws incomplete dissections with hatched gaps and no circuit', async () => {
    const result = await render(gap)
    expect(result.body).toContain('data-view="rectangle"')
    expect(result.body).toContain('data-complete="false"')
    expect(result.body).toContain('class="squaring-gap"')
    expect(result.body).toContain('id="squaring-hatch"')
    expect(result.body).not.toContain('class="squaring-wire"')
    expect(result.body).toContain('incomplete: the squares do not fill the rectangle')
  })

  it('lists every battery candidate under a searched network', async () => {
    const result = await render(cubeSearch)
    expect(result.body).toContain('class="squaring-search" data-candidates="12"')
    expect(result.body).toContain('best of 12 choices')
    expect(result.body).toContain('◀')
  })

  it('outlines compound blocks in the overlay view and honours label and view directives', async () => {
    const overlay = await render(compound)
    expect(overlay.body).toContain('data-view="overlay"')
    expect(overlay.body).toContain('class="squaring-block" data-squares="9"')
    expect(overlay.body).toContain('compound (1 block outlined) | perfect')
    expect(overlay.body).toContain('data-overlay="true"')

    const plain = await render('.view rectangle\n.labels none\nrectangle 3 x 2\n2 1 1')
    expect(plain.body).toContain('data-view="rectangle"')
    expect(plain.body).not.toContain('class="squaring-wire"')
    expect(plain.body).not.toContain('class="squaring-square-label"')
    expect(plain.body).toContain('<title>Squared rectangle 3 × 2</title>')

    const circuit = await render(antiWedge.replace('.view both', '.view circuit'))
    expect(circuit.body).toContain('data-view="circuit"')
    expect(circuit.body).not.toContain('class="squaring-square"')
    expect(circuit.body).toContain('battery a → e')
  })

  it('rejects renderer options', () => {
    expect(() => render(orderNine, { scale: '2' })).toThrow('Unsupported squaring option: scale.')
  })
})
