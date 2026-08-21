import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'd2-wasm/source')
const output = resolve(root, 'd2-wasm/d2-custom.wasm')
const temporary = resolve(root, 'd2-wasm/.d2-custom.wasm.tmp')

const goVersion = execFileSync('go', ['version'], { encoding: 'utf8' }).trim()
if (!goVersion.includes('go1.26.6')) {
  throw new Error(`D2 Wasm build requires Go 1.26.6; found ${goVersion}`)
}

execFileSync('go', ['build', '-trimpath', '-buildvcs=false', '-ldflags=-s -w', '-o', temporary, '.'], {
  cwd: source,
  stdio: 'inherit',
  env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' },
})
renameSync(temporary, output)

const goroot = execFileSync('go', ['env', 'GOROOT'], { encoding: 'utf8' }).trim()
copyFileSync(resolve(goroot, 'lib/wasm/wasm_exec.js'), resolve(root, 'd2-wasm/wasm_exec.js'))
console.log(execFileSync('shasum', ['-a', '256', output], { encoding: 'utf8' }).trim())
