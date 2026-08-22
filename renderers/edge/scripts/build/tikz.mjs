import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { resolve } from 'node:path'

// The browser unit's pinned, published dist tree is the source of truth for
// the native extraction. This script intentionally performs only mechanical
// copying and a small, asserted source transformation; it does not rebuild
// TikZJax or alter the browser unit.
const edgeRoot = resolve(import.meta.dirname, '../..')
const clientRoot = resolve(edgeRoot, '../client/tikz')
const output = resolve(edgeRoot, 'artifacts/tikz')
const sourceOutput = resolve(output, 'source')
const sourceDist = resolve(clientRoot, 'dist')
const sourceRoot = existsSync(resolve(sourceDist, 'run-tex.js')) ? sourceDist : output
const sourceRunTex = existsSync(resolve(sourceDist, 'run-tex.js')) ? resolve(sourceDist, 'run-tex.js') : resolve(output, 'source/run-tex.js')
const licenseRoot = existsSync(resolve(clientRoot, 'vendor-licenses')) ? resolve(clientRoot, 'vendor-licenses') : resolve(output, 'licenses')

const required = ['run-tex.js', 'tex.wasm.gz', 'core.dump.gz', 'tex_files', 'fonts']
for (const entry of required.slice(1)) {
  if (!existsSync(resolve(sourceRoot, entry))) throw new Error(`Missing pinned TikZJax asset: ${entry}`)
}

if (!existsSync(sourceRunTex)) throw new Error('Missing pinned TikZJax run-tex.js source.')
const originalRunTex = readFileSync(sourceRunTex, 'utf8')
if (sourceRoot !== output) rmSync(output, { recursive: true, force: true })
mkdirSync(sourceOutput, { recursive: true })
if (sourceRoot !== output) {
  cpSync(resolve(sourceRoot, 'tex_files'), resolve(output, 'tex_files'), { recursive: true })
  cpSync(resolve(sourceRoot, 'fonts'), resolve(output, 'fonts'), { recursive: true })
  cpSync(resolve(sourceRoot, 'tex.wasm.gz'), resolve(output, 'tex.wasm.gz'))
  cpSync(resolve(sourceRoot, 'core.dump.gz'), resolve(output, 'core.dump.gz'))
}
writeFileSync(resolve(sourceOutput, 'run-tex.js'), originalRunTex)
for (const license of ['GPL-3.0.txt', 'LPPL-1.3c.txt']) {
  mkdirSync(resolve(output, 'licenses'), { recursive: true })
  const destination = resolve(output, 'licenses', license)
  if (resolve(licenseRoot, license) !== destination) cpSync(resolve(licenseRoot, license), destination)
}
writeFileSync(resolve(output, 'tex.wasm'), gunzipSync(readFileSync(resolve(output, 'tex.wasm.gz'))))

