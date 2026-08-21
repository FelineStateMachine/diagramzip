import { execFileSync } from 'node:child_process'
import { chmodSync, copyFileSync, cpSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const source = resolve(root, 'toolchains/d2/source')
const jsrunnerOverlay = resolve(root, 'toolchains/d2/overlays/jsrunner')
const output = resolve(root, 'artifacts/d2/d2-custom.wasm')
const temporary = resolve(root, 'artifacts/d2/.d2-custom.wasm.tmp')

const goVersion = execFileSync('go', ['version'], { encoding: 'utf8' }).trim()
if (!goVersion.includes('go1.26.6')) {
  throw new Error(`D2 Wasm build requires Go 1.26.6; found ${goVersion}`)
}

const d2Module = execFileSync('go', ['list', '-m', '-f', '{{.Dir}}', 'oss.terrastruct.com/d2'], {
  cwd: source,
  encoding: 'utf8',
}).trim()
const staging = resolve(root, 'toolchains/d2/.d2-build')
const stagedModule = resolve(staging, 'd2')
const stagedModfile = resolve(staging, 'worker.mod')
rmSync(staging, { force: true, recursive: true })
mkdirSync(staging, { recursive: true })
cpSync(d2Module, stagedModule, { recursive: true })
chmodSync(resolve(stagedModule, 'lib/jsrunner/js.go'), 0o644)
chmodSync(resolve(stagedModule, 'lib/jsrunner/goja.go'), 0o644)
copyFileSync(resolve(jsrunnerOverlay, 'js.go'), resolve(stagedModule, 'lib/jsrunner/js.go'))
copyFileSync(resolve(jsrunnerOverlay, 'goja.go'), resolve(stagedModule, 'lib/jsrunner/goja.go'))
copyFileSync(resolve(source, 'go.mod'), stagedModfile)
copyFileSync(resolve(source, 'go.sum'), resolve(staging, 'worker.sum'))
execFileSync('go', ['mod', 'edit', `-modfile=${stagedModfile}`, `-replace=oss.terrastruct.com/d2=${relative(source, stagedModule)}`], { cwd: source })

try {
  execFileSync('go', ['build', `-modfile=${stagedModfile}`, '-trimpath', '-buildvcs=false', '-ldflags=-s -w', '-o', temporary, '.'], {
    cwd: source,
    stdio: 'inherit',
    env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' },
  })
  renameSync(temporary, output)
} finally {
  rmSync(staging, { force: true, recursive: true })
  rmSync(temporary, { force: true })
}

const goroot = execFileSync('go', ['env', 'GOROOT'], { encoding: 'utf8' }).trim()
copyFileSync(resolve(goroot, 'lib/wasm/wasm_exec.js'), resolve(root, 'artifacts/d2/wasm_exec.js'))
console.log(execFileSync('shasum', ['-a', '256', output], { encoding: 'utf8' }).trim())
