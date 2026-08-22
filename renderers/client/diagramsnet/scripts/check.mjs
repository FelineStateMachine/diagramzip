import { access, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const hash = async path => createHash('sha256').update(await readFile(new URL(path, import.meta.url))).digest('hex')
const expected = {
  '../dist/js/app.min.js': '34ae0b955b4cd1cf27ab0683665549026ccded7673d2d6c4b3cfaaa839aaf446',
  '../dist/js/export.js': '2dbdaad9adb96af52937f38dfccee03b39f771d621e75f0ae93f40c04f9e3b46',
  '../dist/js/export-init.js': 'cf9b6518b7f34c62ff0cc3f1f049fae340d2e7f8b486b3261ee5bff211a73d58',
  '../dist/js/shapes-14-6-5.min.js': '9c7a0ab5f29ebff9a8caac93219f2cd4b7b9622f9f5aa315bd148387e72848ec',
}
for (const [path, digest] of Object.entries(expected)) {
  if (await hash(path) !== digest) throw new Error(`${path} is not the pinned diagrams.net v29.6.1 export asset.`)
}
for (const path of [
  '../dist/SOURCE.md',
  '../dist/licenses/Apache-2.0.txt',
  '../dist/licenses/ASSET-TERMS.txt',
  '../dist/js/app.min.js',
  '../dist/js/export-init.js',
  '../dist/js/export.js',
  '../dist/js/shapes-14-6-5.min.js',
  '../dist/math4/es5/startup.js',
  '../dist/shapes/mxAWS4.js',
  '../dist/stencils/aws4.xml',
]) await access(new URL(path, import.meta.url))
for (const path of ['../dist/images/', '../dist/mxgraph/src/', '../dist/mxgraph/mxClient.js']) {
  try {
    await access(new URL(path, import.meta.url))
    throw new Error(`Editor-only diagrams.net asset unexpectedly shipped: ${path}`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}
const frame = await readFile(new URL('../src/frame.js', import.meta.url), 'utf8')
for (const required of ['diagram.zip:renderer:v1', 'LoadingComplete', 'MAX_SOURCE_LENGTH', 'MAX_OUTPUT_LENGTH', 'event.source !== parent']) {
  if (!frame.includes(required)) throw new Error(`Browser Run frame contract is missing ${required}.`)
}
console.log('diagrams.net client asset and protocol checks passed')
