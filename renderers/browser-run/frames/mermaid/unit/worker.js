import { createBrowserRendererUnit } from '../../../../shared/browser-unit.ts'

export default createBrowserRendererUnit({ id: 'mermaid', kind: 'render', version: 'mermaid@11.17.0', build: 'mermaid-11.17.0-browser-run-unit-2', pipeline: ['mermaid'], frame: '/index.html?v=2', knownLosses: ['External links and resource-loading elements are removed; text labels retain only safe formatting.'] })
