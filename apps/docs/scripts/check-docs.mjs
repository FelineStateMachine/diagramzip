import { readFile, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { basename, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diagramTypeIds, diagramTypes } from '../data/diagram-types.mjs'
import { diagramSkillIds, diagramSkills, skillGroups, standardsSupport } from '../../../skills/catalog.mjs'

const site = join(fileURLToPath(new URL('..', import.meta.url)))
const docs = join(site, 'docs')
const repo = join(site, '..', '..')
const publicFiles = [join(site, 'static', 'llms.txt'), join(site, 'static', 'llms-full.txt'), join(site, 'static', 'diagram-types.json'), join(site, 'static', 'diagram-skills.json')]
const examples = join(site, 'static', 'examples')
const skills = join(repo, 'skills')
const publicSkills = join(site, 'static', 'skills')
const errors = []
const source = (path) => readFile(path, 'utf8')

function assert(condition, message) { if (!condition) errors.push(message) }
function idsFromNames(names) { return names.filter((name) => name.endsWith('.md')).map((name) => name.slice(0, -3)).sort() }
async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesBelow(path) : [path]
  }))
  return nested.flat()
}

function skillFrontmatter(content) {
  const raw = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
  if (!raw) return undefined
  const value = (key) => {
    const rawValue = raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim()
    return rawValue?.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2')
  }
  return { raw, name: value('name'), description: value('description'), disableModelInvocation: value('disable-model-invocation') }
}

function relativeMarkdownLinks(content) {
  return [...content.matchAll(/\[[^\]]*\]\(([^)]+\.md(?:#[^)]*)?)\)/g)]
    .map((match) => match[1].split('#')[0])
    .filter((target) => !/^[a-z]+:/i.test(target) && !target.startsWith('/'))
}

function proseBlocks(markdown) {
  const blocks = []
  let paragraph = []
  let inCode = false
  let inFrontmatter = markdown.startsWith('---\n')
  const flush = () => {
    if (paragraph.length) blocks.push(paragraph.join(' '))
    paragraph = []
  }
  for (const sourceLine of markdown.split('\n')) {
    const line = sourceLine.trim()
    if (inFrontmatter) {
      if (line === '---' && blocks.frontmatterStarted) inFrontmatter = false
      blocks.frontmatterStarted = true
      continue
    }
    if (line.startsWith('```')) { flush(); inCode = !inCode; continue }
    if (inCode || line.startsWith('|') || line.startsWith('import ') || line.startsWith('<')) continue
    if (!line || line.startsWith('#')) { flush(); continue }
    if (/^(?:[-*]|\d+\.)\s/.test(line)) { flush(); blocks.push(line.replace(/^(?:[-*]|\d+\.)\s+/, '')); continue }
    paragraph.push(line)
  }
  flush()
  delete blocks.frontmatterStarted
  return blocks
}

function plainText(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`[^`]+`/g, ' technical-value ')
    .replace(/[>*_{}]/g, ' ')
}

function checkProse(content, name) {
  const contraction = /\b(?:can't|couldn't|doesn't|don't|isn't|it's|won't|you'll|you're|we're|they're|wasn't|weren't|shouldn't|mustn't)\b/i
  for (const block of proseBlocks(content)) {
    const text = plainText(block)
    assert(!contraction.test(text), `Contraction found in ${name}: ${block}`)
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      const words = sentence.match(/[A-Za-z0-9][A-Za-z0-9.-]*/g) ?? []
      assert(words.length <= 25, `Sentence has ${words.length} words in ${name}: ${sentence}`)
    }
  }
}

function sourceIds(text) {
  const ids = [...text.matchAll(/['`]([a-z][a-z0-9]*)['`]/gi)].map((match) => match[1].toLowerCase())
  return [...new Set(ids.filter((id) => expectedSet.has(id)))].sort()
}

const expectedSet = new Set(diagramTypeIds)
const editorSource = await source(join(repo, 'apps', 'editor', 'src', 'diagram-types.js'))
const rendererSource = await source(join(repo, 'renderers', 'edge', 'src', 'types.ts'))
assert(JSON.stringify(sourceIds(editorSource)) === JSON.stringify([...expectedSet].sort()), 'Editor diagram type IDs do not match the documentation catalog.')
assert(JSON.stringify(sourceIds(rendererSource)) === JSON.stringify([...expectedSet].sort()), 'Renderer diagram type IDs do not match the documentation catalog.')

const createNames = await readdir(join(docs, 'create', 'types'))
const styleNames = await readdir(join(docs, 'style', 'types'))
const exampleNames = await readdir(examples)
const expected = [...diagramTypeIds].sort()
assert(createNames.length === expected.length, `Expected ${expected.length} creation pages, found ${createNames.length}.`)
assert(styleNames.length === expected.length, `Expected ${expected.length} style pages, found ${styleNames.length}.`)
assert(JSON.stringify(idsFromNames(createNames)) === JSON.stringify(expected), 'Creation page IDs do not match the diagram type catalog.')
assert(JSON.stringify(idsFromNames(styleNames)) === JSON.stringify(expected), 'Style page IDs do not match the diagram type catalog.')
assert(exampleNames.length === expected.length, `Expected ${expected.length} rendered examples, found ${exampleNames.length}.`)
assert(JSON.stringify(exampleNames.filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5)).sort()) === JSON.stringify(expected), 'Rendered example IDs do not match the diagram type catalog.')

