import { spawn } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const configDirectory = join(root, 'config/units')
const wrangler = join(root, 'node_modules/.bin/wrangler')
const message = process.env.DIAGRAMZIP_RELEASE_MESSAGE

function parseJsonc(source) {
  let stripped = ''
  let string = false
  let escaped = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const next = source[index + 1]
    if (string) {
      stripped += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') string = false
    } else if (character === '"') {
      string = true
      stripped += character
    } else if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1
      stripped += '\n'
    } else if (character === '/' && next === '*') {
      index += 2
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) index += 1
      index += 1
    } else {
      stripped += character
    }
  }
  let normalized = ''
  string = false
  escaped = false
  for (let index = 0; index < stripped.length; index += 1) {
    const character = stripped[index]
    if (string) {
      normalized += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') string = false
    } else if (character === '"') {
      string = true
      normalized += character
    } else if (character === ',') {
      let next = index + 1
      while (/\s/.test(stripped[next] ?? '')) next += 1
      if (stripped[next] !== '}' && stripped[next] !== ']') normalized += character
    } else {
      normalized += character
    }
  }
  return JSON.parse(normalized)
}

const configs = []
for (const filename of (await readdir(configDirectory)).filter(name => name.endsWith('.jsonc')).sort()) {
  const path = join(configDirectory, filename)
  const config = parseJsonc(await readFile(path, 'utf8'))
  if (!config.name) throw new Error(`${filename} does not declare a Worker name.`)
  configs.push({
    filename,
    path,
    name: config.name,
    dependencies: (config.services ?? []).map(service => service.service),
  })
}

const names = new Set(configs.map(config => config.name))
if (names.size !== configs.length) throw new Error('Edge Worker configuration names must be unique.')

async function deploy(config) {
  await new Promise((resolvePromise, reject) => {
    const args = ['deploy', '--strict', '--config', config.path]
    if (message) args.push('--message', message)
    const child = spawn(wrangler, args, {
      cwd: root,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${config.filename} deployment exited ${code}`)))
  })
}

async function deployBatch(configs) {
  const pending = [...configs]
  const failures = []
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
  await Promise.all(Array.from({ length: Math.min(4, configs.length) }, worker))
  if (failures.length > 0) throw new Error(failures.join('\n'))
}

const remaining = new Map(configs.map(config => [config.name, config]))
let deployed = 0
while (remaining.size > 0) {
  const ready = [...remaining.values()].filter(config =>
    config.dependencies.every(dependency => !names.has(dependency) || !remaining.has(dependency)),
  )
  if (ready.length === 0) {
    throw new Error(`Cyclic Worker service dependencies: ${[...remaining.keys()].join(', ')}`)
  }
  await deployBatch(ready)
  for (const config of ready) remaining.delete(config.name)
  deployed += ready.length
}

console.log(`${deployed}/${configs.length} Worker renderer units deployed`)
