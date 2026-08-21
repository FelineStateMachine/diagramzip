import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'

const output = new URL('../dist/', import.meta.url)
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(new URL('../assets/', import.meta.url), output, { recursive: true })
await mkdir(new URL('licenses/', output), { recursive: true })
await mkdir(new URL('source/', output), { recursive: true })
await cp(new URL('../unit/index.html', import.meta.url), new URL('index.html', output))
await cp(new URL('../unit/_headers', import.meta.url), new URL('_headers', output))
await cp(new URL('../README.md', import.meta.url), new URL('SOURCE.md', output))
await cp(new URL('../vendor-licenses/GPL-3.0.txt', import.meta.url), new URL('licenses/GPL-3.0.txt', output))
await cp(new URL('../vendor-licenses/LPPL-1.3c.txt', import.meta.url), new URL('licenses/LPPL-1.3c.txt', output))
await cp(new URL('../../../../LICENSE', import.meta.url), new URL('licenses/DiagramZip-MIT.txt', output))
await cp(new URL('./build.mjs', import.meta.url), new URL('source/build.mjs', output))
await cp(new URL('../src/frame.js', import.meta.url), new URL('source/frame.js', output))
await cp(new URL('../assets/tikzjax.js', import.meta.url), new URL('source/tikzjax-1.0.63.js', output))

const tikzJaxPath = new URL('tikzjax.js', output)
const tikzJax = await readFile(tikzJaxPath, 'utf8')
const storageStart = tikzJax.indexOf('U=function(e,t,{blocked:r,upgrade:n,blocking:o,terminated:s}={})')
const storageEnd = tikzJax.indexOf(',q=[];let V,H=null;', storageStart)
if (storageStart < 0 || storageEnd < 0) throw new Error('The pinned TikZJax storage code did not match the expected build.')
const storageDisabled = 'U=Promise.resolve({get:async()=>void 0,put:async()=>void 0}),Q=async()=>void 0'
await writeFile(tikzJaxPath, `${tikzJax.slice(0, storageStart)}${storageDisabled}${tikzJax.slice(storageEnd)}`)

await build({
  entryPoints: [new URL('../src/frame.js', import.meta.url).pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  outfile: new URL('frame-v1.js', output).pathname,
  sourcemap: false,
})
