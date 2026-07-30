import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = dirname(fileURLToPath(import.meta.url))
const draftDirectory = join(rootDirectory, 'DRAFT')
const rulesDirectory = join(draftDirectory, 'rules')
const ruleCodeSource = 'SLM-L\\d+-[A-Z][A-Z_]{1,31}-[AR]\\d{3}'
const ruleHeadingPattern = new RegExp(`^###\\s+(?<code>SLM-L(?<level>\\d+)-(?<group>[A-Z][A-Z_]{1,31})-(?<classification>[AR])(?<number>\\d{3}))$`)
const ruleCodePattern = new RegExp(`\\b${ruleCodeSource}\\b`, 'g')
const ruleReferencePattern = new RegExp(
  '\\[`(?<code>' + ruleCodeSource + ')`\\]\\((?<target>[^)\\s]+)\\)',
  'g',
)
const ruleTitlePattern = /^>\s+\*\*(?<title>\S(?:.*\S)?)\*\*\s*$/
const ruleDescriptionPattern = /^>\s+(?<description>\S(?:.*\S)?)\s*$/
const quoteSeparatorPattern = /^>\s*$/

const getMarkdownFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(path)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path)
    }
  }

  return files
}

const visitMarkdownLines = (lines, visitor) => {
  let fence = null

  for (const [index, line] of lines.entries()) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)

    if (fenceMatch) {
      const marker = fenceMatch[1]

      if (fence === null) {
        fence = marker
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null
      }

      continue
    }

    if (fence !== null) {
      continue
    }

    visitor(line, index)
  }
}

const parseRules = async (file) => {
  const content = await readFile(file, 'utf8')
  const lines = content.split(/\r?\n/)
  const rules = []

  visitMarkdownLines(lines, (line, index) => {
    const match = line.match(ruleHeadingPattern)

    if (match?.groups) {
      const source = `${relative(rootDirectory, file)}:${index + 1}`
      const titleMatch = lines[index + 2]?.match(ruleTitlePattern)
      const descriptionMatch = lines[index + 4]?.match(ruleDescriptionPattern)

      if (lines[index + 1]?.trim() !== '') {
        throw new Error(`SLM rule ${match.groups.code} must be followed by a blank line at ${source}`)
      }

      if (!titleMatch?.groups) {
        throw new Error(`SLM rule ${match.groups.code} must have a one-line bold title in blockquote at ${source}`)
      }

      if (!quoteSeparatorPattern.test(lines[index + 3] ?? '')) {
        throw new Error(`SLM rule ${match.groups.code} must separate title and description with a quoted blank line at ${source}`)
      }

      if (!descriptionMatch?.groups || /^>/.test(lines[index + 5] ?? '')) {
        throw new Error(`SLM rule ${match.groups.code} must have a one-line blockquote description at ${source}`)
      }

      rules.push({
        code: match.groups.code,
        classification: match.groups.classification,
        description: descriptionMatch.groups.description.trim(),
        file,
        level: Number(match.groups.level),
        number: Number(match.groups.number),
        title: titleMatch.groups.title.trim(),
        source,
      })
    } else if (/^#{1,6}\s+SLM-L/.test(line)) {
      throw new Error(`Invalid SLM rule heading at ${relative(rootDirectory, file)}:${index + 1}`)
    }
  })

  return rules
}

const parseReferences = async (file) => {
  const content = await readFile(file, 'utf8')
  const lines = content.split(/\r?\n/)
  const references = []

  visitMarkdownLines(lines, (line, index) => {
    const source = `${relative(rootDirectory, file)}:${index + 1}`

    if (/^#{1,6}\s+SLM-L/.test(line)) {
      throw new Error(`SLM rule declaration is only allowed in DRAFT/rules: ${source}`)
    }

    const codeMatches = [...line.matchAll(ruleCodePattern)]
    const linkMatches = [...line.matchAll(ruleReferencePattern)]

    for (const codeMatch of codeMatches) {
      const linkMatch = linkMatches.find((candidate) => (
        candidate.groups?.code === codeMatch[0]
        && codeMatch.index >= candidate.index
        && codeMatch.index < candidate.index + candidate[0].length
      ))

      if (!linkMatch?.groups) {
        throw new Error(`SLM rule reference must be a Markdown link at ${source}: ${codeMatch[0]}`)
      }
    }

    for (const linkMatch of linkMatches) {
      const { code, target } = linkMatch.groups
      const hashIndex = target.lastIndexOf('#')

      if (hashIndex < 1 || target.slice(hashIndex + 1) !== code.toLowerCase()) {
        throw new Error(`Invalid anchor for SLM rule ${code} at ${source}`)
      }

      references.push({
        code,
        file,
        source,
        targetFile: resolve(dirname(file), target.slice(0, hashIndex)),
      })
    }
  })

  return references
}

const printSection = (title, rules) => {
  console.log(`${title} (${rules.length})`)

  for (const [index, rule] of rules.entries()) {
    console.log(`${rule.code}: ${rule.title}`)
    console.log(`  ${rule.description}`)

    if (index < rules.length - 1) {
      console.log()
    }
  }
}

const ruleFiles = await getMarkdownFiles(rulesDirectory)
const draftFiles = (await getMarkdownFiles(draftDirectory))
  .filter((file) => !ruleFiles.includes(file))
const rules = (await Promise.all(ruleFiles.map(parseRules))).flat()
const rulesByCode = new Map()
const rulesByLevelNumber = new Map()

for (const rule of rules) {
  const duplicate = rulesByCode.get(rule.code)

  if (duplicate) {
    throw new Error(`Duplicate SLM rule ${rule.code}: ${duplicate.source}, ${rule.source}`)
  }

  rulesByCode.set(rule.code, rule)

  const levelNumber = `${rule.level}:${rule.number}`
  const duplicateNumber = rulesByLevelNumber.get(levelNumber)

  if (duplicateNumber) {
    throw new Error(
      `Duplicate SLM rule number L${rule.level}-${String(rule.number).padStart(3, '0')}: ${duplicateNumber.source}, ${rule.source}`,
    )
  }

  rulesByLevelNumber.set(levelNumber, rule)
}

const references = (await Promise.all(draftFiles.map(parseReferences))).flat()
const referencedCodes = new Set()

for (const reference of references) {
  const rule = rulesByCode.get(reference.code)

  if (!rule) {
    throw new Error(`Unknown SLM rule ${reference.code} at ${reference.source}`)
  }

  if (reference.targetFile !== rule.file) {
    throw new Error(`SLM rule ${reference.code} points to a non-canonical file at ${reference.source}`)
  }

  referencedCodes.add(reference.code)
}

for (const rule of rules) {
  if (!referencedCodes.has(rule.code)) {
    throw new Error(`SLM rule ${rule.code} is not referenced by any draft`)
  }
}

rules.sort((left, right) => (
  left.level - right.level
  || left.number - right.number
  || left.code.localeCompare(right.code)
))

const automaticRules = rules.filter((rule) => rule.classification === 'A')
const reviewRules = rules.filter((rule) => rule.classification === 'R')

printSection('АВТОМАТИЧЕСКИЕ', automaticRules)
console.log()
printSection('ДЛЯ РЕВЬЮ', reviewRules)
