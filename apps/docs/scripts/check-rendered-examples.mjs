import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalizeSvg, materializeSvg, supportedAppearances } from '../../../shared/svg/index.js'
import { CLIENT_RENDERERS, httpRendererUrlFor } from '../src/components/DiagramExample/rendererRouting.mjs'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')
const examplesDir = join(site, 'static', 'examples')
const names = (await readdir(examplesDir)).filter((name) => name.endsWith('.json')).sort()

function cspSource(document, headers) {
  return headers.get('Content-Security-Policy')
    ?? document.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1]
    ?? ''
}

function cspAllows(csp, directive, origin) {
  const values = csp.split(';')
    .map(value => value.trim().split(/\s+/))
    .find(([name]) => name === directive)
    ?.slice(1) ?? []
  return values.includes('*') || values.includes(origin)
}

async function check(name) {
  const example = JSON.parse(await readFile(join(examplesDir, name), 'utf8'))
  if (CLIENT_RENDERERS[example.engine]) {
    const frameUrl = CLIENT_RENDERERS[example.engine]
    const response = await fetch(frameUrl)
    const body = await response.text()
    const scriptUrls = [...body.matchAll(/<script[^>]+src="([^"]+)"/gi)]
      .map((match) => new URL(match[1], frameUrl).href)
    const scripts = await Promise.all(scriptUrls.map(async (scriptUrl) => {
      const scriptResponse = await fetch(scriptUrl)
      return {
        ok: scriptResponse.ok,
        body: await scriptResponse.text(),
      }
    }))
    const hasProtocol = scripts.some((script) => script.ok && script.body.includes('diagram.zip:renderer:v1'))
    if (!response.ok || !hasProtocol) {
      throw new Error(`${example.engine}: client frame unavailable (HTTP ${response.status})`)
    }
    if (example.engine === 'excalidraw' && scripts.some((script) => script.body.includes('https://esm.sh'))) {
      const fallbackOrigin = 'https://esm.sh'
      if (!cspAllows(cspSource(body, response.headers), 'font-src', fallbackOrigin)) {
        throw new Error(`${example.engine}: frame CSP font-src blocks ${fallbackOrigin}`)
      }
      const fallbackFont = await fetch(`${fallbackOrigin}/@excalidraw/excalidraw@0.18.1/dist/prod/fonts/Cascadia/CascadiaCode-Regular.woff2`)
      const fallbackAvailable = fallbackFont.ok && fallbackFont.headers.get('Access-Control-Allow-Origin') === '*'
      await fallbackFont.body?.cancel()
      if (!fallbackAvailable) {
        throw new Error(`${example.engine}: packaged font fallback is unavailable (HTTP ${fallbackFont.status})`)
      }
    }
    return `${example.engine} client frame`
  }
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
