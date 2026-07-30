import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
const distRoot = path.join(repositoryRoot, 'site', '.vitepress', 'dist')
const siteOrigin = 'https://site.test'
const siteBase = '/slm-design/'
const ruleRegistries = [
  { source: path.join(repositoryRoot, 'DRAFT', 'rules', 'level-1.md'), route: 'rules/level-1' },
  { source: path.join(repositoryRoot, 'DRAFT', 'rules', 'level-2.md'), route: 'rules/level-2' },
]

const expectedPages = [
  '404.html',
  'index.html',
  'level-1/index.html',
  'level-1/terminology.html',
  'level-1/layers.html',
  'level-1/domains.html',
  'level-1/dependencies.html',
  'level-1/modules.html',
  'level-1/groups.html',
  'level-1/segments.html',
  'level-1/components.html',
  'level-1/nested-modules.html',
  'level-1/lifecycle.html',
  'level-1/validation.html',
  'level-2/index.html',
  'level-2/terminology.html',
  'level-2/dependencies.html',
  'level-2/validation.html',
  'level-2/domains/index.html',
  'level-2/domains/domain-package.html',
  'level-2/domains/business.html',
  'level-2/domains/factory-ports-adapters.html',
  'level-2/domains/assemblies.html',
  'level-2/domains/state-cache.html',
  'level-2/domains/framework-bindings.html',
  'level-2/domains/testing.html',
  'level-2/domains/auth-example.html',
  'level-2/domains/open-questions.html',
  'rules/index.html',
  'rules/level-1.html',
  'rules/level-2.html',
].sort()

async function collectHtmlFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name)
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(absolutePath, relativePath))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(relativePath)
    }
  }

  return files
}

function pageUrl(relativePath) {
  if (relativePath === 'index.html') return `${siteOrigin}${siteBase}`
  if (relativePath.endsWith('/index.html')) {
    return `${siteOrigin}${siteBase}${relativePath.slice(0, -'index.html'.length)}`
  }
  return `${siteOrigin}${siteBase}${relativePath.slice(0, -'.html'.length)}`
}

function htmlPathForUrl(url) {
  const route = decodeURIComponent(url.pathname.slice(siteBase.length))
  if (!route) return 'index.html'
  if (route.endsWith('/')) return `${route}index.html`
  return `${route}.html`
}

const actualPages = (await collectHtmlFiles(distRoot)).sort()
if (JSON.stringify(actualPages) !== JSON.stringify(expectedPages)) {
  throw new Error(
    `Published page set differs from allowlist.\nExpected: ${expectedPages.join(', ')}\nActual: ${actualPages.join(', ')}`,
  )
}

const htmlByPage = new Map()
for (const relativePath of actualPages) {
  htmlByPage.set(relativePath, await readFile(path.join(distRoot, relativePath), 'utf8'))
}

for (const [relativePath, html] of htmlByPage) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`${relativePath} contains duplicate ids: ${[...new Set(duplicateIds)].join(', ')}`)
  }

  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const target = new URL(match[1], pageUrl(relativePath))
    if (target.origin !== siteOrigin) continue
    if (!target.pathname.startsWith(siteBase)) {
      throw new Error(`${relativePath} links outside the configured base: ${match[1]}`)
    }

    const targetPath = htmlPathForUrl(target)
    const targetHtml = htmlByPage.get(targetPath)
    if (!targetHtml) {
      throw new Error(`${relativePath} contains broken link ${match[1]}`)
    }

    if (target.hash) {
      const anchor = decodeURIComponent(target.hash.slice(1))
      if (!targetHtml.includes(`id="${anchor}"`)) {
        throw new Error(`${relativePath} links to missing anchor ${match[1]}`)
      }
    }
  }
}

const searchChunksDirectory = path.join(distRoot, 'assets', 'chunks')
const searchChunks = (await readdir(searchChunksDirectory))
  .filter((file) => file.startsWith('@localSearchIndex') && file.endsWith('.js'))

if (searchChunks.length !== 1) {
  throw new Error(`Expected one local search index, found ${searchChunks.length}`)
}

const searchModuleUrl = `${pathToFileURL(path.join(searchChunksDirectory, searchChunks[0])).href}?t=${Date.now()}`
const searchData = JSON.parse((await import(searchModuleUrl)).default)
const searchUrls = new Set(Object.values(searchData.documentIds))
let ruleCount = 0

for (const registry of ruleRegistries) {
  const rulesMarkdown = await readFile(registry.source, 'utf8')
  const ruleIds = [...rulesMarkdown.matchAll(/^### (SLM-L\d+-[A-Z_]+-[AR]\d{3})$/gm)]
    .map((match) => match[1])
  const rulesHtml = htmlByPage.get(`${registry.route}.html`)

  for (const ruleId of ruleIds) {
    const anchor = ruleId.toLowerCase()
    const expectedUrl = `${siteBase}${registry.route}#${anchor}`

    if (!rulesHtml.includes(`id="${anchor}"`)) {
      throw new Error(`Published registry does not contain anchor ${anchor}`)
    }

    if (!searchUrls.has(expectedUrl)) {
      throw new Error(`Local search index does not contain canonical record ${expectedUrl}`)
    }
  }

  ruleCount += ruleIds.length
}

const notFoundHtml = htmlByPage.get('404.html')
if (!notFoundHtml.includes('Страница не найдена')) {
  throw new Error('404 page is not localized')
}

const sitemap = await readFile(path.join(distRoot, 'sitemap.xml'), 'utf8')
for (const forbiddenRoute of ['/ru/', '/specification/']) {
  if (sitemap.includes(forbiddenRoute)) {
    throw new Error(`Sitemap contains archival or excluded route ${forbiddenRoute}`)
  }
}

console.log(`Site check passed: ${actualPages.length - 1} pages and ${ruleCount} searchable rules.`)
