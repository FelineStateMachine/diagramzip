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
for (const marker of ['diagram.zip:renderer:v1', 'MAX_SOURCE_LENGTH', 'MAX_OUTPUT_LENGTH', 'event.source !== parent', 'container.contains(event.target)']) {
  if (!frame.includes(marker)) throw new Error(`TikZ client protocol is missing ${marker}.`)
}

console.log('TikZJax asset and protocol checks passed')
