import { bpmnAdapter } from '../adapters/bpmn'
import { createRendererUnit } from '../runtime/unit'
import type { EngineId } from '../runtime/types'

export default createRendererUnit({
  id: 'bpmn' as EngineId,
  kind: 'render',
  adapter: bpmnAdapter,
  knownLosses: [
    'The bounded SVG renderer uses BPMN DI coordinates and a deliberately finite core symbol vocabulary; vendor-specific rendering extensions are ignored.',
    'Text uses deterministic browser-independent metrics and is not pixel-identical to bpmn-js.',
    'External resources, scripts, hyperlinks, and interactive overlays are not rendered.',
  ],
})
