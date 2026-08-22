/**
 * A DOM-free command palette model.
 *
 * Groups are objects with a `commands` array.  A command may contain `id`,
 * `label`, `description`, `keywords`, `shortcut`, `disabled`, and `run`.
 * Group and command order is retained throughout the model's lifetime.
 */

const asText = value => value == null ? '' : String(value)

function keywordsText(keywords) {
  if (Array.isArray(keywords)) return keywords.map(asText).join(' ')
  return asText(keywords)
}

function searchableText(command) {
  return [
    command.id,
    command.label,
    command.description,
    keywordsText(command.keywords),
    command.shortcut,
  ].map(asText).join(' ').toLocaleLowerCase()
}

function queryTokens(query) {
  return asText(query).toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
}

function commandsForGroup(group) {
  if (Array.isArray(group)) return group
  return Array.isArray(group?.commands) ? group.commands : []
}

/** Flatten groups while retaining references and stable source order. */
export function flattenCommandGroups(groups = []) {
  const source = Array.isArray(groups) ? groups : []
  return source.flatMap(group => commandsForGroup(group))
}

/**
 * Create a command palette model. Methods return command objects (or null)
 * and never interact with the DOM.
 */
export function createCommandPaletteModel(groups = []) {
  const commands = flattenCommandGroups(groups)
  const byId = new Map()
  for (const command of commands) {
    if (command && command.id != null && !byId.has(command.id)) byId.set(command.id, command)
  }

  let query = ''
  let selectedId = null

  const matchingCommands = () => {
    const tokens = queryTokens(query)
    if (!tokens.length) return commands.filter(Boolean)
    return commands.filter(command => {
      if (!command) return false
      const text = searchableText(command)
      return tokens.every(token => text.includes(token))
    })
  }

  const enabled = command => command && command.disabled !== true
  const enabledResults = () => matchingCommands().filter(enabled)

  const select = command => {
    selectedId = command?.id ?? null
    return command ?? null
  }

  const selectFirst = (nextQuery = query) => {
    query = asText(nextQuery)
    return select(enabledResults()[0])
  }

  const move = (direction, nextQuery = query) => {
    query = asText(nextQuery)
    const results = matchingCommands()
    const available = results.filter(enabled)
    if (!available.length) return select(null)

    const currentIndex = available.findIndex(command => command.id === selectedId)
    if (currentIndex < 0) return select(available[direction > 0 ? 0 : available.length - 1])
    const start = currentIndex
    return select(available[(start + direction + available.length) % available.length])
  }

  return {
    groups,
    commands,
    get query() { return query },
    get selectedId() { return selectedId },
    get selected() { return byId.get(selectedId) ?? null },
    filter(nextQuery = '') {
      query = asText(nextQuery)
      return matchingCommands()
    },
    results() { return matchingCommands() },
    selectFirst,
    next: (nextQuery = query) => move(1, nextQuery),
    previous: (nextQuery = query) => move(-1, nextQuery),
    prev: (nextQuery = query) => move(-1, nextQuery),
    selectById(id) {
      const command = byId.get(id) ?? null
      return select(enabled(command) ? command : null)
    },
    getById(id) { return byId.get(id) ?? null },
  }
}

export default createCommandPaletteModel
