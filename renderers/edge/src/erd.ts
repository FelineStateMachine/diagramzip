/**
 * Source-to-DOT lowering for BurntSushi/erd's small `.er` language.
 *
 * This module deliberately stops at DOT.  GraphViz execution belongs to the
 * renderer unit, which makes the parser/model useful in isolation and keeps
 * user input away from the execution boundary.
 */

export type Cardinality = 'zero-one' | 'one' | 'zero-plus' | 'one-plus'

export interface ErdOption { name: string; value: string }
export interface ErdAttribute { field: string; pk: boolean; fk: boolean; options: ErdOption[] }
export interface ErdEntity { name: string; attributes: ErdAttribute[]; headerOptions: ErdOption[]; options: ErdOption[] }
export interface ErdRelation { entity1: string; entity2: string; card1: Cardinality; card2: Cardinality; options: ErdOption[] }
export interface ErdDocument { entities: ErdEntity[]; relations: ErdRelation[]; titleOptions: ErdOption[]; headerOptions: ErdOption[]; entityOptions: ErdOption[]; relationOptions: ErdOption[] }

export class ErdSyntaxError extends Error {
  constructor(message: string, public readonly line: number) {
    super(`ERD line ${line}: ${message}`)
    this.name = 'ErdSyntaxError'
  }
}

const CARDINALITIES: Record<string, Cardinality> = { '?': 'zero-one', '1': 'one', '*': 'zero-plus', '+': 'one-plus' }
const ALLOWED_OPTIONS = new Set(['label', 'color', 'bgcolor', 'size', 'font', 'border', 'border-color', 'cellspacing', 'cellborder', 'cellpadding', 'text-alignment'])
const INTEGER_OPTIONS = new Set(['border', 'cellspacing', 'cellborder', 'cellpadding'])

function optionDefaults(name: 'title' | 'header' | 'entity' | 'relationship'): ErdOption[] {
  if (name === 'title') return [{ name: 'size', value: '30' }]
  if (name === 'header') return [{ name: 'size', value: '16' }]
  if (name === 'entity') return [{ name: 'border', value: '0' }, { name: 'cellborder', value: '1' }, { name: 'cellspacing', value: '0' }, { name: 'cellpadding', value: '4' }, { name: 'font', value: 'Helvetica' }]
  return []
}

function mergeOptions(specific: ErdOption[], inherited: ErdOption[], defaults: ErdOption[] = []): ErdOption[] {
  const result = new Map<string, ErdOption>()
  for (const option of [...defaults, ...inherited, ...specific]) result.set(option.name, option)
  return [...result.values()]
}

function parseOptions(text: string, line: number): ErdOption[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) throw new ErdSyntaxError('options must be enclosed in {...}', line)
  const body = trimmed.slice(1, -1).trim()
  if (!body) return []
  const options: ErdOption[] = []
  let i = 0
  while (i < body.length) {
    while (/\s/.test(body[i] ?? '')) i++
    const start = i
    while (/[A-Za-z-]/.test(body[i] ?? '')) i++
    const name = body.slice(start, i)
    if (!ALLOWED_OPTIONS.has(name)) throw new ErdSyntaxError(`option '${name || body.slice(start)}' does not exist`, line)
    while (/\s/.test(body[i] ?? '')) i++
    if (body[i++] !== ':') throw new ErdSyntaxError(`expected ':' after option '${name}'`, line)
    while (/\s/.test(body[i] ?? '')) i++
    if (body[i++] !== '"') throw new ErdSyntaxError(`option '${name}' value must be quoted`, line)
    let value = ''
    while (i < body.length && body[i] !== '"') value += body[i++]
    if (body[i++] !== '"') throw new ErdSyntaxError(`unterminated value for option '${name}'`, line)
    if (!value) throw new ErdSyntaxError(`option '${name}' value cannot be empty`, line)
    if (INTEGER_OPTIONS.has(name) && (!/^\d+$/.test(value) || Number(value) > 255)) throw new ErdSyntaxError(`option '${name}' must be an integer from 0 to 255`, line)
    if (name === 'size' && (!/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) <= 0)) throw new ErdSyntaxError("option 'size' must be a positive finite number", line)
    if (name === 'text-alignment' && !['left', 'center', 'right'].includes(value.toLowerCase())) throw new ErdSyntaxError("option 'text-alignment' must be left, center, or right", line)
    if (['color', 'bgcolor', 'border-color'].includes(name) && !/^[^\u0000-\u001f\u007f"<>&]+$/.test(value)) throw new ErdSyntaxError(`option '${name}' has an invalid color`, line)
    options.push({ name, value })
    while (/\s/.test(body[i] ?? '')) i++
    if (i === body.length) break
    if (body[i++] !== ',') throw new ErdSyntaxError(`expected ',' after option '${name}'`, line)
    while (/\s/.test(body[i] ?? '')) i++
    if (i === body.length) break
  }
  return options
}

