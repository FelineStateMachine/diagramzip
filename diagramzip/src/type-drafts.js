export function stateForTypeChange(drafts, activeType, selectedType, currentState, defaultStateFor) {
  drafts.set(activeType, { ...currentState, type: activeType })
  return drafts.get(selectedType) ?? defaultStateFor(selectedType)
}
