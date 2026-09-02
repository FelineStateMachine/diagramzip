import { describe, expect, it } from 'vitest'
import orderNine from '../../../examples/diagrams/order-nine.squaring?raw'
import antiWedge from '../../../examples/diagrams/anti-wedge.squaring?raw'
import compound from '../../../examples/diagrams/compound.squaring?raw'
import { squaringAdapter } from '../src/adapters/squaring'
import { parseSquaring } from '../src/languages/squaring'
import { buildSquaring } from '../src/languages/squaring-model'
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

describe('squaring language', () => {
  it('parses a Bouwkamp rectangle with grouped, bare, and commented square lists', () => {
    const document = parseSquaring(orderNine)

    expect(document.view).toBe('both')
    expect(document.labels).toBe('sides')
    expect(document.title).toBe('Order 9 simple perfect squared rectangle')
    expect(document.rectangle).toMatchObject({ width: 33, height: 32, sides: [18, 15, 7, 8, 14, 4, 10, 1, 9] })
    expect(document.network).toBeNull()
    expect(parseSquaring('rectangle 3x2\n2, 1, 1 # trailing comment').rectangle?.sides).toEqual([2, 1, 1])
  })

  it('parses a network with a battery, wire lines, and chains', () => {
    const document = parseSquaring(antiWedge)

    expect(document.rectangle).toBeNull()
    expect(document.network?.positive).toBe('a')
    expect(document.network?.negative).toBe('e')
    expect(document.network?.nodes).toEqual(['a', 'e', 'b', 'c', 'd', 'f'])
    expect(document.network?.wires).toHaveLength(9)
    expect(parseSquaring('battery p n\nwire p n').network?.wires).toEqual([{ from: 'p', to: 'n', line: 2 }])
  })

  it('rejects mixed, incomplete, and malformed sources with line numbers', () => {
    expect(() => parseSquaring('squares 1 2')).toThrow('Line 1: Declare the rectangle')
    expect(() => parseSquaring('rectangle 3 x 2\nsquares 2 1 1\nbattery a b')).toThrow('Line 3: A squaring is either a rectangle')
    expect(() => parseSquaring('a - b')).toThrow('Line 1: A network needs a battery')
    expect(() => parseSquaring('battery a b\nc - d')).toThrow('Battery node "a" must be connected')
    expect(() => parseSquaring('.view sideways\nrectangle 3 x 2\n2 1 1')).toThrow('Line 1: Unknown view "sideways"')
    expect(() => parseSquaring('rectangle 3 x 2\n2 1 1\nbogus line')).toThrow('Line 3: Unrecognized line')
    expect(() => parseSquaring('rectangle 3 x 2\n2')).toThrow('at least two squares')
  })
})

