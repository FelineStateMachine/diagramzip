import { describe, expect, it } from 'vitest'
import { ENGINE_CATALOG } from '../src/catalog'
import { ENGINE_IDS } from '../../shared/engines'

describe('engine catalog', () => {
  it('covers every catalog engine exactly once', () => {
    expect(ENGINE_CATALOG).toHaveLength(30)
    expect(new Set(ENGINE_CATALOG.map(engine => engine.id)).size).toBe(30)
    expect(ENGINE_CATALOG.map(engine => engine.id)).toEqual(ENGINE_IDS)
  })

  it('reports an honest capability for every pinned renderer contract', () => {
    const presentationOnly = new Set(['diagramsnet', 'excalidraw', 'tikz'])
    for (const engine of ENGINE_CATALOG) {
      expect(engine.normalization).toMatchObject({
        schema: '1',
        normalizer: 'svg-normalizer-1',
      })
      expect(engine.normalization.profile).not.toBe('safe-raw-1')
      if (presentationOnly.has(engine.id)) {
        expect(engine.normalization).toMatchObject({
          profile: 'authored-svg-presentation-1',
          conformance: 'presentation-only',
          appearances: ['raw', 'auto-framed', 'light-framed', 'dark-framed'],
        })
      } else {
        expect(['semantic', 'adaptive']).toContain(engine.normalization.conformance)
        expect(engine.normalization.appearances).toEqual(expect.arrayContaining(['raw', 'auto-transparent', 'dark-framed']))
      }
    }
    expect(ENGINE_CATALOG.find(entry => entry.id === 'graphviz')?.normalization).toMatchObject({
      profile: 'graphviz-15-semantic-1',
      conformance: 'semantic',
      appearances: expect.arrayContaining(['raw', 'auto-transparent', 'dark-framed']),
    })
  })

  it('marks the BlockDiag family as edge Python', () => {
    const family = ENGINE_CATALOG.filter(engine => [
      'blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'packetdiag', 'rackdiag',
    ].includes(engine.id))
    expect(family).toHaveLength(6)
    for (const engine of family) {
      expect(engine.activeRuntime).toBe('edge-python')
      expect(engine.version).toContain('python-worker-1')
    }
  })

  it('marks GraphViz, DBML, and ERD as one edge-Wasm family', () => {
    const family = ENGINE_CATALOG.filter(engine => ['graphviz', 'dbml', 'erd'].includes(engine.id))
    expect(family).toHaveLength(3)
    for (const engine of family) {
      expect(engine.activeRuntime).toBe('edge-wasm')
      expect(engine.version).toContain('graphviz@15.1.1')
    }
  })

  it('marks WireViz as a dedicated Python translator unit', () => {
    const wireviz = ENGINE_CATALOG.find(engine => engine.id === 'wireviz')!
    expect(wireviz.activeRuntime).toBe('edge-python')
    expect(wireviz.version).toContain('python-translator-1')
  })

  it('marks Pikchr as a dedicated edge-Wasm unit', () => {
    const pikchr = ENGINE_CATALOG.find(engine => engine.id === 'pikchr')!
    expect(pikchr.activeRuntime).toBe('edge-wasm')
    expect(pikchr.version).toContain('pikchr@85e65b9686')
  })

  it('marks Svgbob as a dedicated edge-Wasm unit', () => {
    const svgbob = ENGINE_CATALOG.find(engine => engine.id === 'svgbob')!
    expect(svgbob.activeRuntime).toBe('edge-wasm')
    expect(svgbob.version).toContain('svgbob@0.7.6')
  })

  it('groups the Ditaa translation with the shared Svgbob edge-Wasm dependency', () => {
    const ditaa = ENGINE_CATALOG.find(engine => engine.id === 'ditaa')!
    expect(ditaa.activeRuntime).toBe('edge-wasm')
    expect(ditaa.version).toContain('svgbob@0.7.6')
  })

  it('marks GoAT as a dedicated edge-Wasm unit', () => {
    const goat = ENGINE_CATALOG.find(engine => engine.id === 'goat')!
    expect(goat.activeRuntime).toBe('edge-wasm')
    expect(goat.version).toContain('goat@0.5.1')
  })

  it('marks D2 as a dedicated edge-Wasm unit', () => {
    const d2 = ENGINE_CATALOG.find(engine => engine.id === 'd2')!
    expect(d2.activeRuntime).toBe('edge-wasm')
    expect(d2.version).toContain('d2@0.7.1/dagre-wasm')
  })

  it('marks Symbolator as a dedicated Python translation unit', () => {
    const symbolator = ENGINE_CATALOG.find(engine => engine.id === 'symbolator')!
    expect(symbolator.activeRuntime).toBe('edge-python')
    expect(symbolator.version).toContain('symbolator@1.2.2/python-translation')
  })

  it('marks PlantUML and lowered C4 as one edge-Wasm family', () => {
    const family = ENGINE_CATALOG.filter(engine => ['plantuml', 'c4plantuml'].includes(engine.id))
    expect(family).toHaveLength(2)
    for (const engine of family) {
      expect(engine.activeRuntime).toBe('edge-wasm')
      expect(engine.version).toContain('plantuml@1.2026.6')
    }
  })

  it('marks diagrams.net as an official browser renderer', () => {
    const diagramsnet = ENGINE_CATALOG.find(engine => engine.id === 'diagramsnet')!
    expect(diagramsnet.activeRuntime).toBe('client')
    expect(diagramsnet.version).toContain('diagrams.net@29.6.1')
  })

  it('marks TikZ as a bundled browser renderer and UMLet as a direct edge translation', () => {
    const tikz = ENGINE_CATALOG.find(engine => engine.id === 'tikz')!
    const umlet = ENGINE_CATALOG.find(engine => engine.id === 'umlet')!
    expect(tikz.activeRuntime).toBe('client')
    expect(tikz.version).toContain('tikzjax@1.0.63')
    expect(umlet.activeRuntime).toBe('edge-js')
    expect(umlet.version).toContain('diagramzip-umlet-svg')
  })

  it('assigns every engine its final runtime and version', () => {
    for (const engine of ENGINE_CATALOG) {
      expect(engine.activeRuntime).toBe(engine.targetRuntime)
      expect(engine.version).not.toHaveLength(0)
    }
  })
})
