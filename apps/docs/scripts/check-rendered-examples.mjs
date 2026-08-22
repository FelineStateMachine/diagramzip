import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalizeSvg, materializeSvg, supportedAppearances } from '../../../shared/svg/index.js'
import { httpRendererUrlFor } from '../src/components/DiagramExample/rendererRouting.mjs'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const examplesDir = join(site, 'static', 'examples')
const names = (await readdir(examplesDir)).filter((name) => name.endsWith('.json')).sort()

async function check(name) {
  const example = JSON.parse(await readFile(join(examplesDir, name), 'utf8'))
  const response = await fetch(httpRendererUrlFor(example.engine), {
    method: 'POST',
    headers: { Accept: 'image/svg+xml', 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
  const version = [
    response.headers.get('X-Diagram-Engine-Version'),
    response.headers.get('X-Renderer-Build'),
  ].filter(Boolean).join(' ')
  const canonical = canonicalizeSvg(body, {}, example.engine, version)
  const conformance = canonical.match(/data-dz-conformance="([^"]+)"/)?.[1]
  if (conformance !== 'presentation-only' && !/data-dz-(?:fill|stroke)=/.test(canonical)) {
    throw new Error(`${example.engine}: normalization profile produced no semantic paint roles`)
  }
  const appearances = supportedAppearances(canonical)
  const appearance = appearances.includes('auto-transparent')
    ? 'auto-transparent'
    : appearances.includes('auto-framed') ? 'auto-framed' : 'raw'
  materializeSvg(canonical, appearance)
  return example.engine
}

const failures = []
for (let index = 0; index < names.length; index += 5) {
  const group = names.slice(index, index + 5)
  const results = await Promise.allSettled(group.map(check))
  results.forEach((result) => {
    if (result.status === 'rejected') failures.push(result.reason.message)
    else console.log(`Checked ${result.value}.`)
  })
}

if (failures.length) {
  console.error(failures.map((failure) => `ERROR: ${failure}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`The live renderer accepted all ${names.length} examples.`)
}
