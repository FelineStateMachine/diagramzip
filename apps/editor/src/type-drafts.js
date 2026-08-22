export function stateForTypeChange(currentState, selectedType) {
  return {
    ...currentState,
    type: selectedType,
    options: {},
  }
}