describe('squaring model', () => {
  it('places Bouwkamp squares and derives the Smith diagram from horizontal segments', () => {
    const model = buildSquaring(parseSquaring(orderNine))

    expect(model).toMatchObject({ form: 'rectangle', width: 33, height: 32, order: 9, simple: true, perfect: true, repeatedSides: [], blocks: [] })
    expect(model.squares.map(square => [square.side, square.x, square.y])).toEqual([
      [18, 0, 0], [15, 18, 0], [7, 18, 15], [8, 25, 15], [14, 0, 18], [4, 14, 18], [10, 14, 22], [1, 24, 22], [9, 24, 23],
    ])
    expect(model.nodes.map(node => [node.id, node.voltage, node.x0, node.x1])).toEqual([
      ['top', 32, 0, 33], ['n1', 17, 18, 33], ['n2', 14, 0, 18], ['n3', 10, 14, 25], ['n4', 9, 24, 33], ['bottom', 0, 0, 33],
    ])
    // Kirchhoff: current into every interior node equals current out of it.
    for (const node of model.nodes.slice(1, -1)) {
      const inflow = model.squares.filter(square => square.bottom === node.index).reduce((sum, square) => sum + square.side, 0)
      const outflow = model.squares.filter(square => square.top === node.index).reduce((sum, square) => sum + square.side, 0)
      expect(inflow).toBe(outflow)
    }
  })

  it('solves a polyhedral network into an integer squared rectangle', () => {
    const model = buildSquaring(parseSquaring(antiWedge))

    expect(model).toMatchObject({ form: 'network', width: 15, height: 11, order: 9, simple: true, perfect: false, repeatedSides: [1, 4, 5, 6] })
    expect(model.nodes.find(node => node.id === 'a')?.voltage).toBe(11)
    expect(model.nodes.find(node => node.id === 'e')?.voltage).toBe(0)
    expect(model.squares.reduce((sum, square) => sum + square.side * square.side, 0)).toBe(15 * 11)
    // Ohm with unit resistance: every square's side is the voltage drop across it.
    for (const square of model.squares) {
      expect((model.nodes[square.top]?.voltage ?? 0) - (model.nodes[square.bottom]?.voltage ?? 0)).toBe(square.side)
    }
    // The squares tile the rectangle without overlaps.
    for (const first of model.squares) {
      for (const second of model.squares) {
        if (first === second) continue
        const overlap = first.x < second.x + second.side && second.x < first.x + first.side && first.y < second.y + second.side && second.y < first.y + first.side
        expect(overlap).toBe(false)
      }
    }
  })

  it('finds compound blocks and repeated sides', () => {
    const model = buildSquaring(parseSquaring(compound))

    expect(model).toMatchObject({ order: 10, simple: false, perfect: true })
    expect(model.blocks).toEqual([{ x: 32, y: 0, width: 33, height: 32, squares: 9 }])

    const quilt = buildSquaring(parseSquaring('rectangle 3 x 2\n2 1 1'))
    expect(quilt.simple).toBe(false)
    expect(quilt.blocks).toEqual([{ x: 2, y: 0, width: 1, height: 2, squares: 2 }])
    expect(quilt.repeatedSides).toEqual([1])
  })

  it('explains why a rectangle or a network cannot become a squaring', () => {
    expect(() => buildSquaring(parseSquaring('rectangle 33 x 32\n18 15 7 8 14 4 10 1 8'))).toThrow('area of 1039')
    expect(() => buildSquaring(parseSquaring('rectangle 33 x 32\n15 18 7 8 14 4 10 1 9'))).toThrow('Square 7 (side 10) does not fit at column 0, row 22; only 7 × 10 is free there.')
    expect(() => buildSquaring(parseSquaring('battery a b\na - b\nc - d'))).toThrow('not connected')
    expect(() => buildSquaring(parseSquaring('battery a c\na - b - c\na - d - c\nb - d'))).toThrow('carries no current')
    // A network containing K3,3 is not planar, so no arrangement exists.
    expect(() => buildSquaring(parseSquaring('battery n1 n4\nn1 - n5\nn1 - n6\nn2 - n4\nn2 - n5\nn2 - n6\nn3 - n4\nn3 - n5\nn3 - n6\nn2 - n5'))).toThrow('cannot be arranged')
    // A wire parallel to the battery becomes a full-height square beside a compound remainder.
    const cube = buildSquaring(parseSquaring('battery a b\na - b - c - d - a\ne - f - g - h - e\na - e\nb - f\nc - g\nd - h'))
    expect(cube).toMatchObject({ width: 24, height: 14, order: 12, simple: false })
    expect(cube.squares[0]).toMatchObject({ side: 14, x: 0, y: 0 })
  })
})

describe('squaring renderer', () => {
  it('renders the rectangle and the Smith diagram side by side', async () => {
    const result = await render(orderNine)

    expect(result.engineVersion).toBe('diagramzip-squaring@2')
    expect(result.body).toContain('<title>Order 9 simple perfect squared rectangle</title>')
    expect(result.body).toContain('data-view="both" data-form="rectangle" data-order="9" data-width="33" data-height="32" data-simple="true" data-perfect="true"')
    expect(result.body.match(/class="squaring-square"/g)).toHaveLength(9)
    expect(result.body.match(/class="squaring-wire"/g)).toHaveLength(9)
    expect(result.body.match(/class="squaring-node"/g)).toHaveLength(6)
    expect(result.body).toContain('class="squaring-wire" data-from="top" data-to="n2" data-current="18"')
    expect(result.body).toContain('class="squaring-node" data-node-id="n1" data-voltage="17"')
    expect(result.body).toContain('class="squaring-battery"')
    expect(result.body).toContain('Order 9 | 33 × 32 | simple | perfect')
    expect(result.body).not.toContain('class="squaring-block"')
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
    expect(plain.body).not.toContain('<text x=')
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
