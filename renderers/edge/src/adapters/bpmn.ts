import { SaxesParser, type SaxesTagPlain } from 'saxes'
import { RenderError } from '../runtime/errors'
import type { EngineId, RendererAdapter, RenderRequest } from '../runtime/types'
import { edgeResult } from './types'

const VERSION = 'diagramzip-bpmn-svg@1'
const MAX_SOURCE = 512 * 1024
const MAX_NODES = 20_000
const MAX_COORD = 32_768
const MAX_OUTPUT = 4 * 1024 * 1024

type Node = { name: string; attrs: Record<string, string>; text: string; children: Node[] }
type Box = { x: number; y: number; w: number; h: number }
type Shape = Box & { id: string; type: string; name: string; label?: Box }
type Edge = { id: string; type: string; points: { x: number; y: number }[]; name: string; label?: Box }

const local = (name: string) => name.includes(':') ? name.slice(name.indexOf(':') + 1) : name
const esc = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
const attr = (node: Node, key: string) => node.attrs[key] ?? node.attrs[Object.keys(node.attrs).find(k => local(k) === key) ?? '']
const child = (node: Node, name: string) => node.children.find(value => local(value.name) === name)

function fail(message: string, code = 'invalid_source'): never { throw new RenderError(422, code, message) }
function number(value: string | undefined, name: string): number {
  if (!value || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) fail(`BPMN ${name} must be a finite number.`)
  const result = Number(value)
  if (!Number.isFinite(result) || Math.abs(result) > MAX_COORD) fail(`BPMN ${name} is outside the supported range.`)
  return result
}
function parseXml(source: string): Node {
  if (new TextEncoder().encode(source).byteLength > MAX_SOURCE) throw new RenderError(413, 'source_too_large', 'BPMN source may not exceed 512 KiB.')
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) fail('BPMN source may not contain a doctype or entity declaration.')
  let root: Node | null = null; const stack: Node[] = []; let nodes = 0; let error: unknown
  const parser = new SaxesParser({ xmlns: false })
  parser.on('doctype', () => { error = new Error('DOCTYPE is not allowed') })
  parser.on('processinginstruction', () => { error = new Error('Processing instructions are not allowed') })
  parser.on('opentag', (tag: SaxesTagPlain) => {
    if (++nodes > MAX_NODES) { error = new Error('Too many XML nodes'); return }
    const attrs: Record<string, string> = {}
    for (const [key, value] of Object.entries(tag.attributes)) attrs[key] = typeof value === 'string' ? value : String((value as { value?: string }).value ?? '')
    const node: Node = { name: tag.name, attrs, text: '', children: [] }; const parent = stack.at(-1)
    if (parent) parent.children.push(node); else if (root) error = new Error('Multiple XML roots'); else root = node
    stack.push(node)
  })
  const append = (value: string) => { const node = stack.at(-1); if (node) node.text += value; else if (value.trim()) error = new Error('Text outside root') }
  parser.on('text', append); parser.on('cdata', append); parser.on('closetag', () => { stack.pop() }); parser.on('error', value => { error = value })
  try { parser.write(source).close() } catch (value) { error = value }
  if (error || !root) fail('BPMN source is not valid bounded XML.')
  return root
}

function box(node: Node, allowEmpty = false): Box {
  const x = number(attr(node, 'x'), 'x coordinate'); const y = number(attr(node, 'y'), 'y coordinate')
  const w = number(attr(node, 'width'), 'width'); const h = number(attr(node, 'height'), 'height')
  if (allowEmpty ? w < 0 || h < 0 : w <= 0 || h <= 0) fail(`BPMN DI dimensions must be ${allowEmpty ? 'non-negative' : 'positive'}.`)
  return { x, y, w, h }
}

