import { umletAdapter } from '../adapters/edge/umlet'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'umlet',
  kind: 'translate',
  adapter: umletAdapter,
  knownLosses: [
    'Only SVG is supported.',
    'The bounded translator preserves UXF coordinates but uses browser-independent SVG text metrics, so wrapping and typography differ from UMLet desktop.',
    'Known base and repository custom elements have direct SVG shapes; unknown custom Java elements render as visibly labeled generic boxes instead of executing custom code.',
    'Advanced PlotGrid and UMLSequenceAllInOne elements render as bounded labeled approximations.',
    'Interactive sticking, resizing, Java/GWT facets, themes, and custom class loading are intentionally unavailable.',
  ],
})
