import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(SCRIPT_DIRECTORY, '..')
const SOURCE_ROOT = join(PROJECT_ROOT, 'src')
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])
const MODULE_ROOTS = [
  'compositions/layouts/store-shell',
  'compositions/screens/cart',
  'compositions/screens/catalog',
  'compositions/screens/orders',
  'compositions/screens/product-admin',
  'compositions/screens/product-detail',
  'compositions/screens/sign-in',
  'compositions/widgets/demo-toolbar',
  'domains/auth',
  'domains/cart',
  'domains/catalog',
  'domains/demo-control',
  'domains/orders',
  'infra/browser-storage',
  'infra/simple-auth-session',
  'infra/simple-rest-api',
  'shared/lib/value-predicates',
  'ui/button',
  'ui/feedback-panel',
  'ui/form-field'
].sort((left, right) => right.length - left.length)
const MODULAR_LAYERS = new Set(['compositions', 'domains', 'infra', 'ui'])
const ALLOWED_TARGETS = {
  app: new Set(['app', 'compositions', 'domains', 'infra', 'ui', 'shared']),
  compositions: new Set(['compositions', 'domains', 'infra', 'ui', 'shared']),
  domains: new Set(['domains', 'infra', 'ui', 'shared']),
  infra: new Set(['infra', 'shared']),
  ui: new Set(['ui', 'shared']),
  shared: new Set(['shared'])
}

/**
 * Рекурсивно собирает TypeScript-файлы SLM root.
 */
const collectSourceFiles = (directory) => {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [entryPath] : []
  })
}

/**
 * Нормализует filesystem path к формату architecture manifest.
 */
const normalizePath = (filePath) => {
  return filePath.split(sep).join('/')
}

/**
 * Возвращает путь файла относительно SLM root.
 */
const getSourcePath = (filePath) => {
  return normalizePath(relative(SOURCE_ROOT, filePath))
}

/**
 * Определяет слой относительного source path.
 */
const getLayer = (sourcePath) => {
  return sourcePath.split('/')[0]
}

/**
 * Находит явно объявленного module-owner по longest-prefix rule.
 */
const getModuleId = (sourcePath) => {
  return MODULE_ROOTS.find(
    (moduleRoot) => sourcePath === moduleRoot || sourcePath.startsWith(`${moduleRoot}/`)
  ) ?? null
}

/**
 * Проверяет deep import относительно явно объявленного public entry.
 */
const isDeepModuleImport = (targetPath, sourceModuleId) => {
  const targetModuleId = getModuleId(targetPath)

  return targetModuleId !== null &&
    targetModuleId !== sourceModuleId &&
    targetPath !== targetModuleId
}

/**
 * Проверяет направление слоя независимо от синтаксиса import path.
 */
const isLayerImportAllowed = (sourcePath, targetPath) => {
  const sourceLayer = getLayer(sourcePath)
  const targetLayer = getLayer(targetPath)

  return ALLOWED_TARGETS[sourceLayer]?.has(targetLayer) === true
}

/**
 * Извлекает static, side-effect, reexport и dynamic module specifiers через TypeScript AST.
 */
const getModuleSpecifiers = (filePath, sourceCode) => {
  const scriptKind = extname(filePath) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  )
  const specifiers = []

  /**
   * Обходит один AST node и собирает строковые module references.
   */
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text)
    }

    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.push(node.moduleReference.expression.text)
    }

    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      specifiers.push(node.arguments[0].text)
    }

    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      specifiers.push(node.argument.literal.text)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return specifiers
}

/**
 * Разрешает относительный TypeScript import.
 */
const resolveRelativeImport = (sourceFile, specifier) => {
  const basePath = resolve(dirname(sourceFile), specifier)
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    join(basePath, 'index.ts'),
    join(basePath, 'index.tsx')
  ]

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

/**
 * Находит первый cycle в module graph.
 */
const findCycle = (graph) => {
  const visited = new Set()
  const active = new Set()
  const path = []

  /**
   * Обходит один module node depth-first.
   */
  const visit = (moduleId) => {
    if (active.has(moduleId)) {
      const cycleStart = path.indexOf(moduleId)

      return [...path.slice(cycleStart), moduleId]
    }

    if (visited.has(moduleId)) {
      return null
    }

    visited.add(moduleId)
    active.add(moduleId)
    path.push(moduleId)

    for (const dependency of graph.get(moduleId) ?? []) {
      const cycle = visit(dependency)

      if (cycle !== null) {
        return cycle
      }
    }

    path.pop()
    active.delete(moduleId)

    return null
  }

  for (const moduleId of graph.keys()) {
    const cycle = visit(moduleId)

    if (cycle !== null) {
      return cycle
    }
  }

  return null
}

