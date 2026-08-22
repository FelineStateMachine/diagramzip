import { excalidrawAdapter } from '../adapters/excalidraw'
import { createRendererUnit } from '../runtime/unit'

export default createRendererUnit({
  id: 'excalidraw',
  kind: 'render',
  adapter: excalidrawAdapter,
  knownLosses: [
    'Only SVG is supported.',
    'External resources are blocked; image data must be embedded in the scene.',
    'The Worker uses browser-independent canvas and font metrics, so text wrapping and typography may differ from browser Excalidraw.',
  ],
})
