import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const examplesDir = join(site, 'static', 'examples')
const endpoint = 'https://diagram.zip/render/v1/svg'
const names = (await readdir(examplesDir)).filter((name) => name.endsWith('.json')).sort()

async function check(name) {
  const example = JSON.parse(await readFile(join(examplesDir, name), 'utf8'))
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: 'image/svg+xml', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      engine: example.engine,
      source: example.source,
      format: 'svg',
      options: {},
      metadata: {},
      presentation: { background: '', padding: 24, frame: false },
    }),
  })
  const body = await response.text()
  if (!response.ok || !body.includes('<svg')) {
    throw new Error(`${example.engine}: HTTP ${response.status} ${body.replace(/\s+/g, ' ').slice(0, 240)}`)
  }
  return example.engine
}

const failures = []
for (let index = 0; index < names.length; index += 5) {
  const group = names.slice(index, index + 5)
  const results = await Promise.allSettled(group.map(check))
  results.forEach((result) => {
    if (result.status === 'rejected') failures.push(result.reason.message)
    else console.log(`Rendered ${result.value}.`)
  })
}

if (failures.length) {
  console.error(failures.map((failure) => `ERROR: ${failure}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`The live renderer accepted all ${names.length} examples.`)
}
