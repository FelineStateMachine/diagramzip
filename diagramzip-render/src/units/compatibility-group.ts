import { originAdapter } from '../adapters/origin'
import { createRendererUnitGroup, type RendererUnitDescriptor } from '../unit'
import type { EngineId } from '../types'

declare const __UNIT_ID__: string
declare const __ENGINE_IDS__: readonly EngineId[]

const descriptors: RendererUnitDescriptor[] = __ENGINE_IDS__.map(id => ({
  id,
  kind: 'compatibility',
  adapter: originAdapter(id, 'https://diagram-zip.fly.dev'),
  knownLosses: ['Rendering still depends on the compatibility origin while this unit is replaced.'],
}))

export default createRendererUnitGroup(__UNIT_ID__, descriptors)
