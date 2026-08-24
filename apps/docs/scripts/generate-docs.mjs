import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diagramTypes } from '../data/diagram-types.mjs'
import { diagramSkills, skillGroups, standardsSupport } from '../../../skills/catalog.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const site = join(root, '..')
const docs = join(site, 'docs')
const typesDir = join(docs, 'create', 'types')
const styleDir = join(docs, 'style', 'types')
const staticDir = join(site, 'static')
const examplesDir = join(staticDir, 'examples')
const repo = join(site, '..', '..')
const skillsDir = join(repo, 'skills')
const publicSkillsDir = join(staticDir, 'skills')

const completeExampleFixtures = {
  bpmn: 'example.bpmn',
  diagramsnet: 'diagramsnet-venn.xml',
  erd: 'schema.erd',
  excalidraw: 'venn.excalidraw',
  goat: 'components.goat',
  structurizr: 'gettingstarted.structurizr',
  tikz: 'periodic-table.tex',
  umlet: 'umlet.xml',
}

const completeExamples = Object.fromEntries(await Promise.all(diagramTypes.map(async (type) => {
  const fixture = completeExampleFixtures[type.id]
  const source = fixture
    ? await readFile(join(repo, 'examples', 'diagrams', fixture), 'utf8')
    : (Array.isArray(type.example) ? type.example : []).join('\n')
  return [type.id, {engine: type.id, source, sourceKind: fixture ? 'project-example' : 'page-example'}]
})))

const fence = (type) => type === 'json' ? 'json' : type === 'xml' ? 'xml' : type === 'yaml' ? 'yaml' : type === 'sql' ? 'sql' : type === 'clojure' ? 'clojure' : 'text'
const lines = (value) => Array.isArray(value) ? value : []
const inline = (value) => String(value ?? '').replace(/\n/g, ' ')
const editorLink = (id) => `https://diagram.zip/?type=${encodeURIComponent(id)}`
const syntaxPath = (id) => `/create/types/${id}`
const stylePath = (id) => `/style/types/${id}`
const articleFor = (label) => /^[aeiou]/i.test(label) ? 'an' : 'a'

function frontmatterValue(content, key) {
  const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? ''
  const value = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim()
  if (!value) return undefined
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value) } catch { return value.slice(1, -1) }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'")
  return value
}

const skillSources = Object.fromEntries(await Promise.all(diagramSkills.map(async (entry) => {
  const content = await readFile(join(skillsDir, entry.id, 'SKILL.md'), 'utf8')
  return [entry.id, {
    ...entry,
    name: frontmatterValue(content, 'name'),
    description: frontmatterValue(content, 'description'),
    userInvokableOnly: frontmatterValue(content, 'disable-model-invocation') === 'true',
    path: `/skills/${entry.id}/SKILL.md`,
  }]
})))

const skillCatalog = diagramSkills.map(({ id }) => skillSources[id])
const skillIndex = () => skillGroups.map((group) => {
  const entries = skillCatalog.filter((entry) => entry.group === group.id)
  return `## ${group.label}\n\n${entries.map((entry) => `- [${entry.label}](https://docs.diagram.zip${entry.path}): ${entry.description}${entry.userInvokableOnly ? ' Explicit user invocation only.' : ''}`).join('\n')}`
}).join('\n\n')

function frontmatter(type, section, description) {
  return `---\nid: ${section}-${type.id}\nslug: /${section}/types/${type.id}\ntitle: ${type.label}\ndescription: ${description}\nsidebar_label: ${type.label}\n---\n\n`
}

function example(type, interactive = true) {
  const content = type.showCompleteExample ? completeExamples[type.id].source.trimEnd() : lines(type.example).join('\n')
  const note = type.exampleComplete === false
    ? 'This source shows the document structure. It is not a complete document.\n\n'
    : ''
  const renderNote = completeExampleFixtures[type.id] && !type.showCompleteExample
    ? 'The rendered view uses a complete project example for this diagram type.\n\n'
    : ''
  const heading = type.exampleComplete === false ? '### Source structure' : '### Example'
  const rendered = interactive
    ? `\n${renderNote}<DiagramExample engine="${type.id}" label="${type.label}" sourceUrl="/examples/${type.id}.json" />\n`
    : ''
  return `${heading}\n\n${note}\`\`\`${fence(type.language)}\n${content}\n\`\`\`\n${rendered}`
}

function options(items) {
  return `| Option | Values | Purpose |\n| --- | --- | --- |\n${items.map((item) => `| \`${inline(item.name)}\` | ${inline(item.values)} | ${inline(item.description)} |`).join('\n')}\n`
}

function syntaxPage(type, interactive = true) {
  const limitations = lines(type.limitations)
  const authoringContract = lines(type.authoringContract)
  const article = articleFor(type.label)
  const origin = type.origin
    ? `## Origin\n\n${type.label} originates with [${type.origin.creator}](${type.origin.siteUrl}) at [${type.origin.site}](${type.origin.siteUrl}). ${type.origin.note}\n\n`
    : ''
  return frontmatter(type, 'create', `Create ${article} ${type.label} diagram in diagram.zip.`) +
