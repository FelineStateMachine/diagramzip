import { normalizeMetadata, normalizePresentation } from './state.js'

export function workingStateSnapshot(state, mode = 'open') {
  return JSON.stringify({
    mode,
    type: state.type,
    source: state.source,
    options: state.options ?? {},
    meta: normalizeMetadata(state.meta),
    presentation: normalizePresentation(state.presentation),
  })
}

export function workingStateIsDirty(state, {
  mode = 'open',
  keyEnvelopeDirty = false,
  savedSnapshot = null,
  defaultStateFor,
} = {}) {
  if (keyEnvelopeDirty) return true
  const baseline = savedSnapshot ?? workingStateSnapshot(defaultStateFor(state.type), 'open')
  return workingStateSnapshot(state, mode) !== baseline
}
