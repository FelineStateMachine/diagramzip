import type { TrnDocument, TrnInput, TrnOutcome, TrnStage } from './trn'

const MIN_ROW_HEIGHT = 28
const MIN_LABEL_WIDTH = 210
const MAX_LABEL_WIDTH = 390
const OPERATION_WIDTH = 34
const OPERATION_FONT_SIZE = 10
const OPERATION_TEXT_PADDING = 14
const MARGIN = 12
const HEADER_HEIGHT = 28
const ROOT_GAP = 1
const RECIPE_GAP = 20
const RECIPE_COLUMN_GAP = 64
const RECIPE_LINK_CLEARANCE = 4
const FONT_FAMILY = 'Arial,Helvetica,sans-serif'
const GRID_COLOR = '#65a268'
const BRANCH_COLORS = ['#dbeafe', '#fef3c7', '#ede9fe', '#ccfbf1'] as const

interface LeafLayout {
  row: number
  input: TrnInput
  label: string
}

interface StageLayout {
  outcome: TrnOutcome
  stage: TrnStage
  column: number
  startRow: number
  endRow: number
  arms: Array<{ startColumn: number; endColumn: number; startRow: number; endRow: number }>
  branchColor: number
}

interface Layout {
  leaves: LeafLayout[]
  stages: StageLayout[]
  rows: number
  columns: number
}

