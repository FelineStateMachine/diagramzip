import { RenderError } from './errors'

export type StructurizrKind = 'person' | 'softwareSystem' | 'container' | 'component' | 'deploymentNode' | 'infrastructureNode' | 'containerInstance' | 'softwareSystemInstance'
export interface StructurizrElement { id: string; kind: StructurizrKind; name: string; description: string; technology: string; tags: string[]; parent?: string; modelRef?: string; environment?: string }
export interface StructurizrRelationship { from: string; to: string; description: string; technology: string }
export interface StructurizrStyle { background?: string; color?: string; fontSize?: number; shape?: string; opacity?: number }
export interface StructurizrView { kind: string; key: string; scope?: string; includes: string[]; relationships: StructurizrRelationship[]; direction?: string; animations: string[] }
export interface StructurizrWorkspace { name: string; elements: StructurizrElement[]; relationships: StructurizrRelationship[]; views: StructurizrView[]; styles: Map<string, StructurizrStyle>; themes: string[] }

const MAX_LINES = 20_000
const MAX_ELEMENTS = 4_000
const MAX_RELATIONSHIPS = 12_000
const MAX_NESTING = 48
const DECLARATIONS = new Set(['person', 'softwareSystem', 'softwaresystem', 'container', 'component', 'deploymentNode', 'infrastructureNode', 'containerInstance', 'softwareSystemInstance'])
const VIEW_KINDS = new Set(['systemlandscape', 'systemcontext', 'container', 'component', 'dynamic', 'deployment'])

function fail(message: string): never { throw new RenderError(422, 'invalid_structurizr', message) }

function stripComments(source: string): string[] {
  const lines: string[] = []; let block = false
  for (const original of source.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')) {
    let line = ''; let quote = false
    for (let i = 0; i < original.length; i++) {
      const two = original.slice(i, i + 2)
      if (block) { if (two === '*/') { block = false; i++ } continue }
      if (!quote && two === '/*') { block = true; i++; continue }
      const ch = original[i]!
      if (ch === '"') { quote = !quote; line += ch; continue }
      if (!quote && ch === '#' && /\s|$/.test(original[i + 1] ?? '')) break
      line += ch
    }
    lines.push(line)
  }
  if (block) fail('Unterminated block comment.')
  return lines
}

function args(text: string): string[] {
  const result: string[] = []; let value = ''; let quote = false; let escaped = false
  const flush = () => { if (value.trim()) result.push(value.trim()); value = '' }
  for (const ch of text.trim()) {
    if (escaped) { value += ch; escaped = false; continue }
    if (quote && ch === '\\') { value += ch; escaped = true; continue }
    if (ch === '"') { quote = !quote; value += ch; continue }
    if (!quote && /\s/.test(ch)) { flush(); continue }
    value += ch
  }
  if (quote) fail('Unterminated string literal.')
  flush(); return result
}

function unquote(value: string | undefined): string {
  const v = value ?? ''
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replaceAll('\\"', '"').replaceAll('\\n', '\n').replaceAll('\\\\', '\\')
  return v
}

function declaration(line: string): { id: string; kind: string; values: string[] } | undefined {
  const match = line.match(/^(?:(?<id>[A-Za-z_][\w.-]*)\s*=\s*)?(?<kind>[A-Za-z][\w]*)\s+(?<rest>.*)$/)
  if (!match || !DECLARATIONS.has(match.groups!.kind!)) return undefined
  return { id: match.groups!.id ?? '', kind: match.groups!.kind!, values: args(match.groups!.rest!) }
}

function relation(line: string): StructurizrRelationship | undefined {
  const match = line.match(/^(\S+)\s*->\s*(\S+)(?:\s+("(?:\\.|[^"\\])*"))?(?:\s+("(?:\\.|[^"\\])*"))?$/)
  return match ? { from: match[1]!, to: match[2]!, description: unquote(match[3]), technology: unquote(match[4]) } : undefined
}

