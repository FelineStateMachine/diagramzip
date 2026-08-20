import { spawn } from 'node:child_process'
import { basename, resolve } from 'node:path'

const units = [
  resolve(import.meta.dirname, '../../diagramzip-python-units/blockdiag-family'),
  resolve(import.meta.dirname, '../../diagramzip-python-units/wireviz-translator'),
]

for (const cwd of units) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn('uv', ['run', 'pywrangler', 'deploy'], { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${basename(cwd)} deployment exited ${code}`)))
  })
}
console.log(`${units.length}/${units.length} Python renderer units deployed`)
