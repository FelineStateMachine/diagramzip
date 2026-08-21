import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(import.meta.dirname),
  base: '/',
  plugins: [{
    name: 'diagramzip-history-fallback',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url === '/' || /^\/d\/[A-Za-z0-9_-]{16}(?:[?#].*)?$/.test(request.url ?? '')) {
          request.url = '/'
        }
        next()
      })
    },
  }],
  server: {
    proxy: {
      '/api/v1': process.env.DIAGRAMZIP_API_TARGET ?? 'http://127.0.0.1:8787',
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
})
