import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const configs = fileURLToPath(new URL('../config/units/', import.meta.url))
const output = fileURLToPath(new URL('../artifacts/licenses/npm-runtime-NOTICE.md', import.meta.url))
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
const wrangler = join(root, 'node_modules/.bin/wrangler')
const write = process.argv.includes('--write')

const iscFallbacks = new Map([
  ['boolbase', 'Copyright (c) Felix Boehm <me@feedic.com>'],
  ['saxes', 'Copyright (c) Louis-Dominique Dubeau <ldd@lddubeau.com>'],
])

function iscText(copyright) {
  return `${copyright}\n\nPermission to use, copy, modify, and/or distribute this software for any\npurpose with or without fee is hereby granted, provided that the above\ncopyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\nWITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF\nMERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR\nANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES\nWHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN\nACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF\nOR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`
}

function packageName(input) {
  return input.match(/node_modules\/(?:@[^/]+\/[^/]+|[^/]+)/)?.[0].slice('node_modules/'.length)
}

async function legalText(name) {
  const directory = join(root, 'node_modules', name)
  const files = (await readdir(directory))
    .filter(file => /^(?:licen[cs]e|copying|notice)(?:\.|$)/i.test(file))
    .sort((left, right) => left.localeCompare(right))
  if (files.length) {
    const sections = []
    for (const file of files) sections.push((await readFile(join(directory, file), 'utf8')).trim())
    return sections.join('\n\n')
  }
  const copyright = iscFallbacks.get(name)
  if (copyright) return iscText(copyright)
  throw new Error(`Runtime package ${name} does not publish a license or notice file.`)
}

const temporary = await mkdtemp(join(tmpdir(), 'diagramzip-runtime-licenses-'))
const units = new Map()
try {
  for (const config of (await readdir(configs)).filter(file => file.endsWith('.jsonc')).sort()) {
    const unit = basename(config, '.jsonc')
    const directory = join(temporary, unit)
    await mkdir(directory)
    execFileSync(wrangler, [
      'deploy', '--dry-run', '--config', join(configs, config),
      '--outdir', directory, '--metafile',
    ], { cwd: root, stdio: 'pipe' })
    const meta = JSON.parse(await readFile(join(directory, 'bundle-meta.json'), 'utf8'))
    const packages = new Set(Object.keys(meta.inputs).map(packageName).filter(Boolean))
    units.set(unit, [...packages].sort())
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}

const usedBy = new Map()
for (const [unit, packages] of units) {
  for (const name of packages) {
    const consumers = usedBy.get(name) ?? []
    consumers.push(unit)
    usedBy.set(name, consumers)
  }
}

const packages = []
for (const name of [...usedBy.keys()].sort()) {
  const metadata = lock.packages[`node_modules/${name}`]
  if (!metadata?.version || !metadata.license) throw new Error(`Runtime package ${name} lacks locked version or license metadata.`)
  packages.push({ name, version: metadata.version, license: metadata.license, units: usedBy.get(name), text: await legalText(name) })
}

const groups = new Map()
for (const dependency of packages) {
  const digest = createHash('sha256').update(dependency.text).digest('hex')
  const group = groups.get(digest) ?? { text: dependency.text, packages: [] }
  group.packages.push(`${dependency.name}@${dependency.version}`)
  groups.set(digest, group)
}

const lines = [
  '# Edge Worker npm runtime notices',
  '',
  'Generated from Wrangler deploy metafiles for `config/units/*.jsonc`. Build, test,',
  'and deployment-tool dependencies that are absent from every emitted Worker bundle',
  'are intentionally excluded. WebAssembly and separately vendored artifacts are',
  'documented by their own notices and the repository-level component manifest.',
  '',
  '| Package | Version | License | Emitted Worker units |',
  '| --- | --- | --- | --- |',
]
for (const dependency of packages) lines.push(`| ${dependency.name} | ${dependency.version} | ${dependency.license} | ${dependency.units.join(', ')} |`)
lines.push('', '## License and notice texts', '')
for (const group of [...groups.values()].sort((left, right) => left.packages[0].localeCompare(right.packages[0]))) {
  lines.push(`### ${group.packages.join(', ')}`, '', '```text', group.text, '```', '')
}
const generated = `${lines.join('\n').trim()}\n`

if (write) {
  await writeFile(output, generated)
} else {
  const current = await readFile(output, 'utf8').catch(() => '')
  if (current !== generated) throw new Error('Runtime license notice is stale. Run npm run generate:licenses.')
}
