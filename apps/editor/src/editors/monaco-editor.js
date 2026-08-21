import * as monaco from 'monaco-editor/editor/editor.api.js'
import 'monaco-editor/features/find/register.js'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching.js'
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard.js'
import 'monaco-editor/editor/contrib/contextmenu/browser/contextmenu.js'
import 'monaco-editor/editor/contrib/folding/browser/folding.js'
import { editorLanguageFor } from '../editor-languages.js'
import { registerMonacoLanguages } from './monaco-languages.js'
import { configureMonacoWorkers } from './monaco-workers.js'

const THEME_NAME = 'diagramzip'

export function createEditor({
  element,
  source,
  diagramType,
  language,
  modelUri,
  ariaLabel = 'Diagram source editor',
  onChange,
  onSave,
}) {
  configureMonacoWorkers()
  registerMonacoLanguages(monaco)
  defineTheme()

  let suppressChanges = 0
  const model = monaco.editor.createModel(
    source,
    language ?? editorLanguageFor(diagramType),
    monaco.Uri.parse(modelUri ?? 'inmemory://diagram.zip/source'),
  )
  const rootStyle = getComputedStyle(document.documentElement)
  const editor = monaco.editor.create(element, {
    model,
    ariaLabel,
    automaticLayout: true,
    contextmenu: true,
    fixedOverflowWidgets: true,
    folding: true,
    fontFamily: cssValue(rootStyle, '--font-mono'),
    fontSize: 14,
    glyphMargin: false,
    lineHeight: 23,
    lineNumbers: 'on',
    minimap: { enabled: false },
    overviewRulerBorder: false,
    padding: { top: 28, bottom: 80 },
    renderLineHighlight: 'all',
    scrollBeyondLastLine: false,
    stickyScroll: { enabled: false },
    theme: THEME_NAME,
    wordWrap: 'off',
  })

  const contentSubscription = model.onDidChangeContent(() => {
    if (suppressChanges === 0) onChange()
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSave())

  return {
    backend: 'monaco',
    getValue: () => model.getValue(),
    setDocument({ source: nextSource, diagramType: nextType = diagramType, language: nextLanguage = language }) {
      suppressChanges += 1
      try {
        const previousPosition = editor.getPosition()
        model.setValue(nextSource)
        monaco.editor.setModelLanguage(model, nextLanguage ?? editorLanguageFor(nextType))
        if (previousPosition) {
          const lineNumber = Math.min(previousPosition.lineNumber, model.getLineCount())
          const column = Math.min(previousPosition.column, model.getLineMaxColumn(lineNumber))
          editor.setPosition({ lineNumber, column })
          editor.revealPositionInCenterIfOutsideViewport({ lineNumber, column })
        }
      } finally {
        suppressChanges -= 1
      }
    },
    focus: () => editor.focus(),
    layout: () => editor.layout(),
    setTheme() {
      defineTheme()
      monaco.editor.setTheme(THEME_NAME)
    },
    dispose() {
      contentSubscription.dispose()
      editor.dispose()
      model.dispose()
    },
  }
}

function defineTheme() {
  const style = getComputedStyle(document.documentElement)
  monaco.editor.defineTheme(THEME_NAME, {
    base: document.documentElement.dataset.theme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: tokenColor(style, '--syntax-keyword'), fontStyle: 'bold' },
      { token: 'string', foreground: tokenColor(style, '--syntax-string') },
      { token: 'string.escape', foreground: tokenColor(style, '--syntax-string') },
      { token: 'comment', foreground: tokenColor(style, '--syntax-comment'), fontStyle: 'italic' },
      { token: 'number', foreground: tokenColor(style, '--syntax-number') },
      { token: 'number.hex', foreground: tokenColor(style, '--syntax-number') },
      { token: 'operator', foreground: tokenColor(style, '--syntax-operator') },
      { token: 'delimiter', foreground: tokenColor(style, '--syntax-operator') },
      { token: 'identifier', foreground: tokenColor(style, '--syntax-variable') },
      { token: 'key', foreground: tokenColor(style, '--syntax-variable') },
    ],
    colors: {
      'editor.background': themeColor(style, '--surface'),
      'editor.foreground': themeColor(style, '--ink'),
      'editorCursor.foreground': themeColor(style, '--accent'),
      'editorGutter.background': themeColor(style, '--surface'),
      'editorLineNumber.foreground': themeColor(style, '--muted'),
      'editor.lineHighlightBackground': themeColor(style, '--editor-active-line'),
      'editor.selectionBackground': themeColor(style, '--editor-selection'),
    },
  })
}

function cssValue(style, property) {
  return style.getPropertyValue(property).trim()
}

function tokenColor(style, property) {
  return themeColor(style, property).replace(/^#/, '')
}

function themeColor(style, property) {
  const color = cssValue(style, property)
  const shorthand = color.match(/^#([0-9a-f]{3,4})$/i)
  if (shorthand) {
    return `#${[...shorthand[1]].map(character => character.repeat(2)).join('')}`
  }
  return color
}
