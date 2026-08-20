import { cp, mkdir, rm } from 'node:fs/promises'
import { build } from 'esbuild'

const output = new URL('../diagramzip-unit-dist/', import.meta.url)
const packageAssets = new URL('../node_modules/@excalidraw/excalidraw/dist/prod/fonts/', import.meta.url)

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await Promise.all([
  cp(new URL('../diagramzip-unit/index.html', import.meta.url), new URL('index.html', output)),
  cp(new URL('../diagramzip-unit/_headers', import.meta.url), new URL('_headers', output)),
  cp(packageAssets, new URL('fonts/', output), { recursive: true }),
])

await build({
  entryPoints: [new URL('../diagramzip-unit/frame.js', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  outfile: new URL('frame-v3.js', output).pathname,
  sourcemap: false,
  treeShaking: true,
})
