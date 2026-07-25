import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import MiniSearch from 'minisearch'
import { collectRules, RULE_SEARCH_OPTIONS } from './lib/specification.mjs'

const repoRoot = fileURLToPath(new URL('../', import.meta.url))
const specificationRoot = path.join(repoRoot, 'docs', 'ru', 'specification')
const distRoot = path.join(repoRoot, 'site', '.vitepress', 'dist')
const chunksDirectory = path.join(distRoot, 'assets', 'chunks')
const rules = await collectRules(specificationRoot)
const chunkNames = (await readdir(chunksDirectory))
  .filter((file) => file.startsWith('@localSearchIndexru.') && file.endsWith('.js'))

if (chunkNames.length !== 1) {
  throw new Error(`Expected one Russian search index chunk, found ${chunkNames.length}`)
}

const searchData = (
  await import(`${pathToFileURL(path.join(chunksDirectory, chunkNames[0])).href}?t=${Date.now()}`)
).default
const searchIndex = MiniSearch.loadJSON(searchData, {
  fields: ['title', 'titles', 'text'],
  storeFields: ['title', 'titles'],
})
const catalogHtml = await readFile(
  path.join(distRoot, 'ru', 'specification', 'rules.html'),
  'utf8',
)
const htmlCache = new Map()

function pageHtmlPath(pageHref) {
  const route = pageHref.replace(/^\/ru\/specification\/?/, '')
  return route.endsWith('/') || route === ''
    ? path.join(distRoot, 'ru', 'specification', route, 'index.html')
    : path.join(distRoot, 'ru', 'specification', `${route}.html`)
}

for (const rule of rules) {
  const expectedId = `/slm-design${rule.href}`
  const firstResult = searchIndex.search(rule.id, RULE_SEARCH_OPTIONS)[0]

  if (firstResult?.id !== expectedId) {
    throw new Error(
      `Search for ${rule.id} returned ${firstResult?.id || 'nothing'} instead of ${expectedId}`,
    )
  }

  if (!firstResult.title.startsWith(rule.id)) {
    throw new Error(`Search title for ${rule.id} does not start with the exact rule ID`)
  }

  if (firstResult.titles?.[0] !== 'Спецификация') {
    throw new Error(`Search breadcrumb for ${rule.id} does not identify Specification`)
  }

  const htmlPath = pageHtmlPath(rule.pageHref)
  let html = htmlCache.get(htmlPath)
  if (!html) {
    html = await readFile(htmlPath, 'utf8')
    htmlCache.set(htmlPath, html)
  }

  if (!html.includes(`id="${rule.anchor}"`)) {
    throw new Error(`Missing HTML anchor for ${rule.id} in ${rule.relativePath}`)
  }

  if (!html.includes(`class="slm-rule__permalink" href="#${rule.anchor}"`)) {
    throw new Error(`Missing permalink for ${rule.id} in ${rule.relativePath}`)
  }

  if (!catalogHtml.includes(`>${rule.id}</a>`)) {
    throw new Error(`Rule catalog does not contain ${rule.id}`)
  }
}

const representativePage = await readFile(
  path.join(distRoot, 'ru', 'specification', 'foundations.html'),
  'utf8',
)

if (!representativePage.includes('class="doc-set-header"')) {
  throw new Error('Specification sidebar does not contain the document-set header')
}

console.log(
  `Documentation search check passed: ${rules.length} exact rule queries, anchors, permalinks, and catalog entries.`,
)
