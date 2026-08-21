import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'

const output = new URL('../dist/', import.meta.url)
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(new URL('../assets/', import.meta.url), output, { recursive: true })
await cp(new URL('../unit/index.html', import.meta.url), new URL('index.html', output))
await cp(new URL('../unit/_headers', import.meta.url), new URL('_headers', output))

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
