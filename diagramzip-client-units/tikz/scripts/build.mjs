import { cp, mkdir, rm } from 'node:fs/promises'
import { build } from 'esbuild'

const output = new URL('../dist/', import.meta.url)
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(new URL('../assets/', import.meta.url), output, { recursive: true })
await cp(new URL('../unit/index.html', import.meta.url), new URL('index.html', output))
await cp(new URL('../unit/_headers', import.meta.url), new URL('_headers', output))
await build({
  entryPoints: [new URL('../src/frame.js', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  outfile: new URL('frame-v1.js', output).pathname,
  sourcemap: false,
})
