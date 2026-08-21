import { RenderError } from '../../errors'

type EntityKind = 'person' | 'rectangle' | 'database' | 'queue'

function splitArgs(value: string): string[] {
  const result: string[] = []
  let start = 0; let depth = 0; let quote = false; let escaped = false
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (escaped) { escaped = false; continue }
    if (char === '\\' && quote) { escaped = true; continue }
    if (char === '"') { quote = !quote; continue }
    if (!quote && char === '(') depth++
    if (!quote && char === ')') depth--
    if (!quote && depth === 0 && char === ',') { result.push(value.slice(start, i).trim()); start = i + 1 }
  }
  result.push(value.slice(start).trim())
  return result
}

function unquote(value = ''): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1).replaceAll('\\"', '"')
  return trimmed
}

function alias(value: string, macro: string): string {
  const result = unquote(value)
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(result)) {
    throw new RenderError(400, 'invalid_c4', `${macro} has an invalid alias.`)
  }
  return result
}

function c4Text(value: string): string {
  return unquote(value).replaceAll('\r', '').replaceAll('\n', '\\n').replaceAll('"', '\\"')
}

function tags(value: string): string {
  const result = unquote(value).split(',').map(tag => tag.trim()).filter(Boolean)
  if (result.some(tag => !/^[A-Za-z0-9_.-]+$/.test(tag))) {
    throw new RenderError(400, 'invalid_c4', 'C4 tags may contain only letters, numbers, dots, underscores, and hyphens.')
  }
  return result.join(',')
}

function call(line: string): { name: string; args: string[] } | undefined {
  const match = line.trim().match(/^([A-Za-z][A-Za-z0-9_]*)\s*\((.*)\)\s*$/)
  return match ? { name: match[1]!, args: splitArgs(match[2]!) } : undefined
}

function entity(name: string, args: string[], kind: EntityKind): string {
  if (args.length < 2) throw new RenderError(400, 'invalid_c4', `${name} requires an alias and label.`)
  const lowerName = name.toLowerCase()
  const containerLike = lowerName.startsWith('container') || lowerName.startsWith('component')
  const entityAlias = alias(args[0]!, name)
  const label = c4Text(args[1]!)
  const technology = containerLike ? c4Text(args[2] ?? '') : ''
  const description = c4Text(args[containerLike ? 3 : 2] ?? '')
  const entityTags = tags(args[containerLike ? 5 : 4] ?? '')
  const external = lowerName.endsWith('_ext')
  const semantic = lowerName.replace(/_ext$/, '').replace('systemdb', 'system-db').replace('systemqueue', 'system-queue').replace('containerdb', 'container-db').replace('containerqueue', 'container-queue').replace('componentdb', 'component-db').replace('componentqueue', 'component-queue') + (external ? '-external' : '')
  const stereotype = ` <<c4-${semantic}${entityTags ? `,${entityTags}` : ''}>>`
  const color = semantic === 'person' ? '#08427B' : semantic === 'person-external' ? '#686868' : external ? '#999999' : semantic === 'system' ? '#1168BD' : '#438DD5'
  const details = [technology, description].filter(Boolean).map(value => `[${value}]`).join('\\n')
  const entityLabel = details ? `${label}\\n${details}` : label
  return `${kind} "${entityLabel}" as ${entityAlias}${stereotype} ${color}`
}

function relationship(name: string, args: string[]): string {
  if (args.length < 3) throw new RenderError(400, 'invalid_c4', `${name} requires a source, destination, and label.`)
  const from = alias(args[0]!, name); const to = alias(args[1]!, name); const label = c4Text(args[2]!)
  const arrow = name.toLowerCase() === 'rel_back' ? '<--' : name.toLowerCase() === 'rel_neighbor' ? '..' : '-->'
  const technology = c4Text(args[3] ?? '')
  return `${from} ${arrow} ${to} : ${label}${technology ? ` [${technology}]` : ''}`
}

const entityKinds: Record<string, EntityKind> = {
  person: 'person', person_ext: 'person', system: 'rectangle', system_ext: 'rectangle', systemdb: 'database', systemdb_ext: 'database', systemqueue: 'queue', systemqueue_ext: 'queue',
  container: 'rectangle', container_ext: 'rectangle', containerdb: 'database', containerdb_ext: 'database', containerqueue: 'queue', containerqueue_ext: 'queue',
  component: 'rectangle', component_ext: 'rectangle', componentdb: 'database', componentdb_ext: 'database', componentqueue: 'queue', componentqueue_ext: 'queue',
}

const boundaries = new Set(['boundary', 'enterprise_boundary', 'system_boundary', 'container_boundary', 'component_boundary'])
const relationships = new Set(['rel', 'rel_back', 'rel_neighbor'])

export function lowerC4(source: string): string {
  const lines = source.replace(/!include\s+(?:<C4\/)?C4_(?:Context|Container|Component|Deployment|Dynamic|Sequence)(?:\.puml)?(?:>)?/gi, '').split(/\r?\n/)
  const output: string[] = []
  let boundaryDepth = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("'") || /^@start|^@end/i.test(trimmed)) {
      output.push(line)
      continue
    }
    const layout = trimmed.match(/^LAYOUT_(LANDSCAPE|LR|LEFT_RIGHT|TOP_DOWN|TB|RIGHT_LEFT|RL|BOTTOM_UP|BT)\s*$/i)
    if (layout) {
      const direction = layout[1]!.toUpperCase()
      output.push(['LR', 'LEFT_RIGHT', 'LANDSCAPE'].includes(direction) ? 'left to right direction' : ['RL', 'RIGHT_LEFT'].includes(direction) ? 'right to left direction' : ['BT', 'BOTTOM_UP'].includes(direction) ? 'bottom to top direction' : 'top to bottom direction')
      continue
    }
    if (/^SHOW_LEGEND\s*\(/i.test(trimmed)) { output.push('legend', '| C4-PlantUML | lowered C4 view |', 'endlegend'); continue }
    if (/^Boundary_End\s*\(/i.test(trimmed)) { if (boundaryDepth === 0) throw new RenderError(400, 'invalid_c4', 'Boundary_End has no open boundary.'); boundaryDepth--; output.push('}'); continue }
    const parsed = call(trimmed)
    if (!parsed) {
      if (/^!(?:include|import|theme|load)/i.test(trimmed)) throw new RenderError(400, 'unsupported_c4', `Unsupported C4 directive: ${trimmed.slice(0, 80)}`)
      output.push(line); continue
    }
    const name = parsed.name.toLowerCase()
    if (entityKinds[name]) { output.push(entity(parsed.name, parsed.args, entityKinds[name])); continue }
    if (relationships.has(name)) { output.push(relationship(parsed.name, parsed.args)); continue }
    if (boundaries.has(name)) {
      if (parsed.args.length < 2) throw new RenderError(400, 'invalid_c4', `${parsed.name} requires an alias and label.`)
      output.push(`rectangle "${c4Text(parsed.args[1]!)}" as ${alias(parsed.args[0]!, parsed.name)} {`); boundaryDepth++; continue
    }
    throw new RenderError(400, 'unsupported_c4', `Unsupported C4 macro: ${parsed.name}`)
  }
  if (boundaryDepth !== 0) throw new RenderError(400, 'invalid_c4', 'C4 boundary is not closed.')
  return output.join('\n')
}
