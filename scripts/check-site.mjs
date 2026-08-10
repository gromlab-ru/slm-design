import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
const distRoot = path.join(repositoryRoot, 'site', '.vitepress', 'dist')
const siteOrigin = 'https://site.test'
const siteBase = '/slm-design/'
const ruleRegistries = [
  { source: path.join(repositoryRoot, 'docs', 'rules', 'registry.md'), route: 'rules/registry' },
]

const expectedPages = [
  '404.html',
  'index.html',
  'architecture/dependencies.html',
  'architecture/domains.html',
  'architecture/groups.html',
  'architecture/index.html',
  'architecture/layers.html',
  'architecture/modules.html',
  'architecture/segments.html',
  'reference/terminology.html',
  'reference/validation.html',
  'rules/index.html',
  'rules/registry.html',
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
  const ruleIds = [...rulesMarkdown.matchAll(/^### (SLM-[A-Z_]+-[AR]\d{3})$/gm)]
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
if (!notFoundHtml.includes('Такой страницы нет')) {
  throw new Error('404 page is not localized')
}

const homeHtml = htmlByPage.get('index.html')
if (!homeHtml.includes('Архитектура фронтенд-приложений')) {
  throw new Error('Home page does not render the documentation-owned hero')
}

if ([...homeHtml.matchAll(/<h1\b/g)].length !== 1) {
  throw new Error('Home page must have exactly one primary heading')
}

for (const [relativePath, html] of htmlByPage) {
  for (const obsoleteText of [
    'Последовательная архитектура',
    'Рабочий черновик архитектуры',
    'edit/master/DRAFT/',
  ]) {
    if (html.includes(obsoleteText)) {
      throw new Error(`${relativePath} contains obsolete copy: ${obsoleteText}`)
    }
  }
}

const sitemap = await readFile(path.join(distRoot, 'sitemap.xml'), 'utf8')
for (const forbiddenRoute of [
  '/ru/',
  '/specification/',
  '/architecture/components',
  '/architecture/nested-modules',
  '/architecture/lifecycle',
  '/architecture/validation',
]) {
  if (sitemap.includes(forbiddenRoute)) {
    throw new Error(`Sitemap contains archival or excluded route ${forbiddenRoute}`)
  }
}

console.log(`Site check passed: ${actualPages.length - 1} pages and ${ruleCount} searchable rules.`)
