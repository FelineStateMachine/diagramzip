import { cp, mkdir, rm } from 'node:fs/promises'
import { build } from 'esbuild'

const output = new URL('../dist/', import.meta.url)
const source = new URL('../vendor/assets/', import.meta.url)
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(source, output, { recursive: true })
await mkdir(new URL('licenses/', output), { recursive: true })
await cp(new URL('../unit/index.html', import.meta.url), new URL('index.html', output))
await cp(new URL('../unit/_headers', import.meta.url), new URL('_headers', output))
await cp(new URL('../README.md', import.meta.url), new URL('SOURCE.md', output))
await cp(new URL('../../../../licenses/svgbob-license.txt', import.meta.url), new URL('licenses/Apache-2.0.txt', output))
await cp(new URL('../vendor/assets/img/LICENSE', import.meta.url), new URL('licenses/ASSET-TERMS.txt', output))
await build({
  entryPoints: [new URL('../src/frame.js', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  outfile: new URL('frame-v1.js', output).pathname,
  sourcemap: false,
})
