import type { EngineId, RendererAdapter } from '../types'
import { bytefieldAdapter } from './edge/bytefield'
import { dbmlAdapter } from './edge/dbml'
import { erdAdapter } from './edge/erd'
import { graphvizAdapter } from './edge/graphviz'
import { goatAdapter } from './edge/goat'
import { nomnomlAdapter } from './edge/nomnoml'
import { svgbobAdapter } from './edge/svgbob'
import { vegaAdapter } from './edge/vega'
import { vegaliteAdapter } from './edge/vegalite'
import { wavedromAdapter } from './edge/wavedrom'
import type { EdgeEngineId } from './edge/types'

const adapters: Record<EdgeEngineId, RendererAdapter> = {
  bytefield: bytefieldAdapter,
  dbml: dbmlAdapter,
  erd: erdAdapter,
  graphviz: graphvizAdapter,
  goat: goatAdapter,
  nomnoml: nomnomlAdapter,
  svgbob: svgbobAdapter,
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
