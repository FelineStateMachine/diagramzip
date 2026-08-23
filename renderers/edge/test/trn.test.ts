import { describe, expect, it } from 'vitest'
import zenith from '../../../examples/diagrams/zenith.trn?raw'
import marshmallows from '../../../examples/diagrams/marshmallows.trn?raw'
import { trnAdapter } from '../src/adapters/trn'
import { parseTrn } from '../src/languages/trn'
import type { RenderRequest } from '../src/runtime/types'

function request(source: string, options: Record<string, string> = {}): RenderRequest {
  return {
    engine: 'trn',
    source,
    format: 'svg',
    options,
    metadata: { title: '', description: '' },
    presentation: { background: '', padding: 0, frame: false },
  }
}

describe('TRN language', () => {
  it('parses the full Zenith tree and infers its single root', () => {
    const document = parseTrn(zenith)

    expect(document.ingredients.size).toBe(22)
    expect(document.outcomes.size).toBe(10)
    expect(document.layout).toBe('individual')
    expect(document.roots.map(root => root.id)).toEqual(['zenith'])
    expect(document.outcomes.get('zenith')?.stages[0]?.inputs).toHaveLength(10)
    expect(document.outcomes.get('true_nights_edge')?.label).toBe("True Night's Edge")
  })

  it('renders ingredients as rows and operations as spanning table cells', async () => {
    const result = await trnAdapter.render(request(zenith.replace('.layout individual', '.layout combined')), new AbortController().signal)

    expect(result.body).toContain('<title>Zenith TRN</title>')
    expect(result.body).toContain('data-outcome-id="terra_blade"')
    expect(result.body).toContain('class="trn-ingredient"')
    expect(result.body).toContain('class="trn-operation-zone"')
    expect(result.body).toContain('data-column="6"')
    expect(result.body).toContain('class="trn-zone-shape')
    expect(result.body).toContain('transform="rotate(90')
    expect(result.body).not.toContain('Moon Lord drop')
  })

  it('flattens outcomes into dependency-ordered individual recipe tables', async () => {
    const result = await trnAdapter.render(request(zenith), new AbortController().signal)
    const recipes = [...result.body.matchAll(/class="trn-individual-recipe" data-recipe-id="([^"]+)"/g)]
      .map(match => match[1])

    expect(result.body).toContain('data-layout="individual"')
    expect(recipes).toHaveLength(10)
    expect(recipes.slice(0, 2)).toEqual(['copper_shortsword', 'lights_bane'])
    expect(recipes.at(-1)).toBe('zenith')
    expect(result.body).not.toContain('data-recipe-id="chlorophyte_bars"')
    expect(result.body).toContain('>smelt 24 Chlorophyte Bars</text>')
    expect(result.body).toContain('data-recipe-id="zenith" data-depth="4"')
    expect(result.body.match(/class="trn-recipe-link"/g)).toHaveLength(9)
    expect(result.body.match(/data-route="hallway"/g)).toHaveLength(2)
  })

  it('validates the source layout directive and rejects renderer options', () => {
    expect(() => parseTrn(zenith.replace('.layout individual', '.layout grid')))
      .toThrow(/Expected '.layout combined' or '.layout individual'/)
    expect(() => parseTrn('.layout combined\n.layout individual\ningredient flour\noutcome bread {\n + flour\n -> bake\n}'))
      .toThrow(/may only appear once/)
    expect(() => parseTrn('ingredient flour\n.layout individual\noutcome bread {\n + flour\n -> bake\n}'))
      .toThrow(/must appear before recipe declarations/)
    expect(() => trnAdapter.render(request(zenith, { color: 'blue' }), new AbortController().signal))
      .toThrow(/Unsupported TRN option: color/)
  })

  it('renders the reference marshmallow recipe with its preparation row', async () => {
    const document = parseTrn(marshmallows)
    const result = await trnAdapter.render(request(marshmallows), new AbortController().signal)

    expect(document.instructions.map(item => item.text)).toEqual(['Grease 9x13-in. pan and powder with powdered sugar'])
    expect(document.layout).toBe('combined')
    expect(document.roots[0]).toMatchObject({ id: 'marshmallows', portion: 'about 40 large marshmallows' })
    expect(result.body).toContain('Marshmallows (yields about 40 large marshmallows)')
    expect(result.body).toContain('class="trn-instruction-cell"')
    expect(result.body).toContain('mix until marshmallow has fluffed up')
    expect(result.body).toContain('data-outcome-id="marshmallows" data-column="7"')
    const colors = [...result.body.matchAll(/class="trn-operation-zone"[^>]*data-branch-color="(\d)"/g)].map(match => match[1])
    expect(colors).toHaveLength(8)
    const touchingPairs: Array<[number, number]> = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]]
    for (const [left, right] of touchingPairs) {
      expect(colors[left]!).not.toBe(colors[right]!)
    }
  })

  it('rejects unknown values and dependency cycles with source locations', () => {
    expect(() => parseTrn('outcome bread {\n  + flour\n  -> mix\n}')).toThrow(/Line 2: Unknown value 'flour'/)
    expect(() => parseTrn('outcome a {\n + b\n -> make\n}\noutcome b {\n + a\n -> make\n}')).toThrow(/Outcome cycle/)
    expect(() => parseTrn('ingredient flour\noutcome bread {\n + flour\n -> bake {portion}\n}')).toThrow(/Line 4: Action in 'bread' uses \{portion\}, but the outcome has no portion/)
  })

  it('supports sequential steps and interpolates optional portions in actions', async () => {
    const source = 'ingredient flour\noutcome bread portion 1 loaf {\n + flour 500 g\n -> mix\n -> bake {portion}\n}'
    const document = parseTrn(source)
    const result = await trnAdapter.render(request(source), new AbortController().signal)

    expect(document.outcomes.get('bread')).toMatchObject({ portion: '1 loaf' })
    expect(document.outcomes.get('bread')?.stages).toHaveLength(2)
    expect(result.body).toContain('>bake 1 loaf</text>')
    expect(result.body).not.toContain('{portion}')
  })

  it('expands row height to fit a vertical action phrase without shrinking it', async () => {
    const source = `ingredient ore
outcome blade {
  + ore
  -> forge a finished copper shortsword
}`
    const result = await trnAdapter.render(request(source), new AbortController().signal)
    const ingredientCell = result.body.match(/class="trn-ingredient-cell"[^>]*height="(\d+)"/)

    expect(Number(ingredientCell?.[1])).toBeGreaterThan(28)
    expect(result.body).toContain('font-size="10"')
    expect(result.body).toContain('>forge a finished copper shortsword</text>')
  })

  it('merges waiting cells and grows operations across the inputs they consume', async () => {
    const source = `ingredient gelatin
ingredient water
ingredient sugar
ingredient syrup
ingredient salt
ingredient vanilla
ingredient coating

outcome bloomed {
  + gelatin
  + water
  -> soak
}

outcome cooked {
  + sugar
  + syrup
  -> boil
}

outcome marshmallows {
  + bloomed
  + cooked
  -> drizzle
  + salt
  -> mix
  + vanilla
  -> cool
  -> cut
  + coating
  -> powder
}`
    const result = await trnAdapter.render(request(source), new AbortController().signal)

    expect(result.body).not.toContain('class="trn-flow-cell"')
    expect(result.body).toContain('data-outcome-id="marshmallows" data-column="3" data-cell-count="7" data-arm-count="1"')
    expect(result.body).toContain('data-outcome-id="marshmallows" data-column="4" data-cell-count="9" data-arm-count="1"')
    expect(result.body).toContain('data-outcome-id="marshmallows" data-column="6" data-cell-count="12" data-arm-count="1"')
    expect(result.body).toContain('height="196"')
  })
})
