import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(import.meta.dirname),
  base: '/diagram.zip/',
  plugins: [{
    name: 'diagramzip-history-fallback',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url === '/' || /^\/d\/[A-Za-z0-9_-]{16}(?:[?#].*)?$/.test(request.url ?? '')) {
          request.url = '/diagram.zip/'
        }
        next()
      })
    },
  }],
  server: {
    proxy: {
      '/api/v1': process.env.DIAGRAMZIP_API_TARGET ?? 'http://127.0.0.1:8787',
      '/render/v1': process.env.DIAGRAMZIP_RENDER_TARGET ?? 'http://127.0.0.1:8788',
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, '../server/src/main/resources/web/diagramzip'),
    emptyOutDir: true,
  },
})