function styleValue(value: string): string { return unquote(value) }
const COLORS = /^(?:#[0-9a-f]{3,8}|(?:black|white|red|green|blue|yellow|orange|purple|gray|grey|transparent))$/i
const SHAPES = new Set(['rectangle', 'roundrectangle', 'roundedbox', 'circle', 'hexagon', 'person', 'node', 'webbrowser', 'mobiledevicelandscape', 'cylinder'])
function validateStyle(tag: string, key: string, value: string): void {
  if ((key === 'background' || key === 'color') && !COLORS.test(value)) fail(`Unsupported ${key} color for style ${tag}.`)
  if (key === 'shape' && !SHAPES.has(value.toLowerCase())) fail(`Unsupported shape for style ${tag}.`)
  if (key === 'fontSize' && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 96)) fail(`Invalid fontSize for style ${tag}.`)
  if (key === 'opacity' && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 100)) fail(`Invalid opacity for style ${tag}.`)
}

export function parseStructurizr(source: string): StructurizrWorkspace {
  const lines = stripComments(source); if (lines.length > MAX_LINES) fail('Structurizr source has too many lines.')
  const workspace: StructurizrWorkspace = { name: '', elements: [], relationships: [], views: [], styles: new Map(), themes: [] }
  const stack: Array<{ kind: string; value?: unknown; owner?: string }> = []
  let currentView: StructurizrView | undefined
  let currentStyle: { tag: string; relationship: boolean } | undefined
  let generated = 0
  const context = () => stack.at(-1)?.kind ?? ''
  const owner = () => [...stack].reverse().find(item => item.owner)?.owner
  const push = (item: { kind: string; value?: unknown; owner?: string }) => {
    if (stack.length >= MAX_NESTING) fail('Structurizr nesting is too deep.')
    stack.push(item)
  }
  const addElement = (item: StructurizrElement) => {
    if (++generated > MAX_ELEMENTS) fail('Structurizr workspace has too many elements.')
    if (workspace.elements.some(existing => existing.id === item.id)) fail(`Duplicate element identifier: ${item.id}.`)
    workspace.elements.push(item)
  }
  const parseBlockOpen = (line: string): string => line.replace(/\s*\{\s*$/, '').trim()
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    let line = lines[lineNumber]!.trim(); if (!line) continue
    if (line === '}') {
      const closed = stack.pop()?.kind
      if (closed === 'view') currentView = undefined
      if (closed === 'style') currentStyle = undefined
      continue
    }
    const opens = line.endsWith('{'); if (opens) line = parseBlockOpen(line)
    if (line.startsWith('workspace')) {
      const values = args(line.slice('workspace'.length)); workspace.name = unquote(values[0]);
      if (opens) push({ kind: 'workspace' }); continue
    }
    if (line === 'model') { if (opens) push({ kind: 'model' }); continue }
    if (line === 'views') { if (opens) push({ kind: 'views' }); continue }
    if (/^group\s+/i.test(line) && opens) { const values = args(line.replace(/^group\s+/i, '')); push({ kind: 'group', value: unquote(values[0]) }); continue }
    if (/^(?:[A-Za-z_][\w.-]*\s*=\s*)?deploymentEnvironment\b/i.test(line) && opens) { const match = line.match(/^(?:(?<id>[A-Za-z_][\w.-]*)\s*=\s*)?deploymentEnvironment\s*(?<rest>.*)$/i)!; const values = args(match.groups!.rest!); push({ kind: 'deployment', value: unquote(values[0]) }); continue }
    if (/^(?:[A-Za-z_][\w.-]*\s*=\s*)?deploymentNode\b/i.test(line) && opens) {
      const d = declaration(line); if (!d) fail(`Invalid deployment node at line ${lineNumber + 1}.`); const values = d.values
      const id = d.id || `deployment_${workspace.elements.length}`
      addElement({ id, kind: 'deploymentNode', name: unquote(values[0]), description: unquote(values[1]), technology: unquote(values[2]), tags: [], environment: stack.find(item => item.kind === 'deployment')?.value as string | undefined, parent: owner() && workspace.elements.find(item => item.id === owner() && item.kind === 'deploymentNode') ? owner() : undefined }); push({ kind: 'deploymentNode', owner: id }); continue
    }
    if (/^(?:[A-Za-z_][\w.-]*\s*=\s*)?infrastructureNode\b/i.test(line) && opens) {
      const d = declaration(line); if (!d) fail(`Invalid infrastructure node at line ${lineNumber + 1}.`); const values = d.values
      const id = d.id || `infrastructure_${workspace.elements.length}`
      addElement({ id, kind: 'infrastructureNode', name: unquote(values[0]), description: unquote(values[1]), technology: unquote(values[2]), tags: [], environment: stack.find(item => item.kind === 'deployment')?.value as string | undefined, parent: owner() && workspace.elements.find(item => item.id === owner() && item.kind === 'deploymentNode') ? owner() : undefined }); push({ kind: 'deploymentNode', owner: id }); continue
    }
    if (context() === 'views' && opens && !/^styles\b/i.test(line)) {
      const parts = args(line); const kind = parts.shift()?.toLowerCase() ?? ''; if (!VIEW_KINDS.has(kind)) fail(`Unsupported Structurizr view: ${kind}.`)
      const view: StructurizrView = { kind, key: '', scope: '', includes: [], relationships: [], animations: [] }
      if (kind === 'systemlandscape') view.key = unquote(parts[0]) || 'SystemLandscape'
      else if (kind === 'systemcontext' || kind === 'container' || kind === 'component' || kind === 'dynamic') { view.scope = unquote(parts[0]); view.key = unquote(parts[1]) || `${kind}_${view.scope}` }
      else { view.scope = unquote(parts[1]) || unquote(parts[0]); view.key = unquote(parts[2]) || unquote(parts[1]) || `${kind}_${view.scope}` }
      workspace.views.push(view); currentView = view; push({ kind: 'view' }); continue
    }
    const d = declaration(line)
    if (d && ['containerInstance', 'softwareSystemInstance'].includes(d.kind)) { const values = d.values; const target = workspace.elements.find(item => item.id === unquote(values[0])); if (!target) fail(`Unknown instance target: ${values[0]}.`); addElement({ id: d.id || `${d.kind}_${workspace.elements.length}`, kind: d.kind as StructurizrKind, name: target.name, description: unquote(values[1]) || target.description, technology: unquote(values[2]) || target.technology, tags: [...target.tags], modelRef: target.id, environment: stack.find(item => item.kind === 'deployment')?.value as string | undefined, parent: owner() && workspace.elements.find(item => item.id === owner() && item.kind === 'deploymentNode') ? owner() : undefined }); continue }
    if (d && DECLARATIONS.has(d.kind)) {
      const kind = d.kind.toLowerCase() === 'softwaresystem' ? 'softwareSystem' : d.kind as StructurizrKind
      const values = d.values; const current = owner() ? workspace.elements.find(item => item.id === owner()) : undefined
      const parent = current && ['softwareSystem', 'container'].includes(current.kind) ? current.id : undefined
      const id = d.id || `${kind}_${workspace.elements.length}`
      addElement({ id, kind, name: unquote(values[0]), description: unquote(values[1]), technology: unquote(values[2]), tags: unquote(values[3]).split(',').map(tag => tag.trim()).filter(Boolean), parent });
      if (opens) push({ kind: kind as string, owner: id }); continue
    }
    if (/^tags\s+/i.test(line)) { const tags = args(line.replace(/^tags\s+/i, '')).map(unquote); const element = owner() ? workspace.elements.find(item => item.id === owner()) : undefined; if (element) element.tags.push(...tags); continue }
    if (/^description\s+/i.test(line)) { const element = owner() ? workspace.elements.find(item => item.id === owner()) : undefined; if (element) element.description = unquote(args(line.replace(/^description\s+/i, ''))[0]); else fail(`Description has no owning element at line ${lineNumber + 1}.`); continue }
    if (line.startsWith('views')) continue
    if (currentView) {
      if (/^include\s+\*/i.test(line)) { currentView.includes.push('*'); continue }
      if (/^include\s+/i.test(line)) { currentView.includes.push(...args(line.replace(/^include\s+/i, '')).map(unquote)); continue }
      if (/^auto?layout\b/i.test(line)) { currentView.direction = args(line.replace(/^auto?layout\s*/i, ''))[0]; continue }
      if (line.toLowerCase() === 'animation' && opens) { push({ kind: 'animation' }); continue }
      const dynamicRelation = relation(line); if (dynamicRelation) { currentView.relationships.push(dynamicRelation); continue }
    }
    if (context() === 'animation') { const ids = line.replace(/^[0-9]+\s*:\s*/, '').split(/\s+/).filter(token => /^[A-Za-z_][\w.-]*$/.test(token)); currentView?.animations.push(...ids); continue }
    if (context() === 'model' || context() === 'deployment' || context() === 'deploymentNode') { const r = relation(line); if (r) { if (workspace.relationships.push(r) > MAX_RELATIONSHIPS) fail('Structurizr workspace has too many relationships.'); continue } }
    if (/^theme\s+/i.test(line) || /^themes\s+/i.test(line)) {
      const themes = args(line.replace(/^themes?\s+/i, '')).map(unquote)
      for (const theme of themes) if (theme !== 'default' && !/^https:\/\/static\.structurizr\.com\/themes\/(?:amazon-web-services|google-cloud-platform|kubernetes|microsoft-azure|oracle-cloud-infrastructure)(?:[-/][\w.-]+)*\/?$/i.test(theme)) fail(`Unsupported Structurizr theme: ${theme}.`)
      workspace.themes.push(...themes); continue
    }
    if (context() === 'styles' && opens && /^(element|relationship)\s+/i.test(line)) { const values = args(line.replace(/^(?:element|relationship)\s+/i, '')); currentStyle = { tag: unquote(values[0]), relationship: /^relationship/i.test(line) }; push({ kind: 'style' }); continue }
    if (context() === 'style' && currentStyle) {
      const match = line.match(/^(\w+)\s+(.+)$/); const key = match?.[1] ?? ''; const value = styleValue(match?.[2] ?? ''); if (['fontSize', 'opacity', 'background', 'color', 'shape'].includes(key)) { validateStyle(currentStyle.tag, key, value); const style = workspace.styles.get(currentStyle.tag) ?? {}; if (key === 'fontSize' || key === 'opacity') (style as Record<string, unknown>)[key] = Number(value); else (style as Record<string, unknown>)[key] = value; workspace.styles.set(currentStyle.tag, style) } continue
    }
    if (line === 'styles' && opens) { push({ kind: 'styles' }); continue }
    if (line.startsWith('!')) fail(`Structurizr directive is not supported: ${line.split(/\s/)[0]}.`)
    if (line !== 'include *' && line !== 'autoLayout' && line !== 'autolayout') fail(`Unsupported Structurizr syntax at line ${lineNumber + 1}: ${line.slice(0, 100)}`)
  }
  if (stack.length) fail('Unclosed Structurizr block.')
  if (!workspace.views.length) fail('Empty diagram, does not have any view.')
  return workspace
}

