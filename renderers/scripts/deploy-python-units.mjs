import { spawn } from 'node:child_process'
import { access, readFile, readdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

const pythonDirectory = resolve(import.meta.dirname, '../python')
const units = []
for (const entry of (await readdir(pythonDirectory, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .sort((left, right) => left.name.localeCompare(right.name))) {
  const directory = join(pythonDirectory, entry.name)
  try {
    const configPath = join(directory, 'wrangler.jsonc')
    await access(configPath)
    const config = JSON.parse(await readFile(configPath, 'utf8'))
    if (!config.name) throw new Error(`${entry.name}/wrangler.jsonc does not declare a Worker name.`)
    units.push({
      directory,
      name: config.name,
      dependencies: (config.services ?? []).map(service => service.service),
    })
  } catch {
    // A Python support directory without a Wrangler config is not deployable.
  }
}

if (units.length === 0) throw new Error('No Python Worker units were discovered.')
const names = new Set(units.map(unit => unit.name))
if (names.size !== units.length) throw new Error('Python Worker configuration names must be unique.')

async function deploy(cwd) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn('uv', ['run', 'pywrangler', 'deploy'], { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${basename(cwd)} deployment exited ${code}`)))
  })
}

const remaining = new Map(units.map(unit => [unit.name, unit]))
let deployed = 0
while (remaining.size > 0) {
  const ready = [...remaining.values()].filter(unit =>
    unit.dependencies.every(dependency => !names.has(dependency) || !remaining.has(dependency)),
  )
  if (ready.length === 0) {
    throw new Error(`Cyclic Python Worker service dependencies: ${[...remaining.keys()].join(', ')}`)
  }
  for (const unit of ready) {
    await deploy(unit.directory)
    remaining.delete(unit.name)
    deployed += 1
  }
}
console.log(`${deployed}/${units.length} Python renderer units deployed`)
