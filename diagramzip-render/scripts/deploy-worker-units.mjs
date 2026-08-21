import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const configs = [
  'wrangler.units/bytefield.jsonc',
  'wrangler.units/nomnoml.jsonc',
  'wrangler.units/vega-family.jsonc',
  'wrangler.units/wavedrom.jsonc',
  'wrangler.units/graphviz-family.jsonc',
  'wrangler.units/pikchr.jsonc',
  'wrangler.units/svgbob.jsonc',
  'wrangler.units/goat.jsonc',
  'wrangler.compatibility/plantuml-family.jsonc',
  'wrangler.compatibility/d2.jsonc',
  'wrangler.compatibility/diagramsnet.jsonc',
  'wrangler.compatibility/ditaa.jsonc',
  'wrangler.compatibility/structurizr.jsonc',
  'wrangler.compatibility/symbolator.jsonc',
  'wrangler.compatibility/tikz.jsonc',
  'wrangler.compatibility/umlet.jsonc',
]
const wrangler = resolve(import.meta.dirname, '../node_modules/.bin/wrangler')
const pending = [...configs]
const failures = []

async function deploy(config) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(wrangler, ['deploy', '--config', config], {
      cwd: resolve(import.meta.dirname, '..'),
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${config} deployment exited ${code}`)))
  })
}

async function worker() {
  while (pending.length > 0) {
    const config = pending.shift()
    try {
      await deploy(config)
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error))
    }
  }
}

await Promise.all(Array.from({ length: 4 }, worker))
if (failures.length > 0) {
  for (const failure of failures) console.error(failure)
  process.exitCode = 1
} else {
  console.log(`${configs.length}/${configs.length} Worker renderer units deployed`)
}
