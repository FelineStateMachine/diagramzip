export function editorBackendFor({
  search = globalThis.location?.search ?? '',
  coarsePointer = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false,
} = {}) {
  const requested = new URLSearchParams(search).get('editor')
  if (requested === 'textarea' || requested === 'monaco') return requested
  return coarsePointer ? 'textarea' : 'monaco'
}

export async function createSourceEditor(options) {
  const preferredBackend = editorBackendFor()
  try {
    return await createBackend(preferredBackend, options)
  } catch (error) {
    if (preferredBackend === 'textarea') throw error
    console.warn('Monaco Editor is unavailable; using the basic text editor.', error)
    return createBackend('textarea', options)
  }
}

async function createBackend(backend, options) {
  const module = backend === 'textarea'
    ? await import('./editors/textarea-editor.js')
    : await import('./editors/monaco-editor.js')
  const editor = await module.createEditor(options)
  options.element.dataset.editorBackend = backend
  return editor
}
