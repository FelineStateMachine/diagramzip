export function createEditor({
  element,
  source,
  diagramType,
  language,
  ariaLabel = 'Diagram source editor',
  onChange,
  onSave,
}) {
  let suppressChanges = 0
  const textarea = document.createElement('textarea')
  textarea.className = 'source-editor-textarea'
  textarea.value = source
  textarea.dataset.language = language ?? diagramType
  textarea.setAttribute('aria-label', ariaLabel)
  textarea.setAttribute('autocapitalize', 'off')
  textarea.setAttribute('autocomplete', 'off')
  textarea.setAttribute('autocorrect', 'off')
  textarea.setAttribute('spellcheck', 'false')
  textarea.setAttribute('wrap', 'off')

  const handleInput = () => {
    if (suppressChanges === 0) onChange()
  }
  const handleKeydown = event => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return
    event.preventDefault()
    event.stopPropagation()
    onSave()
  }
  textarea.addEventListener('input', handleInput)
  textarea.addEventListener('keydown', handleKeydown)
  element.replaceChildren(textarea)

  return {
    backend: 'textarea',
    getValue: () => textarea.value,
    setDocument({ source: nextSource, diagramType: nextType = diagramType, language: nextLanguage = language }) {
      suppressChanges += 1
      try {
        const start = Math.min(textarea.selectionStart, nextSource.length)
        const end = Math.min(textarea.selectionEnd, nextSource.length)
        textarea.value = nextSource
        textarea.dataset.language = nextLanguage ?? nextType
        textarea.setSelectionRange(start, end)
      } finally {
        suppressChanges -= 1
      }
    },
    focus: () => textarea.focus(),
    layout() {},
    dispose() {
      textarea.removeEventListener('input', handleInput)
      textarea.removeEventListener('keydown', handleKeydown)
      textarea.remove()
    },
  }
}
