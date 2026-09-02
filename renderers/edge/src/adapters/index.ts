import type { EngineId, RendererAdapter } from '../runtime/types'
import { bytefieldAdapter } from './bytefield'
import { dbmlAdapter } from './dbml'
import { ditaaAdapter } from './ditaa'
import { erdAdapter } from './erd'
import { graphvizAdapter } from './graphviz'
import { goatAdapter } from './goat'
import { nomnomlAdapter } from './nomnoml'
import { squaringAdapter } from './squaring'
import { svgbobAdapter } from './svgbob'
import { trnAdapter } from './trn'
import { vegaAdapter } from './vega'
import { vegaliteAdapter } from './vegalite'
import { wavedromAdapter } from './wavedrom'
import type { EdgeEngineId } from './types'

const adapters: Record<EdgeEngineId, RendererAdapter> = {
  bytefield: bytefieldAdapter,
  dbml: dbmlAdapter,
  ditaa: ditaaAdapter,
  erd: erdAdapter,
  graphviz: graphvizAdapter,
  goat: goatAdapter,
  nomnoml: nomnomlAdapter,
  squaring: squaringAdapter,
  svgbob: svgbobAdapter,
  trn: trnAdapter,
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