function unquote(value: string, line: number): string {
  const trimmed = value.trim()
  if (!trimmed) throw new ErdSyntaxError('identifier cannot be empty', line)
  const quote = trimmed[0]
  if (quote === '"' || quote === "'" || quote === '`') {
    if (trimmed.at(-1) !== quote || trimmed.length < 3) throw new ErdSyntaxError('unterminated quoted identifier', line)
    return trimmed.slice(1, -1)
  }
  if (!/^[A-Za-z0-9_]+$/.test(trimmed)) throw new ErdSyntaxError(`invalid identifier '${trimmed}'`, line)
  return trimmed
}

function splitOptions(text: string): [string, string] {
  const index = text.indexOf('{')
  return index < 0 ? [text.trim(), ''] : [text.slice(0, index).trim(), text.slice(index).trim()]
}

function entityClose(text: string, line: number): number {
  let quote = ''
  for (let index = 1; index < text.length; index++) {
    const char = text[index]!
    if (quote) {
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'" || char === '`') quote = char
    else if (char === ']') return index
  }
  throw new ErdSyntaxError('unterminated entity declaration', line)
}

export function parseErd(source: string): ErdDocument {
  const document: ErdDocument = { entities: [], relations: [], titleOptions: [], headerOptions: [], entityOptions: [], relationOptions: [] }
  let current: ErdEntity | undefined
  let inGlobalPreamble = true
  const relationLines: number[] = []
  for (const record of logicalRecords(source)) {
    const lineNo = record.line
    const raw = record.text
    const directive = /^(title|header|entity|relationship)\b(.*)$/i.exec(raw)
    if (inGlobalPreamble && directive) {
      const options = parseOptions(directive[2]!.trim(), lineNo)
      const target = ({ title: 'titleOptions', header: 'headerOptions', entity: 'entityOptions', relationship: 'relationOptions' } as const)[directive[1]!.toLowerCase() as 'title' | 'header' | 'entity' | 'relationship']
      document[target] = options
      continue
    }
    inGlobalPreamble = false
    if (raw.startsWith('[')) {
      const close = entityClose(raw, lineNo)
      const entity = unquote(raw.slice(1, close), lineNo)
      const [, optionText] = splitOptions(raw.slice(close + 1).trim())
      const specific = parseOptions(optionText, lineNo)
      current = {
        name: entity,
        attributes: [],
        headerOptions: mergeOptions(specific, document.headerOptions, optionDefaults('header')),
        options: mergeOptions(specific, document.entityOptions, optionDefaults('entity')),
      }
      document.entities.push(current)
      continue
    }
    const relation = /^(.+?)\s*([?1*+])--([?1*+])\s*(.+?)(?:\s+(\{.*\}))?$/.exec(raw)
    if (relation) {
      const left = unquote(relation[1]!, lineNo)
      const right = unquote(relation[4]!, lineNo)
      const card1 = CARDINALITIES[relation[2]!]
      const card2 = CARDINALITIES[relation[3]!]
      if (!card1 || !card2) throw new ErdSyntaxError('invalid relationship cardinality', lineNo)
      relationLines.push(lineNo)
      document.relations.push({ entity1: left, entity2: right, card1, card2, options: mergeOptions(relation[5] ? parseOptions(relation[5], lineNo) : [], document.relationOptions) })
      continue
    }
    if (!current) throw new ErdSyntaxError('attribute comes before first entity', lineNo)
    const attrMatch = /^([*+\s]*)(?:"([^"]+)"|'([^']+)'|`([^`]+)`|([^\s{]+))(?:\s+(\{.*\}))?$/.exec(raw)
    if (!attrMatch) throw new ErdSyntaxError('invalid attribute declaration', lineNo)
    const field = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? attrMatch[5]
    current.attributes.push({ field: field!, pk: attrMatch[1]!.includes('*'), fk: attrMatch[1]!.includes('+'), options: mergeOptions(attrMatch[6] ? parseOptions(attrMatch[6], lineNo) : [], [], [{ name: 'text-alignment', value: 'left' }]) })
  }
  const names = new Set(document.entities.map(entity => entity.name))
  for (const [index, relation] of document.relations.entries()) {
    const line = relationLines[index] ?? 0
    if (!names.has(relation.entity1)) throw new ErdSyntaxError(`unknown entity '${relation.entity1}' in relationship`, line)
    if (!names.has(relation.entity2)) throw new ErdSyntaxError(`unknown entity '${relation.entity2}' in relationship`, line)
  }
  return document
}

function logicalRecords(source: string): Array<{ text: string; line: number }> {
  const records: Array<{ text: string; line: number }> = []
  const lines = source.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
  let buffer = ''
  let startLine = 0
  let quote = ''
  let braces = 0
  for (let index = 0; index < lines.length; index++) {
    let fragment = ''
    const physical = lines[index]!
    for (let offset = 0; offset < physical.length; offset++) {
      const char = physical[offset]!
      if (quote) {
        fragment += char
        if (char === quote) quote = ''
        continue
      }
      if (char === '"' || char === "'" || char === '`') {
        quote = char
        fragment += char
        continue
      }
      if (char === '#') break
      if (char === '{') braces++
      if (char === '}') braces--
      if (braces < 0) throw new ErdSyntaxError("unexpected '}'", index + 1)
      fragment += char
    }
    const trimmed = fragment.trim()
    if (trimmed) {
      if (!buffer) startLine = index + 1
      buffer += `${buffer ? ' ' : ''}${trimmed}`
    }
    if (buffer && braces === 0 && !quote) {
      records.push({ text: buffer, line: startLine })
      buffer = ''
    }
  }
  if (buffer || braces > 0 || quote) throw new ErdSyntaxError('unterminated options or quoted value', startLine || lines.length)
  return records
}

function dotQuote(value: string): string { return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n')}"` }
function html(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;') }
function option(options: ErdOption[], name: string): string | undefined { return options.find(item => item.name === name)?.value }
function attrValue(options: ErdOption[], name: string, fallback: string): string { return option(options, name) ?? fallback }
function cardinality(card: Cardinality): string { return ({ 'zero-one': '{0,1}', one: '1', 'zero-plus': '0..N', 'one-plus': '1..N' })[card] }
function font(text: string, options: ErdOption[]): string {
  const attrs = [
    option(options, 'color') ? `COLOR="${html(option(options, 'color')!)}"` : '',
    option(options, 'font') ? `FACE="${html(option(options, 'font')!)}"` : '',
    option(options, 'size') ? `POINT-SIZE="${html(option(options, 'size')!)}"` : '',
  ].filter(Boolean)
  return attrs.length ? `<FONT ${attrs.join(' ')}>${text}</FONT>` : text
}
function align(value: string): string { return ({ left: 'LEFT', center: 'CENTER', right: 'RIGHT' })[value.toLowerCase()] ?? 'LEFT' }
function cellAttributes(options: ErdOption[]): string {
  return [
    `ALIGN="${align(attrValue(options, 'text-alignment', 'left'))}"`,
    option(options, 'bgcolor') ? `BGCOLOR="${html(option(options, 'bgcolor')!)}"` : '',
    option(options, 'border') ? `BORDER="${html(option(options, 'border')!)}"` : '',
    option(options, 'border-color') ? `COLOR="${html(option(options, 'border-color')!)}"` : '',
    option(options, 'cellborder') ? `CELLBORDER="${html(option(options, 'cellborder')!)}"` : '',
    option(options, 'cellpadding') ? `CELLPADDING="${html(option(options, 'cellpadding')!)}"` : '',
    option(options, 'cellspacing') ? `CELLSPACING="${html(option(options, 'cellspacing')!)}"` : '',
  ].filter(Boolean).join(' ')
}

function entityLabel(entity: ErdEntity): string {
  const headerLabel = option(entity.headerOptions, 'label')
  const header = font(`<B>${html(entity.name)}</B>${headerLabel ? ` ${html(headerLabel)}` : ''}`, entity.headerOptions)
  const rows = [`<TR><TD COLSPAN="1">${header}</TD></TR>`]
  for (const attr of entity.attributes) {
    let text = html(attr.field)
    if (attr.pk) text = `<U>${text}</U>`
    if (attr.fk) text = `<I>${text}</I>`
    text = font(text, attr.options)
    const label = option(attr.options, 'label')
    if (label) text += font(` [${html(label)}]`, attr.options)
    rows.push(`<TR><TD ${cellAttributes(attr.options)}>${text}</TD></TR>`)
  }
  const table = `<TABLE BORDER="${attrValue(entity.options, 'border', '0')}"${option(entity.options, 'border-color') ? ` COLOR="${html(option(entity.options, 'border-color')!)}"` : ''}${option(entity.options, 'bgcolor') ? ` BGCOLOR="${html(option(entity.options, 'bgcolor')!)}"` : ''} CELLBORDER="${attrValue(entity.options, 'cellborder', '1')}" CELLSPACING="${attrValue(entity.options, 'cellspacing', '0')}" CELLPADDING="${attrValue(entity.options, 'cellpadding', '4')}">${rows.join('')}</TABLE>`
  return font(table, entity.options)
}

export function erdToDot(document: ErdDocument): string {
  const lines = ['graph ERD {', '  rankdir=LR;', '  splines=spline;', '  node [shape=plaintext];', '  edge [color=gray50, minlen=2, style=dashed];']
  const title = option(document.titleOptions, 'label')
  const titleOptions = mergeOptions(document.titleOptions, [], optionDefaults('title'))
  if (title) lines.push(`  graph [label=<${font(html(title), titleOptions)}>, labelloc=t, labeljust=l];`)
  for (const entity of document.entities) lines.push(`  ${dotQuote(entity.name)} [label=<${entityLabel(entity)}>];`)
  for (const relation of document.relations) {
    const label = option(relation.options, 'label')
    const relationLabel = label ? font(html(` ${label} `), relation.options) : ''
    lines.push(`  ${dotQuote(relation.entity1)} -- ${dotQuote(relation.entity2)} [taillabel=<${font(cardinality(relation.card1), relation.options)}>, headlabel=<${font(cardinality(relation.card2), relation.options)}>${label ? `, label=<${relationLabel}>` : ''}];`)
  }
  return `${lines.join('\n')}\n}`
}
