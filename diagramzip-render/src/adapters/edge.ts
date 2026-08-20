import type { EngineId, RendererAdapter } from '../types'
import { bytefieldAdapter } from './edge/bytefield'
import { nomnomlAdapter } from './edge/nomnoml'
import { vegaAdapter } from './edge/vega'
import { vegaliteAdapter } from './edge/vegalite'
import { wavedromAdapter } from './edge/wavedrom'
import type { EdgeEngineId } from './edge/types'

const adapters: Record<EdgeEngineId, RendererAdapter> = {
  bytefield: bytefieldAdapter,
  nomnoml: nomnomlAdapter,
  vega: vegaAdapter,
  vegalite: vegaliteAdapter,
  wavedrom: wavedromAdapter,
}

export function isEdgeEngine(id: EngineId): id is EdgeEngineId {
  return id in adapters
}

export function edgeAdapter(id: EdgeEngineId): RendererAdapter {
  return adapters[id]
}
