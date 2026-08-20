import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const engines = [
  'plantuml', 'graphviz', 'd2', 'c4plantuml', 'blockdiag', 'seqdiag', 'actdiag', 'nwdiag',
  'packetdiag', 'rackdiag', 'dbml', 'diagramsnet', 'ditaa', 'erd', 'goat', 'pikchr',
  'structurizr', 'svgbob', 'symbolator', 'tikz', 'umlet', 'wireviz',
]
const wrangler = resolve(import.meta.dirname, '../node_modules/.bin/wrangler')
const pending = [...engines]
const failures = []

async function deploy(engine) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(wrangler, ['deploy', '--config', `wrangler.compatibility/${engine}.jsonc`], {
      cwd: resolve(import.meta.dirname, '..'),
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${engine} deployment exited ${code}`)))
  })
}

async function worker() {
  while (pending.length > 0) {
    const engine = pending.shift()
    try {
      await deploy(engine)
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
  console.log(`${engines.length}/${engines.length} compatibility units deployed`)
}