const violations = []
const graph = new Map()
const sourceFiles = collectSourceFiles(SOURCE_ROOT)
const parserProbe = getModuleSpecifiers(
  'architecture-probe.ts',
  `
    import '@/infra/simple-rest-api'
    export { useAuth } from '@/domains/auth'
    type Auth = import('@/domains/auth').AuthContextValue
    const lazy = import('@/compositions/screens/catalog')
  `
)
const expectedProbeSpecifiers = [
  '@/infra/simple-rest-api',
  '@/domains/auth',
  '@/domains/auth',
  '@/compositions/screens/catalog'
]

expectedProbeSpecifiers.forEach((specifier) => {
  if (!parserProbe.includes(specifier)) {
    violations.push(`architecture parser fixture missed ${specifier}`)
  }
})

if (!isDeepModuleImport('shared/lib/value-predicates/value-predicates', 'domains/cart')) {
  violations.push('architecture boundary fixture did not detect shared module deep import')
}

if (isLayerImportAllowed('shared/bridge.ts', 'domains/auth/index.ts')) {
  violations.push('architecture boundary fixture allowed shared to import domains relatively')
}

MODULE_ROOTS.forEach((moduleRoot) => {
  const moduleDirectory = join(SOURCE_ROOT, moduleRoot)
  const publicEntry = join(moduleDirectory, 'index.ts')

  if (!existsSync(moduleDirectory) || !existsSync(publicEntry)) {
    violations.push(`${moduleRoot}: declared module must be a folder with index.ts public API`)
  }
})

sourceFiles.forEach((sourceFile) => {
  const sourcePath = getSourcePath(sourceFile)
  const sourceLayer = getLayer(sourcePath)
  const sourceModuleId = getModuleId(sourcePath)
  const relativeSource = relative(PROJECT_ROOT, sourceFile)
  const sourceCode = readFileSync(sourceFile, 'utf8')

  if (MODULAR_LAYERS.has(sourceLayer) && sourceModuleId === null) {
    violations.push(`${relativeSource}: implementation file has no declared module-owner`)
  }

  getModuleSpecifiers(sourceFile, sourceCode).forEach((specifier) => {
    if (specifier.startsWith('@/')) {
      const targetPath = specifier.slice(2)
      const targetLayer = getLayer(targetPath)
      const targetModuleId = getModuleId(targetPath)

      if (!isLayerImportAllowed(sourcePath, targetPath)) {
        violations.push(`${relativeSource}: ${sourceLayer} cannot import ${targetLayer} via ${specifier}`)
      }

      if (isDeepModuleImport(targetPath, sourceModuleId)) {
        violations.push(`${relativeSource}: deep import into ${targetModuleId} via ${specifier}`)
      }

      if (sourceModuleId !== null && targetModuleId !== null && sourceModuleId !== targetModuleId) {
        const dependencies = graph.get(sourceModuleId) ?? new Set()
        dependencies.add(targetModuleId)
        graph.set(sourceModuleId, dependencies)
      }

      return
    }

    if (specifier.startsWith('.')) {
      const targetFile = resolveRelativeImport(sourceFile, specifier)

      if (targetFile === null) {
        return
      }

      const targetModuleId = getModuleId(getSourcePath(targetFile))
      const targetPath = getSourcePath(targetFile)
      const targetLayer = getLayer(targetPath)

      if (!isLayerImportAllowed(sourcePath, targetPath)) {
        violations.push(
          `${relativeSource}: ${sourceLayer} cannot import ${targetLayer} via ${specifier}`
        )
      }

      if (
        sourceModuleId !== null &&
        targetModuleId !== null &&
        sourceModuleId !== targetModuleId
      ) {
        violations.push(`${relativeSource}: relative import crosses into ${targetModuleId}`)
      }
    }
  })

  const isRestModuleFile = sourceModuleId === 'infra/simple-rest-api'

  if (sourceCode.includes('/generated') && !isRestModuleFile) {
    violations.push(`${relativeSource}: generated SDK import escaped infra/simple-rest-api`)
  }
})

const cycle = findCycle(graph)

if (cycle !== null) {
  violations.push(`module dependency cycle: ${cycle.join(' -> ')}`)
}

if (violations.length > 0) {
  console.error('SLM architecture check failed:')
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exitCode = 1
} else {
  console.log(
    `SLM architecture check passed for ${sourceFiles.length} files and ${MODULE_ROOTS.length} declared modules.`
  )
}
