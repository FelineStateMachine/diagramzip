import { goatAdapter } from '../adapters/edge/goat'
import { createRendererUnit } from '../unit'

export default createRendererUnit({
  id: 'goat', kind: 'render', adapter: goatAdapter,
  knownLosses: [
    'Only SVG is supported.',
    'Custom CSS files are not exposed; the native light/dark color options and embedded default CSS are retained.',
    'Light and dark colors are limited to bounded named, hexadecimal, RGB(A), or HSL(A) values; CSS variables and resource-bearing values are rejected.',
    'The edge build uses TinyGo with a slice-based vendored iterator adaptation; geometry and source grammar remain upstream GoAT 0.5.1.',
  ],
})