let core = originalRunTex
const expose = 'const YA=UA.expose;UA.registerSerializer,UA.Transfer;'
if (!core.includes(expose)) throw new Error('TikZJax expose hook did not match the pinned source.')
core = core.replace(expose, 'const YA=value=>{globalThis.__tikzCaptured=value};')
const instantiate = 'const B=await WebAssembly.instantiate(Zn,{library:A,env:{memory:n}})'
if (!core.includes(instantiate)) throw new Error('TikZJax Wasm instantiate hook did not match the pinned source.')
core = core.replace(instantiate, 'const B=new WebAssembly.Instance(globalThis.__tikzWasm,{library:A,env:{memory:n}})')
if (!core.includes('await Un(B.instance.exports)')) throw new Error('TikZJax Wasm export hook did not match the pinned source.')
core = core.replace('await Un(B.instance.exports)', 'await Un(B.exports)')
const inflate = 'const Xn=async A=>{const t=await fetch(`${zn}/${A}`);if(t.ok){const A=t.body.getReader(),e=new zr.Inflate;for(;;){const{done:t,value:r}=await A.read();if(t)break;e.push(r)}if(A.releaseLock(),e.err)throw new Error(e.err);return e.result}throw new Error(`Unable to load ${A}. File not available.`)}'
if (!core.includes(inflate)) throw new Error('TikZJax inflate hook did not match the pinned source.')
const streamingInflate = 'const Xn=async(A,t)=>{const e=await zn(A);if(e.ok){const A=e.body.getReader(),r=new zr.Inflate;let n=0;t&&(r.onData=A=>{if(n+A.length>t.length)throw new Error(`Inflated ${A} exceeds its destination.`);t.set(A,n),n+=A.length});for(;;){const{done:e,value:t}=await A.read();if(e)break;r.push(t)}if(A.releaseLock(),r.err)throw new Error(r.err);if(t&&n!==t.length)throw new Error(`Inflated ${A} has an unexpected size.`);return t?t.subarray(0,n):r.result}throw new Error(`Unable to load ${A}. File not available.`)}'
core = core.replace(inflate, streamingInflate)
const loadAssets = 'async load(A){zn=A,Zn=await Xn("tex.wasm.gz"),Wn=new Uint8Array(await Xn("core.dump.gz"),0,65536*wn)}'
if (!core.includes(loadAssets)) throw new Error('TikZJax asset-load hook did not match the pinned source.')
core = core.replace(loadAssets, 'async load(A){zn=A}')
const dumpCopy = 'new Uint8Array(n.buffer,0,65536*wn).set(Wn.slice(0)),In(n.buffer),Fn("input.tex\\n\\\\end\\n"),Gn(Xn)'
if (!core.includes(dumpCopy)) throw new Error('TikZJax dump-copy hook did not match the pinned source.')
core = core.replace(dumpCopy, 'await Xn("core.dump.gz",new Uint8Array(n.buffer,0,65536*wn)),In(n.buffer),Fn("input.tex\\n\\\\end\\n"),Gn(Xn)')
const externalFallback = 'catch{try{const t=await fetch(A);if(!t.ok)throw new Error(`Unable to load ${A}.`);{const e=await t.text();An[A]=e}}catch{}}'
if (!core.includes(externalFallback)) throw new Error('TikZJax external-file hook did not match the pinned source.')
core = core.replace(externalFallback, 'catch{}')
if (!core.endsWith('})();')) throw new Error('TikZJax wrapper terminator did not match the pinned source.')
core = `${core.slice(0, -5)}
})();export const tikzCore=globalThis.__tikzCaptured;`
writeFileSync(resolve(output, 'tikz-core.js'), core)
writeFileSync(resolve(output, 'tikz-core.d.ts'), 'export interface TikzCore {\n  load(fetchAsset: (assetPath: string) => Promise<Response>): Promise<void>\n  texify(source: string, options: Record<string, string>): Promise<string>\n}\nexport const tikzCore: TikzCore\n')
writeFileSync(resolve(output, 'tex.wasm.d.ts'), 'declare const module: WebAssembly.Module\nexport default module\n')
writeFileSync(resolve(output, 'provenance.md'), [
  '# TikZJax edge artifact',
  '',
  'This artifact is derived from @planktimerr/tikzjax@1.0.63, pinned to',
  'upstream revision e4bb417fe574f58f6db611cefc6be4855ab9d345. The generated',
  'tikz-core.js is the distributed run-tex.js with the threads worker export',
  'replaced by a direct load/texify capture, the compressed core dump stream-',
  'inflated directly into fresh Wasm memory, and arbitrary external TeX file',
  'fallbacks removed. Asset reads use the Worker static-assets binding. The',
  'compressed tex.wasm.gz fetch is unused by the edge',
  'path; tex.wasm is statically compiled into the Worker with the CompiledWasm',
  'rule. It is used only with the bundled tex_files/ package set.',
  '',
  'The unmodified corresponding input is published at source/run-tex.js; the',
  'mechanical extraction is reproducibly produced by',
  'renderers/edge/scripts/build/tikz.mjs.',
  '',
  'The TikZJax source is GPL-3.0-or-later; its TeX/TikZ components are covered',
  'by LPPL-1.3c. The corresponding notices are included in licenses/.',
  '',
].join('\n'))

console.log(`TikZ edge artifact rebuilt from ${sourceRoot}`)
