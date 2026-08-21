import { parse, View, type Loader, type Spec } from 'vega'
import { expressionInterpreter } from 'vega-interpreter'

const disabledLoader: Loader = {
  load: async () => { throw new Error('External Vega data loading is disabled.') },
  http: async () => { throw new Error('External Vega HTTP loading is disabled.') },
  file: async () => { throw new Error('External Vega file loading is disabled.') },
  sanitize: async uri => ({ href: uri }),
}

export function parsedSpecification(source: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(source)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Vega source must be a JSON object.')
  }
  return parsed as Record<string, unknown>
}

export function containsUrl(value: unknown): boolean {
  const pending: unknown[] = [value]
  let visited = 0
  while (pending.length > 0) {
    const current = pending.pop()
    if (++visited > 100_000) throw new Error('Vega specification is too complex.')
    if (Array.isArray(current)) {
      pending.push(...current)
      continue
    }
    if (typeof current !== 'object' || current === null) continue
    for (const [name, nested] of Object.entries(current)) {
      if (name.toLowerCase() === 'url' && nested !== undefined && nested !== null && nested !== '') return true
      pending.push(nested)
    }
  }
  return false
}

export async function renderVegaSpecification(specification: Spec): Promise<string> {
  const view = new View(parse(specification, undefined, { ast: true }), {
    expr: expressionInterpreter,
    loader: disabledLoader,
    renderer: 'none',
  })
  try {
    return await view.toSVG()
  } finally {
    view.finalize()
  }
}
