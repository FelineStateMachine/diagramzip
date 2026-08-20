import { describe, expect, it } from 'vitest'
import { ENGINE_CATALOG } from '../src/catalog'
import { ENGINE_IDS } from '../src/types'

describe('engine catalog', () => {
  it('covers every catalog engine exactly once', () => {
    expect(ENGINE_CATALOG).toHaveLength(30)
    expect(new Set(ENGINE_CATALOG.map(engine => engine.id)).size).toBe(30)
    expect(ENGINE_CATALOG.map(engine => engine.id)).toEqual(ENGINE_IDS)
  })

  it('keeps every not-yet-migrated engine on the compatibility origin', () => {
    for (const engine of ENGINE_CATALOG) {
      if (engine.activeRuntime === 'origin') expect(engine.version).toBe('compatibility-origin')
      else expect(engine.fallback).toBe('origin')
    }
  })
})
