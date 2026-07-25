import { fileURLToPath } from 'node:url'
import { defineLoader } from 'vitepress'
import { collectRules } from '../../scripts/lib/specification.mjs'

const specificationRoot = fileURLToPath(
  new URL('../../docs/ru/specification/', import.meta.url),
)

export default defineLoader({
  watch: '../../docs/ru/specification/**/*.md',
  async load() {
    return collectRules(specificationRoot)
  },
})