export function parseBpmn(source: string): { shapes: Shape[]; edges: Edge[]; width: number; height: number } {
  const root = parseXml(source); if (local(root.name) !== 'definitions') fail('BPMN source must have a definitions root.')
  const semantic = new Map<string, { type: string; name: string }>(); const di = new Map<string, Node>(); const labels = new Map<string, Box>()
  const walk = (node: Node) => {
    const name = local(node.name); const id = attr(node, 'id')
    if (id && (name !== 'BPMNShape' && name !== 'BPMNEdge' && name !== 'BPMNLabel')) semantic.set(id, { type: name, name: attr(node, 'name') ?? '' })
    if (id && (name === 'BPMNShape' || name === 'BPMNEdge')) di.set(id, node)
    for (const value of node.children) walk(value)
  }
  // A second traversal keeps the DI parent id while remaining independent of XML prefixes.
  const collect = (node: Node, parentDi?: string) => {
    const name = local(node.name); const id = attr(node, 'id'); const element = attr(node, 'bpmnElement')
    if (id && (name === 'BPMNShape' || name === 'BPMNEdge')) di.set(id, node)
    if (name === 'BPMNLabel' && parentDi) { const b = child(node, 'Bounds'); if (b) labels.set(parentDi, box(b, true)) }
    const next = id && (name === 'BPMNShape' || name === 'BPMNEdge') ? id : parentDi
    for (const value of node.children) collect(value, next)
  }
  walk(root); collect(root)
  const shapes: Shape[] = []; const edges: Edge[] = []
  for (const [diId, node] of di) {
    const element = attr(node, 'bpmnElement'); if (!element) continue
    const sem = semantic.get(element); if (!sem) continue
    if (local(node.name) === 'BPMNShape') shapes.push({ ...box(child(node, 'Bounds') ?? fail(`BPMN shape ${diId} has no bounds.`)), id: element, type: sem.type, name: sem.name, label: labels.get(diId) })
    else {
      const points = node.children.filter(value => local(value.name) === 'waypoint').map(value => ({ x: number(attr(value, 'x'), 'waypoint x'), y: number(attr(value, 'y'), 'waypoint y') }))
      if (points.length < 2) fail(`BPMN edge ${diId} needs at least two waypoints.`)
      edges.push({ id: element, type: sem.type, points, name: sem.name, label: labels.get(diId) })
    }
  }
  if (!shapes.length) fail('BPMN diagram contains no rendered shapes.')
  const maxX = Math.max(...shapes.map(s => s.x + s.w), ...edges.flatMap(e => e.points.map(p => p.x)), 1)
  const maxY = Math.max(...shapes.map(s => s.y + s.h), ...edges.flatMap(e => e.points.map(p => p.y)), 1)
  return { shapes, edges, width: maxX + 20, height: maxY + 20 }
}

function label(value: string, b: Box, anchor = 'middle'): string {
  if (!value) return ''
  const lines = value.split(/\r?\n/).slice(0, 8); const x = anchor === 'start' ? b.x + 4 : b.x + b.w / 2
  return `<text x="${x}" y="${b.y + 14}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="12" fill="#111827">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? 14 : 0}">${esc(line.slice(0, 240))}</tspan>`).join('')}</text>`
}
function shapeSvg(shape: Shape): string {
  const { x, y, w, h } = shape; const t = shape.type.toLowerCase(); const stroke = '#334155'; const fill = '#fff'
  let body: string
  if (t.includes('event')) body = `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2 - 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
  else if (t.includes('gateway')) body = `<path d="M${x + w / 2} ${y}L${x + w} ${y + h / 2}L${x + w / 2} ${y + h}L${x} ${y + h / 2}Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
  else if (t === 'participant' || t === 'lane') body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f8fafc" stroke="${stroke}"/><path d="M${x + 28} ${y}V${y + h}" stroke="${stroke}"/>`
  else if (t.includes('dataobject')) body = `<path d="M${x} ${y}H${x + w - 12}L${x + w} ${y + 12}V${y + h}H${x}Z" fill="${fill}" stroke="${stroke}"/><path d="M${x + w - 12} ${y}V${y + 12}H${x + w}" fill="none" stroke="${stroke}"/>`
  else body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${t.includes('subprocess') ? 2 : 8}" fill="${fill}" stroke="${stroke}"${t.includes('subprocess') ? ' stroke-dasharray="6 4"' : ''}/>`
  const b = shape.label ?? { x, y: y + h / 2 - 10, w, h: 20 }
  return `<g data-bpmn-id="${esc(shape.id)}">${body}${label(shape.name, b, shape.type.toLowerCase() === 'participant' || shape.type.toLowerCase() === 'lane' ? 'start' : 'middle')}</g>`
}
export function renderBpmn(source: string): string {
  const diagram = parseBpmn(source); const defs = '<defs><marker id="bpmn-arrow" markerWidth="10" markerHeight="10" refX="9" refY="4" orient="auto"><path d="M0 0L9 4L0 8Z" fill="#334155"/></marker></defs>'
  const edges = diagram.edges.map(edge => { const first = edge.points[0]!; return `<g data-bpmn-id="${esc(edge.id)}"><polyline points="${edge.points.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#334155" stroke-width="1.5" marker-end="url(#bpmn-arrow)"${edge.type.toLowerCase() === 'association' ? ' stroke-dasharray="5 4"' : ''}/>${label(edge.name, edge.label ?? { x: first.x, y: first.y, w: 80, h: 20 })}</g>` }).join('')
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${diagram.width}" height="${diagram.height}" viewBox="0 0 ${diagram.width} ${diagram.height}">${defs}${edges}${diagram.shapes.map(shapeSvg).join('')}</svg>`
  if (body.length > MAX_OUTPUT) throw new RenderError(413, 'output_too_large', 'BPMN SVG output exceeds 4 MiB.')
  return body
}

export const bpmnAdapter: RendererAdapter = {
  id: 'bpmn' as EngineId, runtime: 'edge-js', version: VERSION,
  render(request: RenderRequest, signal: AbortSignal) {
    if (signal.aborted) throw signal.reason
    return Promise.resolve(edgeResult('bpmn' as EngineId, VERSION, renderBpmn(request.source)))
  },
}
