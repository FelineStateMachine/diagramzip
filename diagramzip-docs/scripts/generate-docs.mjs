import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diagramTypes } from '../data/diagram-types.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const site = join(root, '..')
const docs = join(site, 'docs')
const typesDir = join(docs, 'create', 'types')
const styleDir = join(docs, 'style', 'types')
const staticDir = join(site, 'static')
const examplesDir = join(staticDir, 'examples')

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
    ? await readFile(join(site, '..', 'ci', 'tests', 'diagrams', fixture), 'utf8')
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

function options(type) {
  return `| Option | Values | Purpose |\n| --- | --- | --- |\n${type.rendererOptions.map((item) => `| \`${inline(item.name)}\` | ${inline(item.values)} | ${inline(item.description)} |`).join('\n')}\n`
}

function syntaxPage(type, interactive = true) {
  const limitations = lines(type.limitations)
  const article = articleFor(type.label)
  return frontmatter(type, 'create', `Create ${article} ${type.label} diagram in diagram.zip.`) +
`${interactive ? "import DiagramExample from '@site/src/components/DiagramExample';\n\n" : ''}# ${type.label}\n\n${type.summary}\n\n## Use this type\n\n${type.use}\n\n## Source format\n\nThe source format is **${type.format}**. Enter the source in the diagram.zip editor.\n\n## Syntax essentials\n\n${lines(type.syntax).map((item) => `- ${item}`).join('\n')}\n\n${example(type, interactive)}\n` +
(limitations.length ? `## Limitations\n\n${limitations.map((item) => `- ${item}`).join('\n')}\n\n` : '') +
`## Related pages\n\n- [Style ${type.label}](${stylePath(type.id)})\n- [General presentation settings](/style/presentation)\n- [Open ${type.label} in the editor](${editorLink(type.id)})\n\n## Upstream reference\n\n[${type.label} documentation](${type.upstream})\n`
}

function stylePage(type) {
  const limitations = lines(type.limitations)
  const article = articleFor(type.label)
  const rendererOptions = type.rendererOptions?.length
    ? `\n## Renderer options\n\n${options(type)}\n`
    : ''
  return frontmatter(type, 'style', `Style a ${type.label} diagram in diagram.zip.`) +
`# Style ${type.label}\n\n${type.styleSummary}\n\nStart with the [general presentation settings](/style/presentation). They control the canvas background, padding, and frame for every diagram.\n\n## Source controls\n\n${lines(type.sourceStyle).map((item) => `- ${item}`).join('\n')}\n${rendererOptions}` +
(limitations.length ? `## Limitations\n\n${limitations.map((item) => `- ${item}`).join('\n')}\n\n` : '') +
`## Related pages\n\n- [Create ${article} ${type.label} diagram](${syntaxPath(type.id)})\n- [General presentation settings](/style/presentation)\n- [Open ${type.label} in the editor](${editorLink(type.id)})\n`
}

const catalog = diagramTypes.map((type) => ({
  id: type.id,
  label: type.label,
  category: type.category,
  format: type.format,
  language: type.language,
  upstream: type.upstream,
  create: syntaxPath(type.id),
  style: stylePath(type.id),
  editor: editorLink(type.id),
  example: `/examples/${type.id}.json`,
}))
const fullText = () => diagramTypes.map((type) => `${syntaxPage(type, false)}\n${stylePage(type)}`).join('\n---\n\n')

await rm(join(docs, 'create', 'types'), { recursive: true, force: true })
await rm(join(docs, 'style', 'types'), { recursive: true, force: true })
await rm(examplesDir, { recursive: true, force: true })
await mkdir(typesDir, { recursive: true })
await mkdir(styleDir, { recursive: true })
await mkdir(staticDir, { recursive: true })
await mkdir(examplesDir, { recursive: true })

await Promise.all(diagramTypes.flatMap((type) => [
  writeFile(join(typesDir, `${type.id}.md`), syntaxPage(type)),
  writeFile(join(styleDir, `${type.id}.md`), stylePage(type)),
  writeFile(join(examplesDir, `${type.id}.json`), `${JSON.stringify(completeExamples[type.id], null, 2)}\n`),
]))
await writeFile(join(staticDir, 'diagram-types.json'), `${JSON.stringify({ version: 1, diagramTypes: catalog }, null, 2)}\n`)
await writeFile(join(staticDir, 'llms.txt'), `# diagram.zip documentation\n\n> Use these stable pages to create, style, save, and share diagrams.\n\n${diagramTypes.map((type) => `- [${type.label} syntax](https://docs.diagram.zip${syntaxPath(type.id)}/): Create ${articleFor(type.label)} ${type.label} diagram. [Style](https://docs.diagram.zip${stylePath(type.id)}/).`).join('\n')}\n\n## General pages\n\n- [General presentation](https://docs.diagram.zip/style/presentation/)\n- [Share a diagram](https://docs.diagram.zip/collaboration/sharing/)\n- [Password encryption](https://docs.diagram.zip/collaboration/encryption/)\n- [Working state and saved state](https://docs.diagram.zip/collaboration/working-and-saved-state/)\n\n## Structured catalog\n\n- [diagram-types.json](https://docs.diagram.zip/diagram-types.json)\n- [Full text reference](https://docs.diagram.zip/llms-full.txt)\n- [Source repository](https://github.com/FelineStateMachine/diagramzip)\n`)
await writeFile(join(staticDir, 'llms-full.txt'), `# diagram.zip documentation\n\n${fullText()}`)

console.log(`Generated ${diagramTypes.length} creation pages, ${diagramTypes.length} style pages, and machine-readable indexes.`)
