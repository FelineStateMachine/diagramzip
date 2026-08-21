export function grayCode(index) {
  return index ^ (index >> 1)
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
