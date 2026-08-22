import { createBrowserRendererUnit } from '../../../shared/browser-unit.ts'

export default createBrowserRendererUnit({ id: 'excalidraw', kind: 'render', version: '@excalidraw/excalidraw@0.18.1', build: 'excalidraw-0.18.1-browser-run-unit-2', pipeline: ['excalidraw'], frame: '/index.html?v=4', knownLosses: ['External resources are blocked; image data must be embedded in the scene.', 'Font subsetting is disabled by the sandbox policy, so exports embed the complete self-hosted font.'] })
