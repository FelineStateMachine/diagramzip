import { createBrowserRendererUnit } from '../../../shared/browser-unit.ts'

export default createBrowserRendererUnit({ id: 'mermaid', kind: 'render', version: 'mermaid@11.17.0', build: 'mermaid-11.17.0-browser-run-unit-1', pipeline: ['mermaid'], frame: '/index.html?v=1', knownLosses: ['External links and resource-loading elements are removed; XHTML labels retain only safe text formatting.'] })
