import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      app: fileURLToPath(new URL('./src/app', import.meta.url)),
      compositions: fileURLToPath(new URL('./src/compositions', import.meta.url)),
      domains: fileURLToPath(new URL('./src/domains', import.meta.url)),
      infra: fileURLToPath(new URL('./src/infra', import.meta.url)),
      shared: fileURLToPath(new URL('./src/shared', import.meta.url)),
      ui: fileURLToPath(new URL('./src/ui', import.meta.url))
    }
  },
  test: {
    css: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
