import { vegaliteAdapter } from '../adapters/edge/vegalite'
import { createRendererUnit } from '../unit'

export const vegaliteDescriptor = {
  id: 'vegalite',
  kind: 'translate',
  adapter: vegaliteAdapter,
  pipeline: ['vega'],
  knownLosses: ['URL-backed data and images are rejected; data must be embedded as values.', 'Only SVG is in the rendering contract.'],
} as const

export default createRendererUnit(vegaliteDescriptor)
