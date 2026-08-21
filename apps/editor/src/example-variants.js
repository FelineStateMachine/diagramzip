export function grayCode(index) {
  return index ^ (index >> 1)
}

export function defaultExampleAppearance(type) {
  return type === 'diagramsnet' ? 'auto-framed' : 'auto-transparent'
}

export function exampleVariant(index, context) {
  const gray = grayCode(index)
  return {
    meta: {
      title: context.title,
      description: gray & 2 ? context.description : '',
    },
    presentation: {
      background: '',
      padding: gray & 8 ? 24 : 0,
      frame: false,
    },
  }
}

export function refreshMatchingExampleMetadata(state, exampleState) {
  if (state?.source !== exampleState?.source || state?.meta?.title?.trim()) return state

  return {
    ...state,
    meta: {
      ...state.meta,
      title: exampleState.meta.title,
      description: state.meta?.description?.trim()
        ? state.meta.description
        : exampleState.meta.description,
    },
  }
}
