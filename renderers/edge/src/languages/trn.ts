import { RenderError } from '../runtime/errors'

export interface TrnIngredient {
  id: string
  label: string
  line: number
}

export interface TrnInput {
  id: string
  quantity: string
  line: number
}

export interface TrnStage {
  inputs: TrnInput[]
  action: string
  line: number
}

export interface TrnOutcome {
  id: string
  label: string
  portion: string
  stages: TrnStage[]
  line: number
}

export type TrnLayout = 'combined' | 'individual'

export interface TrnDocument {
  layout: TrnLayout
  ingredients: Map<string, TrnIngredient>
  outcomes: Map<string, TrnOutcome>
  instructions: Array<{ text: string; line: number }>
  roots: TrnOutcome[]
}

const IDENTIFIER = '[A-Za-z][A-Za-z0-9_]*'

function sourceError(line: number, message: string): never {
  throw new RenderError(422, 'invalid_source', `Line ${line}: ${message}`)
}

function displayName(id: string): string {
  return id.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase())
}

function quotedLabel(value: string, line: number): string {
  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return sourceError(line, 'The display label is not a valid quoted string.')
  }
}

function validateReferences(document: TrnDocument): void {
  const referencedOutcomes = new Set<string>()
  for (const outcome of document.outcomes.values()) {
    for (const stage of outcome.stages) {
      for (const input of stage.inputs) {
        if (document.outcomes.has(input.id)) referencedOutcomes.add(input.id)
        else if (!document.ingredients.has(input.id)) sourceError(input.line, `Unknown value '${input.id}'.`)
      }
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  function visit(id: string, path: string[]): void {
    if (visiting.has(id)) sourceError(document.outcomes.get(id)!.line, `Outcome cycle: ${[...path, id].join(' -> ')}.`)
    if (visited.has(id)) return
    visiting.add(id)
    const outcome = document.outcomes.get(id)!
    for (const stage of outcome.stages) {
      for (const input of stage.inputs) {
        if (document.outcomes.has(input.id)) visit(input.id, [...path, id])
      }
    }
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of document.outcomes.keys()) visit(id, [])

  document.roots = [...document.outcomes.values()].filter(outcome => !referencedOutcomes.has(outcome.id))
  if (document.roots.length === 0) sourceError(1, 'The document has no unconsumed outcome to render.')
}

export function parseTrn(source: string): TrnDocument {
  const document: TrnDocument = {
    layout: 'combined',
    ingredients: new Map(),
    outcomes: new Map(),
    instructions: [],
    roots: [],
  }
  let current: { id: string; label: string; portion: string; line: number; stages: TrnStage[]; pending: TrnInput[] } | null = null
  let layoutDeclared = false
  let declarationsStarted = false

  const lines = source.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const line = lines[index]!.trim()
    if (line === '' || line.startsWith('#')) continue

    if (current !== null) {
      if (line === '}') {
        if (current.pending.length > 0) sourceError(lineNumber, `Outcome '${current.id}' has inputs without a following step.`)
        if (current.stages.length === 0) sourceError(current.line, `Outcome '${current.id}' must contain at least one step.`)
        const portionStage = current.stages.find(stage => stage.action.includes('{portion}'))
        if (portionStage !== undefined && current.portion === '') {
          sourceError(portionStage.line, `Action in '${current.id}' uses {portion}, but the outcome has no portion.`)
        }
        const outcome: TrnOutcome = {
          id: current.id,
          label: current.label,
          portion: current.portion,
          stages: current.stages,
          line: current.line,
        }
        document.outcomes.set(outcome.id, outcome)
        current = null
        continue
      }

      const inputMatch = line.match(new RegExp(`^\\+\\s+(${IDENTIFIER})(?:\\s+(.+))?$`))
      if (inputMatch !== null) {
        current.pending.push({ id: inputMatch[1]!, quantity: inputMatch[2]?.trim() ?? '', line: lineNumber })
        continue
      }
      const stepMatch = line.match(/^->\s+(.+)$/)
      if (stepMatch !== null) {
        if (current.stages.length === 0 && current.pending.length === 0) {
          sourceError(lineNumber, `The first step in '${current.id}' needs an input.`)
        }
        current.stages.push({ inputs: current.pending, action: stepMatch[1]!.trim(), line: lineNumber })
        current.pending = []
        continue
      }
      sourceError(lineNumber, "Expected '+ value', '-> action', or '}'.")
    }

    const layoutMatch = line.match(/^\.layout\s+(combined|individual)\s*$/)
    if (layoutMatch !== null) {
      if (declarationsStarted) sourceError(lineNumber, 'The .layout directive must appear before recipe declarations.')
      if (layoutDeclared) sourceError(lineNumber, 'The .layout directive may only appear once.')
      document.layout = layoutMatch[1] as TrnLayout
      layoutDeclared = true
      continue
    }
    if (line.startsWith('.layout')) sourceError(lineNumber, "Expected '.layout combined' or '.layout individual'.")

    const instructionMatch = line.match(/^instruction\s+"((?:[^"\\]|\\.)*)"\s*$/)
    if (instructionMatch !== null) {
      declarationsStarted = true
      document.instructions.push({ text: quotedLabel(instructionMatch[1]!, lineNumber), line: lineNumber })
      continue
    }

    const ingredientMatch = line.match(new RegExp(`^ingredient\\s+(${IDENTIFIER})(?:\\s+"((?:[^"\\\\]|\\\\.)*)")?\\s*$`))
    if (ingredientMatch !== null) {
      declarationsStarted = true
      const id = ingredientMatch[1]!
      if (document.ingredients.has(id) || document.outcomes.has(id)) sourceError(lineNumber, `Duplicate value '${id}'.`)
      document.ingredients.set(id, {
        id,
        label: ingredientMatch[2] === undefined ? displayName(id) : quotedLabel(ingredientMatch[2], lineNumber),
        line: lineNumber,
      })
      continue
    }

    const outcomeMatch = line.match(new RegExp(`^outcome\\s+(${IDENTIFIER})(?:\\s+"((?:[^"\\\\]|\\\\.)*)")?(?:\\s+portion\\s+(.+?))?\\s*\\{\\s*$`))
    if (outcomeMatch !== null) {
      declarationsStarted = true
      const id = outcomeMatch[1]!
      if (document.ingredients.has(id) || document.outcomes.has(id)) sourceError(lineNumber, `Duplicate value '${id}'.`)
      current = {
        id,
        label: outcomeMatch[2] === undefined ? displayName(id) : quotedLabel(outcomeMatch[2], lineNumber),
        portion: outcomeMatch[3]?.trim() ?? '',
        line: lineNumber,
        stages: [],
        pending: [],
      }
      continue
    }

    sourceError(lineNumber, "Expected an instruction, ingredient, or outcome declaration.")
  }

  if (current !== null) sourceError(current.line, `Outcome '${current.id}' is missing its closing brace.`)
  if (document.outcomes.size === 0) sourceError(1, 'The document must declare at least one outcome.')
  validateReferences(document)
  return document
}
