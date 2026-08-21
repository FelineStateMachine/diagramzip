import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const hash = async path => createHash('sha256').update(await readFile(new URL(path, import.meta.url))).digest('hex')
const expected = {
  '../dist/js/export.js': '2dbdaad9adb96af52937f38dfccee03b39f771d621e75f0ae93f40c04f9e3b46',
  '../dist/js/export-init.js': 'cf9b6518b7f34c62ff0cc3f1f049fae340d2e7f8b486b3261ee5bff211a73d58',
}
for (const [path, digest] of Object.entries(expected)) {
  if (await hash(path) !== digest) throw new Error(`${path} is not the pinned diagrams.net v29.6.1 export asset.`)
}
const frame = await readFile(new URL('../src/frame.js', import.meta.url), 'utf8')
for (const required of ['diagram.zip:renderer:v1', 'LoadingComplete', 'MAX_SOURCE_LENGTH', 'MAX_OUTPUT_LENGTH', 'event.source !== parent']) {
  if (!frame.includes(required)) throw new Error(`Client renderer contract is missing ${required}.`)
}
console.log('diagrams.net client asset and protocol checks passed')
