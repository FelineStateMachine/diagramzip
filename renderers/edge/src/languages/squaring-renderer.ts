import type { SquaringDocument } from './squaring'
import type { SquaringModel, SquaringNode, SquaringSquare } from './squaring-model'

const MARGIN = 16
const PANEL_GAP = 44
const PANEL_TITLE_HEIGHT = 26
const CAPTION_HEIGHT = 44
const BATTERY_GUTTER = 40
const TARGET_SIZE = 480
const FONT_FAMILY = 'Arial,Helvetica,sans-serif'
const INK = '#111827'
const MUTED = '#666666'
const WIRE = '#1e293b'
const BLOCK = '#db2777'
export const BAND_COUNT = 8
// Raw appearance uses the light palette; themed appearances swap these through the
// squaring-semantic normalization profile in shared/svg.
export const LIGHT_SQUARE_BANDS = ['#93c5fd', '#b3d1fb', '#cddaf2', '#e2e4e8', '#f1d6d2', '#fbbfba', '#fca5a5', '#f87171'] as const
export const LIGHT_NODE_BANDS = ['#2563eb', '#3b6fe0', '#4f74c8', '#6b7280', '#b45454', '#d13b3b', '#dc2626', '#b91c1c'] as const

interface Panel {
  x: number
  y: number
  width: number
  height: number
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function round(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function band(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return Math.min(BAND_COUNT - 1, Math.floor(clamped * BAND_COUNT))
}

function squareSvg(square: SquaringSquare, model: SquaringModel, panel: Panel, unit: number, labels: boolean, overlay: boolean): string {
  const x = panel.x + square.x * unit
  const y = panel.y + square.y * unit
  const size = square.side * unit
  const topVoltage = model.nodes[square.top]?.voltage ?? model.height - square.y
  const level = band((topVoltage - square.side / 2) / model.height)
  const fill = LIGHT_SQUARE_BANDS[level] ?? LIGHT_SQUARE_BANDS[0]
  const fontSize = Math.min(16, size * 0.42, (size * 1.6) / Math.max(1, square.label.length))
  // In the overlay the wire runs down the middle of the square, so the label moves beside it.
  const labelX = overlay ? x + size / 2 + 6 : x + size / 2
  const label = labels && size >= 10
    ? `<text x="${round(labelX)}" y="${round(y + size / 2)}" text-anchor="${overlay ? 'start' : 'middle'}" dominant-baseline="central" class="squaring-square-label" fill="${INK}" font-size="${round(fontSize)}" font-family="${FONT_FAMILY}">${escapeXml(square.label)}</text>`
    : ''
  return `<g class="squaring-square" data-index="${square.index}" data-side="${square.side}" data-x="${square.x}" data-y="${square.y}"><title>Square ${square.side} at (${square.x}, ${square.y})</title><rect class="squaring-square-fill" data-band="${level}" x="${round(x)}" y="${round(y)}" width="${round(size)}" height="${round(size)}" fill="${fill}" stroke="${INK}" stroke-width="1"/>${label}</g>`
}

function blocksSvg(model: SquaringModel, panel: Panel, unit: number): string {
  return model.blocks.map(block => {
    const inset = 2
    return `<rect class="squaring-block" data-squares="${block.squares}" x="${round(panel.x + block.x * unit + inset)}" y="${round(panel.y + block.y * unit + inset)}" width="${round(block.width * unit - inset * 2)}" height="${round(block.height * unit - inset * 2)}" fill="none" stroke="${BLOCK}" stroke-width="2.5" stroke-dasharray="7 4"><title>Compound block ${block.width} × ${block.height} of ${block.squares} squares</title></rect>`
  }).join('')
}

function nodeCenter(node: SquaringNode, panel: Panel, unit: number): { x: number; y: number } {
  return { x: panel.x + ((node.x0 + node.x1) / 2) * unit, y: panel.y + node.y * unit }
}

function wireSvg(square: SquaringSquare, model: SquaringModel, panel: Panel, unit: number, maxSide: number, showCurrent: boolean): string {
  const stroke = WIRE
  const top = model.nodes[square.top]
  const bottom = model.nodes[square.bottom]
  if (top === undefined || bottom === undefined) return ''
  const a = nodeCenter(top, panel, unit)
  const b = nodeCenter(bottom, panel, unit)
  const cx = panel.x + (square.x + square.side / 2) * unit
  const size = square.side * unit
  const radius = Math.max(0, Math.min(8, size / 3, Math.abs(cx - a.x) / 2, Math.abs(cx - b.x) / 2))
  const width = 1 + 2.4 * (square.side / maxSide)
  const towardsA = a.x < cx ? -1 : 1
  const towardsB = b.x < cx ? -1 : 1
  const path = [
    `M${round(a.x)} ${round(a.y)}`,
    `L${round(cx + towardsA * radius)} ${round(a.y)}`,
    `Q${round(cx)} ${round(a.y)} ${round(cx)} ${round(a.y + radius)}`,
    `L${round(cx)} ${round(b.y - radius)}`,
    `Q${round(cx)} ${round(b.y)} ${round(cx + towardsB * radius)} ${round(b.y)}`,
    `L${round(b.x)} ${round(b.y)}`,
  ].join(' ')
  const midY = (a.y + b.y) / 2
  const arrow = size >= 14
    ? `<path d="M${round(cx - 3.5)} ${round(midY - 3)} L${round(cx + 3.5)} ${round(midY - 3)} L${round(cx)} ${round(midY + 3.5)} Z" class="squaring-wire-arrow" fill="${stroke}"/>`
    : ''
  const label = showCurrent && size >= 14
    ? `<text x="${round(cx + 6)}" y="${round(midY - 7)}" text-anchor="start" dominant-baseline="central" class="squaring-wire-label" fill="${MUTED}" font-size="10" font-family="${FONT_FAMILY}">${square.side}</text>`
    : ''
  return `<g class="squaring-wire" data-from="${escapeXml(top.id)}" data-to="${escapeXml(bottom.id)}" data-current="${square.side}"><title>Wire ${escapeXml(top.id)} → ${escapeXml(bottom.id)} carries ${square.side}</title><path class="squaring-wire-path" d="${path}" fill="none" stroke="${stroke}" stroke-width="${round(width)}" stroke-linecap="round" stroke-linejoin="round"/>${arrow}${label}</g>`
}

function nodeSvg(node: SquaringNode, model: SquaringModel, panel: Panel, unit: number, rung: boolean, showVoltage: boolean): string {
  const center = nodeCenter(node, panel, unit)
  const level = band(node.voltage / model.height)
  const color = LIGHT_NODE_BANDS[level] ?? LIGHT_NODE_BANDS[0]
  const rungLine = rung
    ? `<line class="squaring-node-rung" data-band="${level}" x1="${round(panel.x + node.x0 * unit)}" y1="${round(center.y)}" x2="${round(panel.x + node.x1 * unit)}" y2="${round(center.y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
    : ''
  const pole = node.index === model.positive ? '+' : node.index === model.negative ? '−' : ''
  // Wires leave every node horizontally, so labels sit above or below the rung instead of on it.
  const labelX = pole === '' ? center.x + 7 : center.x
  const labelY = node.index === model.negative ? center.y + 13 : center.y - 10
  const anchor = pole === '' ? 'start' : 'middle'
  const label = showVoltage
    ? `<text x="${round(labelX)}" y="${round(labelY)}" text-anchor="${anchor}" dominant-baseline="central" class="squaring-node-label" fill="${INK}" font-size="11" font-weight="700" font-family="${FONT_FAMILY}">${pole === '' ? '' : `${pole} `}${node.voltage}</text>`
    : ''
  return `<g class="squaring-node" data-node-id="${escapeXml(node.id)}" data-voltage="${node.voltage}"><title>Node ${escapeXml(node.id)} at ${node.voltage}</title>${rungLine}<circle class="squaring-node-dot" data-band="${level}" cx="${round(center.x)}" cy="${round(center.y)}" r="5.5" fill="${color}"/>${label}</g>`
}

function batterySvg(model: SquaringModel, panel: Panel, unit: number): string {
  const positive = model.nodes[model.positive]
  const negative = model.nodes[model.negative]
  if (positive === undefined || negative === undefined) return ''
  const a = nodeCenter(positive, panel, unit)
  const b = nodeCenter(negative, panel, unit)
  const gx = panel.x - BATTERY_GUTTER / 2 - 4
  const midY = (a.y + b.y) / 2
  return `<g class="squaring-battery"><title>Battery: ${escapeXml(positive.id)} is the positive pole at ${positive.voltage}, ${escapeXml(negative.id)} is the negative pole at 0</title>` +
    `<path d="M${round(a.x)} ${round(a.y)} L${round(gx)} ${round(a.y)} L${round(gx)} ${round(midY - 7)} M${round(gx)} ${round(midY + 7)} L${round(gx)} ${round(b.y)} L${round(b.x)} ${round(b.y)}" class="squaring-wire-path" fill="none" stroke="${WIRE}" stroke-width="1.5" stroke-dasharray="4 3"/>` +
    `<line class="squaring-wire-path" x1="${round(gx - 9)}" y1="${round(midY - 4)}" x2="${round(gx + 9)}" y2="${round(midY - 4)}" stroke="${WIRE}" stroke-width="2.5"/>` +
    `<line class="squaring-wire-path" x1="${round(gx - 4)}" y1="${round(midY + 4)}" x2="${round(gx + 4)}" y2="${round(midY + 4)}" stroke="${WIRE}" stroke-width="2.5"/>` +
    `<text class="squaring-node-label" x="${round(gx - 12)}" y="${round(midY - 8)}" text-anchor="end" dominant-baseline="central" fill="${INK}" font-size="12" font-weight="700" font-family="${FONT_FAMILY}">+</text>` +
    `<text class="squaring-node-label" x="${round(gx - 12)}" y="${round(midY + 9)}" text-anchor="end" dominant-baseline="central" fill="${INK}" font-size="12" font-weight="700" font-family="${FONT_FAMILY}">−</text>` +
    `</g>`
}

function panelTitle(text: string, panel: Panel): string {
  return `<text class="squaring-panel-title" x="${round(panel.x)}" y="${round(panel.y - 9)}" fill="${MUTED}" font-size="12" font-weight="700" font-family="${FONT_FAMILY}">${escapeXml(text)}</text>`
}

function frame(panel: Panel): string {
  return `<rect class="squaring-frame" x="${round(panel.x)}" y="${round(panel.y)}" width="${round(panel.width)}" height="${round(panel.height)}" fill="none" stroke="${INK}" stroke-width="1.5"/>`
}

function rectanglePanel(model: SquaringModel, panel: Panel, unit: number, labels: boolean, overlay = false): string {
  const squares = model.squares.map(square => squareSvg(square, model, panel, unit, labels, overlay)).join('')
  const gaps = model.complete
    ? ''
    : `<rect class="squaring-gap" x="${round(panel.x)}" y="${round(panel.y)}" width="${round(panel.width)}" height="${round(panel.height)}" fill="url(#squaring-hatch)"/>`
  return `<g class="squaring-rectangle">${gaps}${squares}${blocksSvg(model, panel, unit)}${frame(panel)}</g>`
}

function searchTableSvg(model: SquaringModel, x: number, y: number, width: number): { svg: string; height: number } {
  if (model.search === null) return { svg: '', height: 0 }
  const rowHeight = 15
  const maxRows = 24
  const rows = model.search.slice(0, maxRows)
  const columns = [0, 110, 200, 270, 340]
  const cell = (text: string, column: number, rowY: number, bold = false, muted = false): string =>
    `<text x="${round(x + (columns[column] ?? 0))}" y="${round(rowY)}" class="${muted ? 'squaring-summary' : 'squaring-node-label'}" fill="${muted ? MUTED : INK}" font-size="11"${bold ? ' font-weight="700"' : ''} font-family="${FONT_FAMILY}">${escapeXml(text)}</text>`
  const header = ['Battery', 'Size', 'Order', 'Simple', 'Perfect'].map((text, column) => cell(text, column, y + 12, true, true)).join('')
  const body = rows.map((candidate, index) => {
    const rowY = y + 12 + rowHeight * (index + 1)
    const chosen = index === model.searchIndex
    const name = `${candidate.positive} → ${candidate.negative}${chosen ? ' ◀' : ''}`
    if (candidate.error !== null) {
      return cell(name, 0, rowY, chosen) + `<text x="${round(x + 110)}" y="${round(rowY)}" class="squaring-summary" fill="${MUTED}" font-size="11" font-family="${FONT_FAMILY}">${escapeXml(candidate.error.length > 70 ? `${candidate.error.slice(0, 67)}…` : candidate.error)}</text>`
    }
    return cell(name, 0, rowY, chosen) + cell(`${candidate.width} × ${candidate.height}`, 1, rowY, chosen) + cell(String(candidate.order), 2, rowY, chosen) + cell(candidate.simple ? 'yes' : 'no', 3, rowY, chosen) + cell(candidate.perfect ? 'yes' : 'no', 4, rowY, chosen)
  }).join('')
  const more = model.search.length > maxRows ? cell(`+${model.search.length - maxRows} more`, 0, y + 12 + rowHeight * (rows.length + 1), false, true) : ''
  const height = 12 + rowHeight * (rows.length + 1 + (more === '' ? 0 : 1)) + 6
  return { svg: `<g class="squaring-search" data-candidates="${model.search.length}"><line x1="${round(x)}" y1="${round(y + 17)}" x2="${round(x + Math.min(width, 420))}" y2="${round(y + 17)}" stroke="${MUTED}" stroke-width="0.5" class="squaring-frame"/>${header}${body}${more}</g>`, height }
}

function circuitPanel(model: SquaringModel, panel: Panel, unit: number, overlay: boolean, labels: boolean): string {
  const maxSide = Math.max(...model.squares.map(square => square.side))
  const wires = model.squares.map(square => wireSvg(square, model, panel, unit, maxSide, labels && !overlay)).join('')
  const nodes = model.nodes.map(node => nodeSvg(node, model, panel, unit, overlay, labels && !overlay)).join('')
  return `<g class="squaring-circuit" data-overlay="${overlay}">${batterySvg(model, panel, unit)}${wires}${nodes}</g>`
}

function defaultTitle(document: SquaringDocument, model: SquaringModel): string {
  if (document.title !== '') return document.title
  return model.width === model.height ? `Squared square ${model.width} × ${model.height}` : `Squared rectangle ${model.width} × ${model.height}`
}

export function describeSquaring(model: SquaringModel): string {
  const parts = [`Order ${model.order}`, `${model.width} × ${model.height}`]
  if (!model.complete) {
    parts.push(`incomplete: ${model.problem ?? ''}`)
    return parts.join(' | ')
  }
  parts.push(model.simple ? 'simple' : `compound (${model.blocks.length} ${model.blocks.length === 1 ? 'block' : 'blocks'} outlined)`)
  parts.push(model.perfect ? 'perfect' : `imperfect (${model.repeatedSides.length} repeated ${model.repeatedSides.length === 1 ? 'side' : 'sides'}: ${model.repeatedSides.join(', ')})`)
  if (model.form === 'network') {
    const positive = model.nodes[model.positive]?.id ?? ''
    const negative = model.nodes[model.negative]?.id ?? ''
    parts.push(model.search === null ? `battery ${positive} → ${negative}` : `battery ${positive} → ${negative} (best of ${model.search.length} choices)`)
  }
  return parts.join(' | ')
}

export function renderSquaring(document: SquaringDocument, model: SquaringModel): string {
  const unit = Math.min(60, Math.max(0.5, TARGET_SIZE / Math.max(model.width, model.height)))
  const labels = document.labels === 'sides'
  const view = model.complete ? document.view : 'rectangle'
  const panelWidth = model.width * unit
  const panelHeight = model.height * unit
  const top = MARGIN + PANEL_TITLE_HEIGHT
  const panels: string[] = []
  let x = MARGIN

  if (view === 'rectangle' || view === 'both') {
    const panel = { x, y: top, width: panelWidth, height: panelHeight }
    panels.push(panelTitle('Squared rectangle', panel), rectanglePanel(model, panel, unit, labels))
    x += panelWidth + PANEL_GAP
  }
  if (view === 'circuit' || view === 'both') {
    x += BATTERY_GUTTER
    const panel = { x, y: top, width: panelWidth, height: panelHeight }
    panels.push(panelTitle('Smith diagram', panel), circuitPanel(model, panel, unit, false, labels))
    x += panelWidth
  }
  if (view === 'overlay') {
    x += BATTERY_GUTTER
    const panel = { x, y: top, width: panelWidth, height: panelHeight }
    panels.push(panelTitle('Smith diagram over the squared rectangle', panel), rectanglePanel(model, panel, unit, labels, true), circuitPanel(model, panel, unit, true, labels))
    x += panelWidth
  }

  const title = defaultTitle(document, model)
  const summary = describeSquaring(model)
  const captionY = top + panelHeight + 20
  const table = searchTableSvg(model, MARGIN, captionY + 28, Math.max(x - MARGIN, 320))
  const width = Math.max(x + MARGIN, 320, model.search === null ? 0 : 420 + MARGIN * 2, MARGIN * 2 + summary.length * 6.6)
  const height = top + panelHeight + CAPTION_HEIGHT + table.height + MARGIN
  const hatch = model.complete ? '' : `<defs><pattern id="squaring-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="squaring-frame" x1="0" y1="0" x2="0" y2="8" stroke="${MUTED}" stroke-width="1.5"/></pattern></defs>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" width="${round(width)}" height="${round(height)}" class="squaring-diagram" data-view="${view}" data-form="${model.form}" data-order="${model.order}" data-width="${model.width}" data-height="${model.height}" data-complete="${model.complete}" data-simple="${model.simple}" data-perfect="${model.perfect}">
  <title>${escapeXml(title)}</title>
  <desc>${escapeXml(summary)}. Each square is a wire carrying current equal to its side; each horizontal segment is a node whose voltage is its height above the bottom edge.</desc>
  ${hatch}<rect class="squaring-canvas" x="0" y="0" width="${round(width)}" height="${round(height)}" fill="#ffffff"/>
  ${panels.join('\n  ')}
  <text class="squaring-title" x="${MARGIN}" y="${round(captionY)}" fill="${INK}" font-size="14" font-weight="700" font-family="${FONT_FAMILY}">${escapeXml(title)}</text>
  <text class="squaring-summary" x="${MARGIN}" y="${round(captionY + 17)}" fill="${MUTED}" font-size="12" font-family="${FONT_FAMILY}">${escapeXml(summary)}</text>
  ${table.svg}
</svg>`
}
