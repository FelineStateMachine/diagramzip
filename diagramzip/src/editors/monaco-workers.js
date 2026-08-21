import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker'

export function configureMonacoWorkers(scope = globalThis) {
  scope.MonacoEnvironment = {
    ...scope.MonacoEnvironment,
    getWorker(_workerId, label) {
      return label === 'json'
        ? new JsonWorker({ name: 'diagramzip-json' })
        : new EditorWorker({ name: 'diagramzip-editor' })
    },
  }
}
