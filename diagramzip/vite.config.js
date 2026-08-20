import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(import.meta.dirname),
  base: '/diagram.zip/',
  build: {
    outDir: resolve(import.meta.dirname, '../server/src/main/resources/web/diagramzip'),
    emptyOutDir: true,
  },
})