`${interactive ? "import DiagramExample from '@site/src/components/DiagramExample';\n\n" : ''}# ${type.label}\n\n${type.summary}\n\n## Use this type\n\n${type.use}\n\n## Source format\n\nThe source format is **${type.format}**. Enter the source in the diagram.zip editor.\n\n## Syntax essentials\n\n${lines(type.syntax).map((item) => `- ${item}`).join('\n')}\n\n${example(type, interactive)}\n` +
(authoringContract.length ? `\n## Public authoring contract\n\n${authoringContract.map((item) => `- ${item}`).join('\n')}\n` : '') +
(origin) +
(limitations.length ? `## Limitations\n\n${limitations.map((item) => `- ${item}`).join('\n')}\n\n` : '') +
`## Related pages\n\n- [Style ${type.label}](${stylePath(type.id)})\n- [General presentation settings](/style/presentation)\n- [Open ${type.label} in the editor](${editorLink(type.id)})\n\n## Upstream reference\n\n[${type.label} documentation](${type.upstream})\n`
}

function stylePage(type) {
  const limitations = lines(type.limitations)
  const article = articleFor(type.label)
  const rendererOptions = type.rendererOptions?.length
    ? `\n## Renderer options\n\n${options(type.rendererOptions)}\n`
    : ''
  return frontmatter(type, 'style', `Style a ${type.label} diagram in diagram.zip.`) +
`# Style ${type.label}\n\n${type.styleSummary}\n\nStart with the [general presentation settings](/style/presentation). Edit shared or raw presentation in Details, and keep renderer-specific styling in Source.\n\n## Source controls\n\n${lines(type.sourceStyle).map((item) => `- ${item}`).join('\n')}\n${rendererOptions}` +
(limitations.length ? `## Limitations\n\n${limitations.map((item) => `- ${item}`).join('\n')}\n\n` : '') +
`## Related pages\n\n- [Create ${article} ${type.label} diagram](${syntaxPath(type.id)})\n- [General presentation settings](/style/presentation)\n- [SVG normalization and version contracts](/style/svg-normalization)\n- [Open ${type.label} in the editor](${editorLink(type.id)})\n`
}

const catalog = diagramTypes.map((type) => ({
  id: type.id,
  label: type.label,
  ...(type.fullName === undefined ? {} : { fullName: type.fullName }),
  category: type.category,
  format: type.format,
  language: type.language,
  upstream: type.upstream,
  create: syntaxPath(type.id),
  style: stylePath(type.id),
  editor: editorLink(type.id),
  example: `/examples/${type.id}.json`,
  ...(type.origin === undefined ? {} : { origin: type.origin }),
  ...(type.authoringContract === undefined ? {} : { authoringContract: type.authoringContract }),
}))
const coreDocPaths = [
  join(docs, 'create', 'index.md'),
  join(docs, 'style', 'presentation.md'),
  join(docs, 'style', 'svg-normalization.md'),
  join(docs, 'collaboration', 'sharing.md'),
  join(docs, 'collaboration', 'encryption.md'),
  join(docs, 'collaboration', 'working-and-saved-state.md'),
]
const fullText = async () => {
  const coreText = await Promise.all(coreDocPaths.map((path) => readFile(path, 'utf8')))
  const rendererText = diagramTypes.map((type) => `${syntaxPage(type, false)}\n${stylePage(type)}`)
  return [...coreText, ...rendererText].join('\n---\n\n')
}

