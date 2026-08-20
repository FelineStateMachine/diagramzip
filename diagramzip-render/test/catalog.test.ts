import { describe, expect, it } from 'vitest'
import { ENGINE_CATALOG } from '../src/catalog'
import { ENGINE_IDS } from '../src/types'

describe('engine catalog', () => {
  it('covers every catalog engine exactly once', () => {
    expect(ENGINE_CATALOG).toHaveLength(30)
    expect(new Set(ENGINE_CATALOG.map(engine => engine.id)).size).toBe(30)
    expect(ENGINE_CATALOG.map(engine => engine.id)).toEqual(ENGINE_IDS)
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

  it('marks GraphViz and ERD as one edge-Wasm family', () => {
    const family = ENGINE_CATALOG.filter(engine => ['graphviz', 'erd'].includes(engine.id))
    expect(family).toHaveLength(2)
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

  it('does not retain a silent origin fallback for any engine', () => {
    for (const engine of ENGINE_CATALOG) {
      if (engine.activeRuntime === 'origin') expect(engine.version).toBe('compatibility-origin')
      expect(engine.fallback).toBeNull()
    }
  })
})
