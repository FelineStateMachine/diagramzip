import { resolve } from 'node:path'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const migrations = await readD1Migrations(resolve(import.meta.dirname, 'migrations'))

export default defineConfig({
  plugins: [cloudflareTest({
    miniflare: {
      bindings: { TEST_MIGRATIONS: migrations },
    },
    wrangler: { configPath: resolve(import.meta.dirname, 'wrangler.jsonc') },
  })],
})
