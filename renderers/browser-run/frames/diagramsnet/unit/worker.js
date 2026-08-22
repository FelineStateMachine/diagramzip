import { createBrowserRendererUnit } from '../../../../shared/browser-unit.ts'

export default createBrowserRendererUnit({ id: 'diagramsnet', kind: 'render', version: 'diagrams.net@29.6.1', build: 'diagramsnet-29.6.1-browser-run-unit-1', pipeline: ['diagramsnet'], frame: '/index.html?v=1', license: 'Apache-2.0 AND LicenseRef-diagrams-net-assets', licenses: '/licenses/', source: '/SOURCE.md', knownLosses: ['Rendering requires the sandboxed browser exporter; there is no server-side rendering fallback.', 'External resources are blocked; embedded data images remain supported.'] })
