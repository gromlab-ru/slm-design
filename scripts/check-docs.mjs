import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  collectMarkdownFiles,
  collectRules,
  RULE_ID_PATTERN_SOURCE,
  RULE_LEVEL_PATTERN_SOURCE,
} from './lib/specification.mjs'

const specificationRoot = fileURLToPath(
  new URL('../docs/ru/specification/', import.meta.url),
)

const declarationPattern = new RegExp(
  `^\\*\\*(${RULE_ID_PATTERN_SOURCE}) - (${RULE_LEVEL_PATTERN_SOURCE})\\.\\*\\*`,
  'gm',
)
const declarationLinePattern = new RegExp(
  `^\\*\\*(${RULE_ID_PATTERN_SOURCE}) - (${RULE_LEVEL_PATTERN_SOURCE})\\.\\*\\*`,
)
const referencePattern = new RegExp(`\\b${RULE_ID_PATTERN_SOURCE}\\b`, 'g')
const legacyBaseReferencePattern = /\bSLM-(?!BASE-|ADV-|PRO-)[A-Z][A-Z0-9]*-\d{3}\b/g

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length
}

const files = await collectMarkdownFiles(specificationRoot)
const registry = await collectRules(specificationRoot)
const declarations = new Map()
const references = []
const errors = []
const ruleCounts = { BASE: 0, ADV: 0, PRO: 0 }

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const relativePath = path.relative(specificationRoot, file).split(path.sep).join('/')
  const lines = content.split('\n')

  for (const [index, line] of lines.entries()) {
    if (line.startsWith('**SLM-') && !declarationLinePattern.test(line)) {
      errors.push(`${relativePath}:${index + 1}: malformed rule declaration`)
    }
  }

  for (const match of content.matchAll(declarationPattern)) {
    const id = match[1]
    const location = `${relativePath}:${lineNumberAt(content, match.index)}`
    const existingLocation = declarations.get(id)

    if (existingLocation) {
      errors.push(`${location}: duplicate ${id}; first declared at ${existingLocation}`)
    } else {
      declarations.set(id, location)
      ruleCounts[id.split('-')[1]] += 1
    }

    if (id.startsWith('SLM-BASE-') && relativePath.startsWith('modes/')) {
      errors.push(`${location}: base rule ${id} cannot be declared in an overlay`)
    } else if (id.startsWith('SLM-ADV-') && !relativePath.startsWith('modes/advanced/')) {
      errors.push(`${location}: ${id} must be declared under modes/advanced`)
    } else if (id.startsWith('SLM-PRO-') && !relativePath.startsWith('modes/pro/')) {
      errors.push(`${location}: ${id} must be declared under modes/pro`)
    }
  }

  for (const match of content.matchAll(referencePattern)) {
    references.push({
      id: match[0],
      location: `${relativePath}:${lineNumberAt(content, match.index)}`,
    })
  }

  for (const match of content.matchAll(legacyBaseReferencePattern)) {
    errors.push(
      `${relativePath}:${lineNumberAt(content, match.index)}: legacy base rule ID ${match[0]}`,
    )
  }

  if (relativePath.startsWith('modes/advanced/') && /\bSLM-PRO-[A-Z-]+-\d{3}\b/.test(content)) {
    errors.push(`${relativePath}: Advanced overlay references a Pro rule`)
  }

  if (relativePath.startsWith('modes/pro/') && /\bSLM-ADV-[A-Z-]+-\d{3}\b/.test(content)) {
    errors.push(`${relativePath}: Pro overlay references an Advanced rule`)
  }
}

for (const reference of references) {
  if (!declarations.has(reference.id)) {
    errors.push(`${reference.location}: unknown rule reference ${reference.id}`)
  }
}

if (registry.length !== declarations.size) {
  errors.push(
    `rule registry contains ${registry.length} records, but validator found ${declarations.size} declarations`,
  )
}

for (const rule of registry) {
  if (!declarations.has(rule.id)) {
    errors.push(`${rule.relativePath}:${rule.line}: registry contains undeclared rule ${rule.id}`)
  }
}

if (errors.length > 0) {
  console.error(`Documentation check failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(
    `Documentation check passed: ${files.length} files, ${declarations.size} rules `
      + `(${ruleCounts.BASE} base, ${ruleCounts.ADV} advanced, ${ruleCounts.PRO} pro), `
      + `${references.length} rule occurrences.`,
  )
}