const catalogRaw = await source(join(site, 'static', 'diagram-types.json'))
let catalog
try { catalog = JSON.parse(catalogRaw) } catch { errors.push('static/diagram-types.json is not valid JSON.') }
assert(catalog?.diagramTypes?.length === expected.length, 'Machine catalog does not contain all diagram types.')
assert(JSON.stringify((catalog?.diagramTypes ?? []).map(({ id }) => id).sort()) === JSON.stringify(expected), 'Machine catalog IDs do not match the diagram type catalog.')

const expectedSkillIds = [...diagramSkillIds].sort()
const skillEntries = await readdir(skills, { withFileTypes: true })
const actualSkillIds = skillEntries.filter((entry) => entry.isDirectory()).map(({ name }) => name).sort()
const publicSkillIds = (await readdir(publicSkills, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map(({ name }) => name).sort()
assert(diagramSkillIds.length === 39, `Expected 39 semantic skills, found ${diagramSkillIds.length} in the catalog.`)
assert(new Set(diagramSkillIds).size === diagramSkillIds.length, 'Semantic skill catalog contains duplicate IDs.')
assert(JSON.stringify(actualSkillIds) === JSON.stringify(expectedSkillIds), 'Source skill directories do not match the semantic skill catalog.')
assert(JSON.stringify(publicSkillIds) === JSON.stringify(expectedSkillIds), 'Published skill directories do not match the semantic skill catalog.')

const skillCatalogRaw = await source(join(site, 'static', 'diagram-skills.json'))
let skillCatalog
try { skillCatalog = JSON.parse(skillCatalogRaw) } catch { errors.push('static/diagram-skills.json is not valid JSON.') }
assert(skillCatalog?.version === 1, 'Semantic skill catalog has the wrong version.')
assert(JSON.stringify(skillCatalog?.groups ?? []) === JSON.stringify(skillGroups), 'Published semantic skill groups do not match the source catalog.')
assert(JSON.stringify((skillCatalog?.skills ?? []).map(({ id }) => id).sort()) === JSON.stringify(expectedSkillIds), 'Published semantic skill IDs do not match the source catalog.')
assert(JSON.stringify(skillCatalog?.standards ?? []) === JSON.stringify(standardsSupport), 'Published standards support data does not match the source catalog.')
for (const standard of standardsSupport) {
  assert(standard.relatedSkills.every((id) => diagramSkillIds.includes(id)), `Standard ${standard.id} references an unknown semantic skill.`)
  assert(['source-supported', 'visual-subset', 'visual-conventions', 'unsupported'].includes(standard.status), `Standard ${standard.id} has an unknown support status.`)
}

for (const entry of diagramSkills) {
  const skillFile = join(skills, entry.id, 'SKILL.md')
  const content = await source(skillFile)
  const metadata = skillFrontmatter(content)
  assert(metadata, `Skill ${entry.id} has no valid frontmatter.`)
  assert(metadata?.name === entry.id, `Skill ${entry.id} frontmatter name does not match its directory.`)
  assert(Boolean(metadata?.description), `Skill ${entry.id} has no description.`)
  assert((metadata?.description?.length ?? 0) <= 1024, `Skill ${entry.id} description exceeds 1024 characters.`)
  assert(content.split('\n').length <= 500, `Skill ${entry.id} exceeds 500 lines.`)
  assert(metadata?.disableModelInvocation !== 'false', `Skill ${entry.id} must omit disable-model-invocation instead of setting it false.`)
  assert((metadata?.disableModelInvocation === 'true') === (entry.id === 'diagram-workshop'), `Skill ${entry.id} has the wrong invocation policy.`)
  assert(!/kroki/i.test(content), `Forbidden project name found in skills/${entry.id}/SKILL.md.`)

  const referenceDir = join(skills, entry.id, 'references')
  const packageFiles = await filesBelow(join(skills, entry.id))
  const referenceFiles = packageFiles.filter((path) => path.startsWith(`${referenceDir}/`) && path.endsWith('.md'))
  for (const path of referenceFiles) {
    assert(content.includes(relative(join(skills, entry.id), path)), `Skill ${entry.id} does not link reference ${relative(referenceDir, path)}.`)
  }
  for (const target of relativeMarkdownLinks(content)) {
    const resolved = resolve(join(skills, entry.id), target)
    assert(packageFiles.includes(resolved), `Skill ${entry.id} links missing file ${target}.`)
  }
  for (const path of packageFiles) {
    const packageContent = await source(path)
    assert(!/kroki/i.test(packageContent), `Forbidden project name found in ${relative(repo, path)}.`)
  }

  const publishedFiles = (await filesBelow(join(publicSkills, entry.id))).map((path) => relative(join(publicSkills, entry.id), path)).sort()
  const sourceFiles = packageFiles.map((path) => relative(join(skills, entry.id), path)).sort()
  assert(JSON.stringify(publishedFiles) === JSON.stringify(sourceFiles), `Published package ${entry.id} does not match its source files.`)
}

const workshopOpenAI = await source(join(skills, 'diagram-workshop', 'agents', 'openai.yaml'))
assert(/allow_implicit_invocation:\s*false/.test(workshopOpenAI), 'Diagram workshop must disable implicit OpenAI invocation.')

for (const id of expected) {
  const type = diagramTypes.find((item) => item.id === id)
  const create = await source(join(docs, 'create', 'types', `${id}.md`))
  const style = await source(join(docs, 'style', 'types', `${id}.md`))
  assert(/^---\n(?:.*\n)*?id: create-/.test(create), `Creation page ${id} has invalid frontmatter.`)
  assert(/^---\n(?:.*\n)*?id: style-/.test(style), `Style page ${id} has invalid frontmatter.`)
  assert(create.includes(`/style/types/${id}`), `Creation page ${id} has no paired style link.`)
  assert(create.includes(`<DiagramExample engine="${id}"`), `Creation page ${id} has no rendered example.`)
  assert(style.includes(`/create/types/${id}`), `Style page ${id} has no paired creation link.`)
  assert(style.includes('## Source controls'), `Style page ${id} has no source controls.`)
  assert(style.includes('## Renderer options') === Boolean(type.rendererOptions?.length), `Style page ${id} has the wrong renderer options section.`)
  const renderedExample = JSON.parse(await source(join(examples, `${id}.json`)))
  assert(renderedExample.engine === id, `Rendered example ${id} has the wrong engine.`)
  assert(typeof renderedExample.source === 'string' && renderedExample.source.trim(), `Rendered example ${id} has no source.`)
  assert(!/kroki/i.test(renderedExample.source), `Forbidden project name found in rendered example ${id}.`)
  checkProse(create, `create/types/${id}.md`)
  checkProse(style, `style/types/${id}.md`)
}

const documentationFiles = (await filesBelow(docs)).filter((path) => /\.mdx?$/.test(path))
for (const path of [...documentationFiles, ...publicFiles]) {
  const content = await source(path)
  assert(!/kroki/i.test(content), `Forbidden project name found in ${relative(site, path)}.`)
  if (/\.mdx?$/.test(path)) checkProse(content, relative(docs, path))
}

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
const firstPartyTextFiles = trackedFiles
  .filter((path) => /\.(?:cjs|js|json|jsonc|md|mdx|mjs|py|toml|ts|tsx|yaml|yml)$/.test(path))
  .filter((path) => !path.startsWith('vendor/') && !path.includes('/vendor/'))
const legacyPath = /(?:ci\/tests\/diagrams|diagramzip-(?:api|client-units|docs|python-units|render|shell|svg)\/|diagrams\.net\/assets|diagramzip\/(?:PERSISTENCE\.md|dist\/|src\/|test\/))/
const segmentedLegacyCorpus = /(?:['"]ci['"]\s*,\s*['"]tests['"]\s*,\s*['"]diagrams['"]|['"]ci['"]\s*\/\s*['"]tests['"]\s*\/\s*['"]diagrams['"])/
for (const path of firstPartyTextFiles) {
  const content = await source(join(repo, path))
  assert(!legacyPath.test(content) && !segmentedLegacyCorpus.test(content), `Legacy repository path found in ${path}.`)
}
const repositoryProseFiles = trackedFiles
  .filter((path) => basename(path) === 'README.md' || (path.startsWith('docs/') && /\.mdx?$/.test(path)))
  .filter((path) => !path.startsWith('vendor/') && !path.includes('/vendor/'))
for (const path of repositoryProseFiles) {
  checkProse(await source(join(repo, path)), path)
}

if (errors.length) { console.error(errors.map((error) => `ERROR: ${error}`).join('\n')); process.exitCode = 1 } else console.log(`Documentation checks passed for ${expected.length} renderer types, ${expectedSkillIds.length} semantic skills, and ${repositoryProseFiles.length} repository prose files.`)
