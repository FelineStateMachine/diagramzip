export function grayCode(index) {
  return index ^ (index >> 1)
}

export function exampleVariant(index, context) {
  const gray = grayCode(index)
  return {
    meta: {
      title: gray & 1 ? context.title : '',
      description: gray & 2 ? context.description : '',
    },
    presentation: {
      background: gray & 4 ? '#f4f4f4' : '',
      padding: gray & 8 ? 24 : 0,
      frame: Boolean(gray & 16),
    },
  }
}
