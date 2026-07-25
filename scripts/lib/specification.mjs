import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

export const RULE_ID_PATTERN_SOURCE = 'SLM-(?:BASE|ADV|PRO)-[A-Z][A-Z0-9]*-\\d{3}'
export const RULE_LEVEL_PATTERN_SOURCE = 'ОБЯЗАН|ЗАПРЕЩЕНО|СЛЕДУЕТ|МОЖЕТ'
export const RULE_SEARCH_OPTIONS = {
  fuzzy: false,
  prefix: true,
  combineWith: 'AND',
  boost: { title: 50, text: 2, titles: 1 },
}

const ruleIdPattern = /^SLM-(BASE|ADV|PRO)-([A-Z][A-Z0-9]*)-(\d{3})$/
const declarationPattern = new RegExp(
  `^\\*\\*(${RULE_ID_PATTERN_SOURCE}) - (${RULE_LEVEL_PATTERN_SOURCE})\\.\\*\\*\\s+(.+?)\\s*$`,
)
const rulesetOrder = { BASE: 0, ADV: 1, PRO: 2 }

export async function collectMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectMarkdownFiles(entryPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath)
    }
  }

  return files
}

export function parseRuleId(id) {
  const match = id.match(ruleIdPattern)
  if (!match) return null

  return {
    ruleset: match[1],
    area: match[2],
    number: Number(match[3]),
  }
}

export function parseRuleDeclaration(line) {
  const match = line.match(declarationPattern)
  if (!match) return null

  const parsedId = parseRuleId(match[1])
  if (!parsedId) return null

  return {
    id: match[1],
    ...parsedId,
    level: match[2],
    markdown: match[3],
    text: stripInlineMarkdown(match[3]),
  }
}

export function stripInlineMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\\([\\`*{}\[\]()#+.!_-])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function specificationPathToHref(relativePath, basePath = '/ru/specification/') {
  let route = relativePath.split(path.sep).join('/')

  if (route === 'index.md') route = ''
  else route = route.replace(/(?:^|\/)index\.md$/, '/').replace(/\.md$/, '')

  return `${basePath}${route}`
}

export async function collectRules(specificationRoot, basePath = '/ru/specification/') {
  const files = await collectMarkdownFiles(specificationRoot)
  const rules = []

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    const relativePath = path.relative(specificationRoot, file).split(path.sep).join('/')
    const headings = []

    for (const [lineIndex, line] of content.split('\n').entries()) {
      const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/)
      if (heading) {
        const level = heading[1].length
        headings.length = level
        headings[level - 1] = stripInlineMarkdown(heading[2])
        continue
      }

      const rule = parseRuleDeclaration(line)
      if (!rule) continue

      const pageTitle = headings[0] || relativePath
      const sectionTitles = headings.slice(1).filter(Boolean)
      const pageHref = specificationPathToHref(relativePath, basePath)

      rules.push({
        ...rule,
        anchor: rule.id.toLowerCase(),
        href: `${pageHref}#${rule.id.toLowerCase()}`,
        line: lineIndex + 1,
        pageHref,
        pageTitle,
        relativePath,
        sectionTitle: sectionTitles.at(-1) || pageTitle,
        sectionTitles,
      })
    }
  }

  return rules.sort((left, right) => (
    rulesetOrder[left.ruleset] - rulesetOrder[right.ruleset]
    || left.area.localeCompare(right.area)
    || left.number - right.number
    || left.id.localeCompare(right.id)
  ))
}
