import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diagramTypeIds, diagramTypes } from '../data/diagram-types.mjs'

const site = join(fileURLToPath(new URL('..', import.meta.url)))
const docs = join(site, 'docs')
const publicFiles = [join(site, 'static', 'llms.txt'), join(site, 'static', 'llms-full.txt'), join(site, 'static', 'diagram-types.json')]
const examples = join(site, 'static', 'examples')
const errors = []
const source = (path) => readFile(path, 'utf8')
const repo = join(site, '..')

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
const editorSource = await source(join(repo, 'diagramzip', 'src', 'diagram-types.js'))
const rendererSource = await source(join(repo, 'diagramzip-render', 'src', 'types.ts'))
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

if (errors.length) { console.error(errors.map((error) => `ERROR: ${error}`).join('\n')); process.exitCode = 1 } else console.log(`Documentation checks passed for ${expected.length} diagram types.`)
