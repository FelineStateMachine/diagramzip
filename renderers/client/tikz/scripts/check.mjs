import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const assets = new URL('../assets/', import.meta.url)
const expectedTree = '92045ae366580b0fd119ea0ce4bca7d70f9cf58865d21cc92497b431492ae25e'

async function files(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await files(path))
    else result.push(path)
  }
  return result
}

const hash = createHash('sha256')
for (const path of (await files(assets.pathname)).sort()) {
  hash.update(relative(assets.pathname, path).split(sep).join('/'))
  hash.update('\0')
  hash.update(await readFile(path))
  hash.update('\0')
}
if (hash.digest('hex') !== expectedTree) throw new Error('TikZJax asset tree does not match the pinned 1.0.63 package.')

const frame = await readFile(new URL('../src/frame.js', import.meta.url), 'utf8')
for (const marker of ['diagram.zip:renderer:v1', 'MAX_SOURCE_LENGTH', 'MAX_OUTPUT_LENGTH', 'event.source !== parent', 'container.contains(event.target)', 'data:font/woff2;base64', 'embedUsedFonts']) {
  if (!frame.includes(marker)) throw new Error(`TikZ client protocol is missing ${marker}.`)
}

const headers = await readFile(new URL('../unit/_headers', import.meta.url), 'utf8')
if (!headers.includes('Access-Control-Allow-Origin: *')) throw new Error('TikZ assets must allow the unique-origin worker to fetch the bundled files.')

for (const path of [
  '../dist/SOURCE.md',
  '../dist/licenses/GPL-3.0.txt',
  '../dist/licenses/LPPL-1.3c.txt',
  '../dist/licenses/DiagramZip-MIT.txt',
  '../dist/source/build.mjs',
  '../dist/source/frame.js',
  '../dist/source/tikzjax-1.0.63.js',
]) await readFile(new URL(path, import.meta.url))

const originalTikzJax = await readFile(new URL('../assets/tikzjax.js', import.meta.url))
const distributedSource = await readFile(new URL('../dist/source/tikzjax-1.0.63.js', import.meta.url))
if (!originalTikzJax.equals(distributedSource)) throw new Error('The published TikZJax source input is not exact.')

console.log('TikZJax asset and protocol checks passed')