function plantEscape(value: string): string { return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n') }
function alias(value: string): string { return `s_${value.replace(/[^A-Za-z0-9_]/g, '_')}` }
function implicitTag(kind: StructurizrKind): string { return ({ person: 'Person', softwareSystem: 'Software System', container: 'Container', component: 'Component', deploymentNode: 'Deployment Node', infrastructureNode: 'Infrastructure Node', containerInstance: 'Container', softwareSystemInstance: 'Software System' } as Record<StructurizrKind, string>)[kind] }

export function lowerStructurizr(workspace: StructurizrWorkspace, options: Record<string, string>): string {
  if (Object.keys(options).some(key => key !== 'view-key' && key !== 'output')) fail('Unsupported Structurizr option.')
  const viewKey = options['view-key']; const view = viewKey ? workspace.views.find(item => item.key === viewKey) : workspace.views[0]
  if (!view) fail(`Unable to find view for key: ${viewKey}.`)
  const output = (options.output ?? 'diagram').trim() || 'diagram'; if (output !== 'diagram' && output !== 'legend') fail(`Unknown output option: ${output}.`)
  if (output === 'legend') return '@startuml\nlegend\n|= Tag |= Background |\n' + [...workspace.styles.entries()].map(([tag, style]) => `| ${plantEscape(tag)} | ${plantEscape(style.background ?? '')} |`).join('\n') + '\nendlegend\n@enduml'
  const byId = new Map(workspace.elements.map(item => [item.id, item]))
  const selected = new Set<string>()
  if (view.kind === 'systemlandscape') { for (const item of workspace.elements) if (item.kind === 'person' || item.kind === 'softwareSystem') selected.add(item.id) }
  else if (view.kind === 'systemcontext') { if (view.scope && byId.has(view.scope)) selected.add(view.scope) }
  else if (view.kind === 'container') { if (view.scope && byId.has(view.scope)) for (const item of workspace.elements) if (item.parent === view.scope && item.kind === 'container') selected.add(item.id) }
  else if (view.kind === 'component') { if (view.scope && byId.has(view.scope)) for (const item of workspace.elements) if (item.parent === view.scope && item.kind === 'component') selected.add(item.id) }
  else if (view.kind === 'deployment') { const env = view.scope; for (const item of workspace.elements) if (['deploymentNode', 'infrastructureNode', 'containerInstance', 'softwareSystemInstance'].includes(item.kind) && (!env || item.environment?.toLowerCase() === env.toLowerCase())) selected.add(item.id) }
  else for (const item of workspace.elements) selected.add(item.id)
  for (const id of view.includes) if (id !== '*' && byId.has(id)) selected.add(id)
  const viewRelationships = view.kind === 'dynamic' ? view.relationships : workspace.relationships
  if (view.kind === 'dynamic') {
    for (const item of viewRelationships) { selected.add(item.from); selected.add(item.to) }
  } else if (view.kind !== 'deployment') {
    const seed = new Set(selected)
    const relatedKindAllowed = (id: string): boolean => {
      const element = byId.get(id)
      if (!element) return false
      if (view.kind === 'systemcontext') return element.kind === 'person' || element.kind === 'softwareSystem'
      if (view.kind === 'container') return element.kind === 'person' || element.kind === 'softwareSystem' || element.kind === 'container'
      if (view.kind === 'component') return element.kind !== 'component' || element.parent === view.scope
      return true
    }
    for (const item of viewRelationships) {
      if (seed.has(item.from) && relatedKindAllowed(item.to)) selected.add(item.to)
      if (seed.has(item.to) && relatedKindAllowed(item.from)) selected.add(item.from)
    }
  }
  const lines = ['@startuml', view.direction?.toLowerCase() === 'lr' ? 'left to right direction' : 'top to bottom direction']
  const styleIds = new Map<string, string>(); let styleIndex = 0
  for (const [tag, style] of workspace.styles) { const id = `style_${styleIndex++}`; styleIds.set(tag, id); if (style.background) lines.push(`skinparam rectangle<<${id}>> BackgroundColor ${style.background}`); if (style.color) lines.push(`skinparam rectangle<<${id}>> FontColor ${style.color}`); if (style.fontSize) lines.push(`skinparam rectangle<<${id}>> FontSize ${style.fontSize}`); if (style.opacity !== undefined) lines.push(`skinparam rectangle<<${id}>> Transparency ${100 - style.opacity}`); if (style.shape === 'roundrectangle' || style.shape === 'roundedbox') lines.push(`skinparam rectangle<<${id}>> RoundCorner 20`) }
  for (const element of workspace.elements) {
    if (!selected.has(element.id)) continue
    const text = `${plantEscape(element.name)}${element.description ? `\\n[${plantEscape(element.description)}]` : ''}`
    const tags = [implicitTag(element.kind), ...element.tags].filter((tag, index, all) => all.indexOf(tag) === index)
    const stereotypes = tags.map(tag => styleIds.get(tag)).filter(Boolean).map(id => `<<${id}>>`).join('')
    const style = tags.map(tag => workspace.styles.get(tag)).find(Boolean)
    const color = style?.background ? ` ${style.background}` : ''
    const shape = tags.map(tag => workspace.styles.get(tag)?.shape).find(Boolean)?.toLowerCase()
    const type = element.kind === 'person' || shape === 'person' ? 'actor' : element.kind === 'infrastructureNode' || element.kind === 'deploymentNode' || shape === 'node' ? 'node' : shape === 'circle' ? 'circle' : shape === 'cylinder' ? 'database' : 'rectangle'
    lines.push(`${type} "${text}" as ${alias(element.id)}${stereotypes}${color}`)
  }
  const relationships = viewRelationships
  for (const item of relationships) {
    if (!selected.has(item.from) || !selected.has(item.to)) continue
    const label = plantEscape(item.description + (item.technology ? ` [${item.technology}]` : ''))
    lines.push(`${alias(item.from)} --> ${alias(item.to)}${label ? ` : ${label}` : ''}`)
  }
  lines.push('@enduml'); return lines.join('\n')
}