await rm(join(docs, 'create', 'types'), { recursive: true, force: true })
await rm(join(docs, 'style', 'types'), { recursive: true, force: true })
await rm(examplesDir, { recursive: true, force: true })
await rm(publicSkillsDir, { recursive: true, force: true })
await mkdir(typesDir, { recursive: true })
await mkdir(styleDir, { recursive: true })
await mkdir(staticDir, { recursive: true })
await mkdir(examplesDir, { recursive: true })
await mkdir(publicSkillsDir, { recursive: true })

await Promise.all(diagramTypes.flatMap((type) => [
  writeFile(join(typesDir, `${type.id}.md`), syntaxPage(type)),
  writeFile(join(styleDir, `${type.id}.md`), stylePage(type)),
  writeFile(join(examplesDir, `${type.id}.json`), `${JSON.stringify(completeExamples[type.id], null, 2)}\n`),
]))
await Promise.all(diagramSkills.map(({ id }) => cp(join(skillsDir, id), join(publicSkillsDir, id), { recursive: true })))
await writeFile(join(staticDir, 'diagram-types.json'), `${JSON.stringify({ version: 1, diagramTypes: catalog }, null, 2)}\n`)
await writeFile(join(staticDir, 'diagram-skills.json'), `${JSON.stringify({ version: 1, groups: skillGroups, skills: skillCatalog, standards: standardsSupport }, null, 2)}\n`)
await writeFile(join(staticDir, 'llms.txt'), `# diagram.zip documentation\n\n> Choose the semantic story first. Use Source for notation and Details for metadata and presentation. Generated SVG and renderer internals are output, not authoring controls.\n\n- [Diagram routing skill](https://docs.diagram.zip/skills/diagramming/SKILL.md): Select a diagram family from the reader's question.\n- [Machine-readable semantic catalog](https://docs.diagram.zip/diagram-skills.json): Inspect every skill, use case, exclusion, role, and invocation constraint.\n\n${skillIndex()}\n\n## Renderer and source formats\n\n${diagramTypes.map((type) => `- [${type.label} syntax](https://docs.diagram.zip${syntaxPath(type.id)}/): ${type.fullName === undefined ? '' : `${type.label} stands for ${type.fullName}. `}Create ${articleFor(type.label)} ${type.label} diagram. [Style](https://docs.diagram.zip${stylePath(type.id)}/).${type.origin === undefined ? '' : ` Origin: [${type.origin.creator} at ${type.origin.site}](${type.origin.siteUrl}).`}`).join('\n')}\n\n## General pages\n\n- [Editor workspace](https://docs.diagram.zip/create/)\n- [Editable SVG files and local drafts](https://docs.diagram.zip/create/): Reopen validated enriched SVG files without publishing.\n- [Details JSON and presentation](https://docs.diagram.zip/style/presentation/)\n- [SVG normalization and version contracts](https://docs.diagram.zip/style/svg-normalization/)\n- [Share a diagram](https://docs.diagram.zip/collaboration/sharing/)\n- [Password encryption](https://docs.diagram.zip/collaboration/encryption/)\n- [Working state and saved state](https://docs.diagram.zip/collaboration/working-and-saved-state/)\n\n## Structured catalogs\n\n- [diagram-skills.json](https://docs.diagram.zip/diagram-skills.json)\n- [diagram-types.json](https://docs.diagram.zip/diagram-types.json)\n- [Full documentation text](https://docs.diagram.zip/llms-full.txt)\n- [Source repository](https://github.com/FelineStateMachine/diagramzip)\n`)
const llmsPath = join(staticDir, 'llms.txt')
const llmsIndex = await readFile(llmsPath, 'utf8')
await writeFile(llmsPath, llmsIndex.replace('Working state and saved state', 'Working state and published state'))
await writeFile(join(staticDir, 'llms-full.txt'), `# diagram.zip documentation\n\n${await fullText()}`)

console.log(`Generated ${diagramTypes.length} renderer guides, ${diagramSkills.length} semantic skill packages, and machine-readable indexes.`)
