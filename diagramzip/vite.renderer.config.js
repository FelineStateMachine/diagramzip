import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    outDir: resolve(import.meta.dirname, '../server/src/main/resources/web/diagramzip'),
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/renderer-frame.js'),
      name: 'DiagramZipRendererFrame',
      formats: ['iife'],
      fileName: () => 'renderer-frame-v2.js',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
})
