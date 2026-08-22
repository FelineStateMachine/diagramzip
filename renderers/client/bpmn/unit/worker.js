import { createBrowserRendererUnit } from '../../../shared/browser-unit.ts'

export default createBrowserRendererUnit({ id: 'bpmn', kind: 'render', version: 'bpmn-js@18.25.1', build: 'bpmn-js-18.25.1-browser-run-unit-1', pipeline: ['bpmn'], frame: '/index.html?v=1', knownLosses: ['External links and resource-loading elements are removed from exported SVG.'] })
