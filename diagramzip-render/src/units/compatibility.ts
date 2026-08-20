import { originAdapter } from '../adapters/origin'
import { createRendererUnit } from '../unit'
import type { EngineId } from '../types'

declare const __ENGINE_ID__: EngineId

const engine = __ENGINE_ID__

export default createRendererUnit({
  id: engine,
  kind: 'compatibility',
  adapter: originAdapter(engine, 'https://diagram-zip.fly.dev'),
  knownLosses: ['Rendering still depends on the compatibility origin while this unit is replaced.'],
})