interface Geometry {
  labelWidth: number
  columnWidths: number[]
  columnOffsets: number[]
  rowHeights: number[]
  rowOffsets: number[]
  bodyHeight: number
  tableWidth: number
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function textWidth(value: string, fontSize: number, padding: number): number {
  return value.length * fontSize * 0.56 + padding
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function rowY(row: number, bodyY: number, geometry: Geometry): number {
  return bodyY + geometry.rowOffsets[row]!
}

function ingredientText(leaf: LeafLayout): string {
  return leaf.input.quantity === '' ? leaf.label : `${leaf.input.quantity} ${leaf.label}`
}

function actionText(item: StageLayout): string {
  return item.stage.action.replaceAll('{portion}', item.outcome.portion)
}

function fifoInputs(document: TrnDocument, inputs: TrnInput[]): TrnInput[] {
  const outcomes: TrnInput[] = []
  const ingredients: TrnInput[] = []
  for (const input of inputs) {
    (document.outcomes.has(input.id) ? outcomes : ingredients).push(input)
  }
  return [...outcomes, ...ingredients]
}

function layoutTree(document: TrnDocument): Layout {
  const layout: Layout = { leaves: [], stages: [], rows: 0, columns: 0 }
  let nextRow = 0

  function leaf(input: TrnInput): { startRow: number; endRow: number; column: number } {
    const ingredient = document.ingredients.get(input.id)!
    const row = nextRow
    nextRow += 1
    layout.leaves.push({ row, input, label: ingredient.label })
    return { startRow: row, endRow: row, column: 0 }
  }

  function outcome(value: TrnOutcome): { startRow: number; endRow: number; column: number } {
    let startRow = -1
    let endRow = -1
    let previousColumn = 0

    for (let stageIndex = 0; stageIndex < value.stages.length; stageIndex += 1) {
      const stage = value.stages[stageIndex]!
      let dependencyColumn = previousColumn
      const inputs: Array<{ startRow: number; endRow: number; column: number }> = []

      for (const input of fifoInputs(document, stage.inputs)) {
        const child = document.outcomes.get(input.id)
        const placed = child === undefined ? leaf(input) : outcome(child)
        inputs.push(placed)
        if (startRow < 0) startRow = placed.startRow
        endRow = Math.max(endRow, placed.endRow)
        dependencyColumn = Math.max(dependencyColumn, placed.column)
      }

      const column = dependencyColumn + 1
      const arms: StageLayout['arms'] = []
      for (const input of inputs) {
        if (input.column + 1 < column) {
          arms.push({
            startColumn: input.column + 1,
            endColumn: column - 1,
            startRow: input.startRow,
            endRow: input.endRow,
          })
        }
      }
      layout.stages.push({ outcome: value, stage, column, startRow, endRow, arms, branchColor: 0 })
      previousColumn = column
      layout.columns = Math.max(layout.columns, column)
    }

    return { startRow, endRow, column: previousColumn }
  }

  for (const root of document.roots) {
    outcome(root)
    nextRow += ROOT_GAP
  }
  layout.rows = Math.max(1, nextRow - ROOT_GAP)
  assignBranchColors(layout.stages)
  return layout
}

function layoutOutcome(document: TrnDocument, outcome: TrnOutcome): Layout {
  const layout: Layout = { leaves: [], stages: [], rows: 0, columns: 0 }
  let nextRow = 0
  let startRow = -1
  let endRow = -1
  let previousColumn = 0

  for (const stage of outcome.stages) {
    const inputs: Array<{ startRow: number; endRow: number; column: number }> = []
    for (const input of stage.inputs) {
      const value = document.ingredients.get(input.id) ?? document.outcomes.get(input.id)!
      const row = nextRow
      nextRow += 1
      layout.leaves.push({ row, input, label: value.label })
      inputs.push({ startRow: row, endRow: row, column: 0 })
      if (startRow < 0) startRow = row
      endRow = row
    }

    const column = previousColumn + 1
    const arms: StageLayout['arms'] = inputs
      .filter(input => input.column + 1 < column)
      .map(input => ({
        startColumn: input.column + 1,
        endColumn: column - 1,
        startRow: input.startRow,
        endRow: input.endRow,
      }))
    layout.stages.push({ outcome, stage, column, startRow, endRow, arms, branchColor: 0 })
    previousColumn = column
    layout.columns = column
  }

  layout.rows = Math.max(1, nextRow)
  assignBranchColors(layout.stages)
  return layout
}

function outcomesInDependencyOrder(document: TrnDocument): TrnOutcome[] {
  const ordered: TrnOutcome[] = []
  const visited = new Set<string>()
  function visit(outcome: TrnOutcome): void {
    if (visited.has(outcome.id)) return
    visited.add(outcome.id)
    for (const stage of outcome.stages) {
      for (const input of stage.inputs) {
        const child = document.outcomes.get(input.id)
        if (child !== undefined) visit(child)
      }
    }
    ordered.push(outcome)
  }
  for (const root of document.roots) visit(root)
  return ordered
}

function stageCells(item: StageLayout): Set<string> {
  const cells = new Set<string>()
  for (let row = item.startRow; row <= item.endRow; row += 1) cells.add(`${item.column}:${row}`)
  for (const arm of item.arms) {
    for (let column = arm.startColumn; column <= arm.endColumn; column += 1) {
      for (let row = arm.startRow; row <= arm.endRow; row += 1) cells.add(`${column}:${row}`)
    }
  }
  return cells
}

function zonesTouch(left: Set<string>, right: Set<string>): boolean {
  for (const value of left) {
    const [column, row] = value.split(':').map(Number) as [number, number]
    if (right.has(`${column - 1}:${row}`) || right.has(`${column + 1}:${row}`)
      || right.has(`${column}:${row - 1}`) || right.has(`${column}:${row + 1}`)) return true
  }
  return false
}

function assignBranchColors(stages: StageLayout[]): void {
  const cells = stages.map(stageCells)
  const neighbors = stages.map(() => new Set<number>())
  for (let left = 0; left < stages.length; left += 1) {
    for (let right = left + 1; right < stages.length; right += 1) {
      if (!zonesTouch(cells[left]!, cells[right]!)) continue
      neighbors[left]!.add(right)
      neighbors[right]!.add(left)
    }
  }

  const colors = Array.from({ length: stages.length }, () => -1)
  function colorNext(): boolean {
    let selected = -1
    let selectedSaturation = -1
    let selectedDegree = -1
    for (let index = 0; index < stages.length; index += 1) {
      if (colors[index] !== -1) continue
      const saturation = new Set([...neighbors[index]!].map(neighbor => colors[neighbor]!).filter(color => color >= 0)).size
      const degree = neighbors[index]!.size
      if (saturation > selectedSaturation || (saturation === selectedSaturation && degree > selectedDegree)) {
        selected = index
        selectedSaturation = saturation
        selectedDegree = degree
      }
    }
    if (selected === -1) return true
    const unavailable = new Set([...neighbors[selected]!].map(neighbor => colors[neighbor]!).filter(color => color >= 0))
    for (let color = 0; color < BRANCH_COLORS.length; color += 1) {
      if (unavailable.has(color)) continue
      colors[selected] = color
      if (colorNext()) return true
      colors[selected] = -1
    }
    return false
  }

  if (!colorNext()) throw new Error('TRN relationship zones could not be colored without adjacent matches.')
  stages.forEach((stage, index) => { stage.branchColor = colors[index]! })
}

function geometryFor(layout: Layout): Geometry {
  const longestIngredient = Math.max(...layout.leaves.map(leaf => textWidth(ingredientText(leaf), 12, 18)))
  const labelWidth = Math.ceil(clamp(longestIngredient, MIN_LABEL_WIDTH, MAX_LABEL_WIDTH))
  const columnWidths = Array.from({ length: layout.columns }, () => OPERATION_WIDTH)
  const columnOffsets: number[] = []
  let offset = labelWidth
  for (const width of columnWidths) {
    columnOffsets.push(offset)
    offset += width
  }
  const rowHeights = Array.from({ length: layout.rows }, () => MIN_ROW_HEIGHT)
  const stagesBySpan = [...layout.stages].sort((left, right) =>
    (left.endRow - left.startRow) - (right.endRow - right.startRow))
  for (const item of stagesBySpan) {
    const requiredHeight = Math.ceil(textWidth(actionText(item), OPERATION_FONT_SIZE, OPERATION_TEXT_PADDING))
    const rows = item.endRow - item.startRow + 1
    const availableHeight = rowHeights.slice(item.startRow, item.endRow + 1)
      .reduce((total, height) => total + height, 0)
    let deficit = Math.max(0, requiredHeight - availableHeight)
    for (let row = item.startRow; row <= item.endRow && deficit > 0; row += 1) {
      const rowsLeft = item.endRow - row + 1
      const addition = Math.ceil(deficit / rowsLeft)
      rowHeights[row]! += addition
      deficit -= addition
    }
  }
  const rowOffsets: number[] = []
  let bodyHeight = 0
  for (const height of rowHeights) {
    rowOffsets.push(bodyHeight)
    bodyHeight += height
  }
  return { labelWidth, columnWidths, columnOffsets, rowHeights, rowOffsets, bodyHeight, tableWidth: offset }
}

function leafSvg(leaf: LeafLayout, geometry: Geometry, bodyY: number): string {
  const text = ingredientText(leaf)
  const x = MARGIN + 7
  const height = geometry.rowHeights[leaf.row]!
  const top = rowY(leaf.row, bodyY, geometry)
  const y = top + height / 2 + 4
  const available = geometry.labelWidth - 14
  const length = Math.max(1, Math.floor(available / 6.7))
  const shown = text.length <= length ? text : `${text.slice(0, length - 1)}…`
  return `<g class="trn-ingredient" data-value-id="${escapeXml(leaf.input.id)}"><title>${escapeXml(text)}</title><rect class="trn-ingredient-cell" x="${MARGIN}" y="${top}" width="${geometry.labelWidth}" height="${height}" fill="white" stroke="${GRID_COLOR}" stroke-width="1"/><text class="trn-ingredient-label" x="${x}" y="${y}" fill="#111827" font-size="12" font-family="${FONT_FAMILY}">${escapeXml(shown)}</text></g>`
}

function stageSvg(item: StageLayout, geometry: Geometry, bodyY: number): string {
  const x = MARGIN + geometry.columnOffsets[item.column - 1]!
  const y = rowY(item.startRow, bodyY, geometry)
  const width = geometry.columnWidths[item.column - 1]!
  const height = geometry.rowOffsets[item.endRow]! + geometry.rowHeights[item.endRow]! - geometry.rowOffsets[item.startRow]!
  const result = item.outcome.portion === '' ? item.outcome.label : `${item.outcome.label} (${item.outcome.portion})`
  const action = actionText(item)
  const cells = stageCells(item)
  const columnLeft = (column: number): number => MARGIN + geometry.columnOffsets[column - 1]!
  const columnRight = (column: number): number => columnLeft(column) + geometry.columnWidths[column - 1]!
  const edges: Array<{ start: [number, number]; end: [number, number] }> = []
  for (const value of cells) {
    const [column, row] = value.split(':').map(Number) as [number, number]
    const left = columnLeft(column)
    const right = columnRight(column)
    const top = rowY(row, bodyY, geometry)
    const bottom = top + geometry.rowHeights[row]!
    if (!cells.has(`${column}:${row - 1}`)) edges.push({ start: [left, top], end: [right, top] })
    if (!cells.has(`${column + 1}:${row}`)) edges.push({ start: [right, top], end: [right, bottom] })
    if (!cells.has(`${column}:${row + 1}`)) edges.push({ start: [right, bottom], end: [left, bottom] })
    if (!cells.has(`${column - 1}:${row}`)) edges.push({ start: [left, bottom], end: [left, top] })
  }
  const pointKey = (point: [number, number]): string => `${point[0]}:${point[1]}`
  const edgesByStart = new Map<string, number[]>()
  edges.forEach((edge, index) => {
    const key = pointKey(edge.start)
    const indexes = edgesByStart.get(key) ?? []
    indexes.push(index)
    edgesByStart.set(key, indexes)
  })
  const usedEdges = new Set<number>()
  const paths: string[] = []
  for (let index = 0; index < edges.length; index += 1) {
    if (usedEdges.has(index)) continue
    const first = edges[index]!
    usedEdges.add(index)
    const points: Array<[number, number]> = [first.start, first.end]
    let current = first.end
    while (pointKey(current) !== pointKey(first.start)) {
      const nextIndex = (edgesByStart.get(pointKey(current)) ?? []).find(candidate => !usedEdges.has(candidate))
      if (nextIndex === undefined) throw new Error('TRN relationship zone has an open boundary.')
      usedEdges.add(nextIndex)
      current = edges[nextIndex]!.end
      points.push(current)
    }
    paths.push(`M${points.map(point => `${point[0]} ${point[1]}`).join('L')}Z`)
  }
  const zonePath = paths.join('')
  return [
    `<g class="trn-operation-zone" data-outcome-id="${escapeXml(item.outcome.id)}" data-column="${item.column}" data-cell-count="${cells.size}" data-arm-count="${item.arms.length}" data-branch-color="${item.branchColor + 1}">`,
    `<title>${escapeXml(action)} → ${escapeXml(result)}</title>`,
    `<path class="trn-zone-shape trn-branch-${item.branchColor + 1}" d="${zonePath}" fill="${BRANCH_COLORS[item.branchColor]}" stroke="${GRID_COLOR}" stroke-width="1"/>`,
    `<text class="trn-operation-label" x="${x + width / 2}" y="${y + height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#111827" font-size="${OPERATION_FONT_SIZE}" font-family="${FONT_FAMILY}" transform="rotate(90 ${x + width / 2} ${y + height / 2})">${escapeXml(action)}</text>`,
    '</g>',
  ].join('')
}

function instructionSvg(document: TrnDocument, tableY: number, tableWidth: number): string {
  return document.instructions.map((instruction, index) => {
    const y = tableY + index * MIN_ROW_HEIGHT
    return `<g class="trn-instruction"><rect class="trn-instruction-cell" x="${MARGIN}" y="${y}" width="${tableWidth}" height="${MIN_ROW_HEIGHT}" fill="white" stroke="${GRID_COLOR}" stroke-width="1"/><text class="trn-instruction-label" x="${MARGIN + tableWidth / 2}" y="${y + MIN_ROW_HEIGHT / 2 + 4}" text-anchor="middle" fill="#111827" font-size="12" font-family="${FONT_FAMILY}">${escapeXml(instruction.text)}</text></g>`
  }).join('')
}

function renderCombinedTrn(document: TrnDocument): string {
  const layout = layoutTree(document)
  const geometry = geometryFor(layout)
  const tableY = MARGIN + HEADER_HEIGHT
  const instructionHeight = document.instructions.length * MIN_ROW_HEIGHT
  const bodyY = tableY + instructionHeight
  const width = MARGIN * 2 + geometry.tableWidth
  const height = MARGIN * 2 + HEADER_HEIGHT + instructionHeight + geometry.bodyHeight
  const title = document.roots.map(root => root.portion === '' ? root.label : `${root.label} (yields ${root.portion})`).join(' + ')
  const instructions = instructionSvg(document, tableY, geometry.tableWidth)
  const leaves = layout.leaves.map(item => leafSvg(item, geometry, bodyY)).join('')
  const stages = layout.stages.map(item => stageSvg(item, geometry, bodyY)).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="trn-diagram trn-layout-combined" data-layout="combined">
  <title>${escapeXml(title)} TRN</title>
  <desc>Tabular Recipe Notation with ingredients in rows and operations spanning the rows they combine.</desc>
  <rect class="trn-canvas" data-dz-role="canvas" x="0" y="0" width="${width}" height="${height}" fill="#fbf8dc"/>
  <text class="trn-title" x="${MARGIN + 7}" y="${MARGIN + 19}" fill="#111827" font-size="14" font-weight="700" font-family="${FONT_FAMILY}">${escapeXml(title)}</text>
  <rect class="trn-table-surface" x="${MARGIN}" y="${tableY}" width="${geometry.tableWidth}" height="${instructionHeight + geometry.bodyHeight}" fill="white" stroke="${GRID_COLOR}" stroke-width="1"/>
  ${instructions}
  ${leaves}
  ${stages}
</svg>`
}

function renderIndividualTrn(document: TrnDocument): string {
  const title = document.roots.map(root => root.portion === '' ? root.label : `${root.label} (yields ${root.portion})`).join(' + ')
  const recipes = outcomesInDependencyOrder(document).map(outcome => {
    const layout = layoutOutcome(document, outcome)
    const geometry = geometryFor(layout)
    return { outcome, layout, geometry, height: HEADER_HEIGHT + geometry.bodyHeight }
  })
  const recipeById = new Map(recipes.map(recipe => [recipe.outcome.id, recipe]))
  const dependencies = new Map(recipes.map(recipe => [
    recipe.outcome.id,
    [...new Set(recipe.outcome.stages.flatMap(stage => stage.inputs.map(input => input.id)))]
      .map(id => document.outcomes.get(id))
      .filter((outcome): outcome is TrnOutcome => outcome !== undefined),
  ]))
  const depths = new Map<string, number>()
  function depthOf(outcome: TrnOutcome): number {
    const known = depths.get(outcome.id)
    if (known !== undefined) return known
    const children = dependencies.get(outcome.id) ?? []
    const depth = children.length === 0 ? 0 : Math.max(...children.map(depthOf)) + 1
    depths.set(outcome.id, depth)
    return depth
  }
  const maximumDepth = Math.max(...recipes.map(recipe => depthOf(recipe.outcome)))
  const columnWidths = Array.from({ length: maximumDepth + 1 }, (_, depth) =>
    Math.max(...recipes.filter(recipe => depthOf(recipe.outcome) === depth).map(recipe => recipe.geometry.tableWidth)))
  const columnOffsets: number[] = []
  let columnOffset = 0
  for (const columnWidth of columnWidths) {
    columnOffsets.push(columnOffset)
    columnOffset += columnWidth + RECIPE_COLUMN_GAP
  }
  const centers = new Map<string, number>()
  for (let depth = 0; depth <= maximumDepth; depth += 1) {
    const column = recipes.filter(recipe => depthOf(recipe.outcome) === depth)
      .map(recipe => {
        const children = dependencies.get(recipe.outcome.id) ?? []
        const target = children.length === 0
          ? Number.POSITIVE_INFINITY
          : children.reduce((total, child) => total + centers.get(child.id)!, 0) / children.length
        return { recipe, target }
      })
    if (depth === 0) {
      let cursor = 0
      for (const item of column) {
        centers.set(item.recipe.outcome.id, cursor + item.recipe.height / 2)
        cursor += item.recipe.height + RECIPE_GAP
      }
      continue
    }
    column.sort((left, right) => left.target - right.target)
    let bottom = 0
    for (const item of column) {
      const center = Math.max(item.target, bottom + item.recipe.height / 2)
      centers.set(item.recipe.outcome.id, center)
      bottom = center + item.recipe.height / 2 + RECIPE_GAP
    }
  }
  const treeHeight = Math.max(...recipes.map(recipe => centers.get(recipe.outcome.id)! + recipe.height / 2))
  const width = columnOffset - RECIPE_COLUMN_GAP + MARGIN * 2
  const instructionHeight = document.instructions.length * MIN_ROW_HEIGHT
  const instructionY = MARGIN + HEADER_HEIGHT
  const treeBaseY = instructionY + instructionHeight + (instructionHeight > 0 ? RECIPE_GAP : 0)
  const dependencyLinks = recipes.flatMap(parent => (dependencies.get(parent.outcome.id) ?? []).map(child => ({ parent, child })))
  const treeY = treeBaseY
  const instructions = instructionSvg(document, instructionY, width - MARGIN * 2)
  const recipeRects = recipes.map(recipe => {
    const depth = depthOf(recipe.outcome)
    const top = treeY + centers.get(recipe.outcome.id)! - recipe.height / 2
    return {
      id: recipe.outcome.id,
      left: columnOffsets[depth]! + MARGIN - RECIPE_LINK_CLEARANCE,
      right: columnOffsets[depth]! + MARGIN + recipe.geometry.tableWidth + RECIPE_LINK_CLEARANCE,
      top: top - RECIPE_LINK_CLEARANCE,
      bottom: top + recipe.height + RECIPE_LINK_CLEARANCE,
    }
  })

  const recipeSvg = recipes.map(recipe => {
    const depth = depthOf(recipe.outcome)
    const recipeX = columnOffsets[depth]!
    const recipeY = Math.round(centers.get(recipe.outcome.id)! - recipe.height / 2)
    const tableY = HEADER_HEIGHT
    const bodyY = tableY
    const recipeTitle = recipe.outcome.portion === ''
      ? recipe.outcome.label
      : `${recipe.outcome.label} (${recipe.outcome.portion})`
    const leaves = recipe.layout.leaves.map(item => leafSvg(item, recipe.geometry, bodyY)).join('')
    const stages = recipe.layout.stages.map(item => stageSvg(item, recipe.geometry, bodyY)).join('')
    return `<g class="trn-individual-recipe" data-recipe-id="${escapeXml(recipe.outcome.id)}" data-depth="${depth}" transform="translate(${recipeX} ${treeY + recipeY})"><text class="trn-title trn-recipe-title" x="${MARGIN + 7}" y="19" fill="#111827" font-size="14" font-weight="700" font-family="${FONT_FAMILY}">${escapeXml(recipeTitle)}</text><rect class="trn-table-surface" x="${MARGIN}" y="${tableY}" width="${recipe.geometry.tableWidth}" height="${recipe.geometry.bodyHeight}" fill="white" stroke="${GRID_COLOR}" stroke-width="1"/>${leaves}${stages}</g>`
  }).join('')
  const links = dependencyLinks.map(({ parent, child }) => {
    const childRecipe = recipeById.get(child.id)!
    const childDepth = depthOf(child)
    const parentDepth = depthOf(parent.outcome)
    const startX = columnOffsets[childDepth]! + MARGIN + childRecipe.geometry.tableWidth
    const startY = treeY + centers.get(child.id)! + HEADER_HEIGHT / 2
    const endX = columnOffsets[parentDepth]! + MARGIN
    const endY = treeY + centers.get(parent.outcome.id)! + HEADER_HEIGHT / 2
    const startGutterX = columnOffsets[childDepth]! + MARGIN + columnWidths[childDepth]! + RECIPE_COLUMN_GAP / 2
    const endGutterX = columnOffsets[parentDepth]! + MARGIN - RECIPE_COLUMN_GAP / 2
    const relevantRects = recipeRects.filter(rect => rect.id !== child.id && rect.id !== parent.outcome.id
      && rect.left < endGutterX && rect.right > startGutterX)
    const candidates = [...new Set([
      startY,
      endY,
      ...relevantRects.flatMap(rect => [rect.top, rect.bottom]),
      treeY + treeHeight + RECIPE_LINK_CLEARANCE,
    ])]
    const hallwayY = candidates
      .filter(y => relevantRects.every(rect => y <= rect.top || y >= rect.bottom))
      .sort((left, right) => {
        const leftCost = Math.abs(startY - left) + Math.abs(endY - left)
        const rightCost = Math.abs(startY - right) + Math.abs(endY - right)
        return leftCost - rightCost || Math.abs(startY - left) - Math.abs(startY - right)
      })[0]!
    const adjacent = parentDepth - childDepth === 1
    const route = adjacent
      ? `M${startX} ${startY}H${startGutterX}V${endY}H${endX}`
      : `M${startX} ${startY}H${startGutterX}V${hallwayY}H${endGutterX}V${endY}H${endX}`
    const routeKind = adjacent ? 'gutter' : 'hallway'
    return `<path class="trn-recipe-link" data-from="${escapeXml(child.id)}" data-to="${escapeXml(parent.outcome.id)}" data-route="${routeKind}" d="${route}" fill="none" stroke="${GRID_COLOR}" stroke-width="1.5"/>`
  }).join('')
  const height = treeY + treeHeight + MARGIN

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="trn-diagram trn-layout-individual" data-layout="individual">
  <title>${escapeXml(title)} individual TRN recipes</title>
  <desc>Tabular Recipe Notation with one table per produced outcome, arranged left to right by dependency depth.</desc>
  <rect class="trn-canvas" data-dz-role="canvas" x="0" y="0" width="${width}" height="${height}" fill="#fbf8dc"/>
  <text class="trn-title" x="${MARGIN + 7}" y="${MARGIN + 19}" fill="#111827" font-size="14" font-weight="700" font-family="${FONT_FAMILY}">${escapeXml(title)} — individual recipes</text>
  ${instructions}
  <g class="trn-recipe-links">${links}</g>
  ${recipeSvg}
</svg>`
}

export function renderTrn(document: TrnDocument): string {
  return document.layout === 'individual' ? renderIndividualTrn(document) : renderCombinedTrn(document)
}
