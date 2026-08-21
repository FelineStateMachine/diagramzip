import { cp, mkdir, rm } from 'node:fs/promises'
import { build } from 'esbuild'

const output = new URL('../dist/', import.meta.url)
const packageFonts = new URL('../node_modules/@excalidraw/excalidraw/dist/prod/fonts/', import.meta.url)

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await Promise.all([
  cp(new URL('../unit/index.html', import.meta.url), new URL('index.html', output)),
  cp(new URL('../unit/_headers', import.meta.url), new URL('_headers', output)),
  cp(packageFonts, new URL('fonts/', output), { recursive: true }),
])

await build({
  entryPoints: [new URL('../src/frame.js', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  outfile: new URL('frame-v4.js', output).pathname,
  sourcemap: false,
  treeShaking: true,
})
