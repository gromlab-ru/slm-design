import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { parse as parseYaml } from 'yaml';
import { slugifyHeading } from './slugify-heading.mjs';

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
markdown.validateLink = () => true;
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.vue',
  '.yaml',
  '.yml',
]);

const comparePaths = (left, right) => {
  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const isWithin = (filePath, parentPath) => {
  const relativePath = path.relative(parentPath, filePath);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const assertSkillName = (name) => {
  assert(typeof name === 'string', 'Skill name must be a string.');
  assert(name.length <= 64, 'Skill name must not exceed 64 characters.');
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name), `Invalid skill name: ${name}`);
};

const normalizeBundlePath = (filePath) => {
  const normalized = path.posix.normalize(filePath.replaceAll(path.sep, '/'));

  assert(
    normalized !== '' && normalized !== '.' && normalized !== '..' && !normalized.startsWith('../'),
    `Invalid bundle path: ${filePath}`,
  );
  assert(!path.posix.isAbsolute(normalized), `Bundle path must be relative: ${filePath}`);

  return normalized;
};

const assertSafeSource = (sourcePath, allowedRoot, expectedType) => {
  assert(isWithin(sourcePath, allowedRoot), `Source escapes allowed root: ${sourcePath}`);
  assert(fs.existsSync(sourcePath), `Source not found: ${sourcePath}`);

  const stats = fs.lstatSync(sourcePath);

  assert(!stats.isSymbolicLink(), `Symbolic links are not allowed in skill sources: ${sourcePath}`);
  assert(
    isWithin(fs.realpathSync(sourcePath), fs.realpathSync(allowedRoot)),
    `Source resolves outside allowed root: ${sourcePath}`,
  );

  if (expectedType === 'file') {
    assert(stats.isFile(), `Expected a regular source file: ${sourcePath}`);
  } else if (expectedType === 'directory') {
    assert(stats.isDirectory(), `Expected a source directory: ${sourcePath}`);
  }
};

const listSourceFiles = (sourcePath, allowedRoot) => {
  assertSafeSource(sourcePath, allowedRoot);

  const stats = fs.lstatSync(sourcePath);

  if (stats.isFile()) {
    return [sourcePath];
  }

  assert(stats.isDirectory(), `Unsupported reference source: ${sourcePath}`);

  return fs
    .readdirSync(sourcePath, { withFileTypes: true })
    .sort((left, right) => comparePaths(left.name, right.name))
    .flatMap((entry) => listSourceFiles(path.join(sourcePath, entry.name), allowedRoot));
};

const addBundleFile = (bundle, targetPath, sourcePath, allowedRoot) => {
  const normalizedTarget = normalizeBundlePath(targetPath);

  assert(!bundle.has(normalizedTarget), `Duplicate bundle target: ${normalizedTarget}`);
  assertSafeSource(sourcePath, allowedRoot, 'file');

  bundle.set(normalizedTarget, {
    content: fs.readFileSync(sourcePath),
    sourcePath,
  });
};

export const resolveSkillPaths = ({ config, repoRoot }) => {
  assertSkillName(config.name);

  const sourceRoot = path.resolve(repoRoot, 'src-skills');
  const outputRoot = path.resolve(repoRoot, 'skills');
  const sourceDir = path.resolve(sourceRoot, config.name);
  const outputDir = path.resolve(outputRoot, config.name);

  assert(path.dirname(sourceDir) === sourceRoot, 'Skill source must be a direct child of src-skills.');
  assert(path.dirname(outputDir) === outputRoot, 'Skill output must be a direct child of skills.');
  assert(!isWithin(sourceDir, outputDir) && !isWithin(outputDir, sourceDir), 'Skill source and output overlap.');

  assertSafeSource(sourceRoot, repoRoot, 'directory');

  if (fs.existsSync(outputRoot)) {
    assertSafeSource(outputRoot, repoRoot, 'directory');
  }

  return { outputDir, outputRoot, sourceDir, sourceRoot };
};

export const createSkillBundle = ({ config, repoRoot }) => {
  const { sourceDir, sourceRoot } = resolveSkillPaths({ config, repoRoot });
  const sourcePath = path.resolve(sourceDir, config.source);
  const bundle = new Map();

  assertSafeSource(sourceDir, sourceRoot, 'directory');
  assert(isWithin(sourcePath, sourceDir), `Skill source escapes its directory: ${config.source}`);
  addBundleFile(bundle, 'SKILL.md', sourcePath, sourceDir);

  for (const reference of config.references ?? []) {
    assert(Array.isArray(reference.include) && reference.include.length > 0, 'Reference include must be non-empty.');

    const referenceRoot = path.resolve(repoRoot, reference.source);
    const targetRoot = normalizeBundlePath(reference.target);

    assertSafeSource(referenceRoot, repoRoot, 'directory');

    for (const includePath of reference.include) {
      assert(typeof includePath === 'string' && includePath !== '', 'Reference include must be a path string.');

      const includedSource = path.resolve(referenceRoot, includePath);

      assert(isWithin(includedSource, referenceRoot), `Reference include escapes root: ${includePath}`);
      assert(fs.existsSync(includedSource), `Reference include not found: ${reference.source}/${includePath}`);

      for (const sourceFile of listSourceFiles(includedSource, referenceRoot)) {
        const relativeSource = path.relative(referenceRoot, sourceFile).replaceAll(path.sep, '/');
        addBundleFile(bundle, path.posix.join(targetRoot, relativeSource), sourceFile, referenceRoot);
      }
    }
  }

  return new Map([...bundle].sort(([left], [right]) => comparePaths(left, right)));
};

const parseFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  assert(match, 'SKILL.md must start with YAML frontmatter.');

  let frontmatter;

  try {
    frontmatter = parseYaml(match[1]);
  } catch (error) {
    throw new Error(`SKILL.md contains invalid YAML frontmatter: ${error.message}`);
  }

  assert(frontmatter && typeof frontmatter === 'object' && !Array.isArray(frontmatter), 'Invalid skill frontmatter.');

  return frontmatter;
};

const headingText = (inlineToken) => {
  return (inlineToken.children ?? [])
    .map((child) => {
      if (child.type === 'text' || child.type === 'code_inline') {
        return child.content;
      }

      if (child.type === 'image') {
        return child.content;
      }

      return '';
    })
    .join('');
};

const createHeadingAnchors = (tokens) => {
  const anchors = new Set();
  const occurrences = new Map();

  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type !== 'heading_open' || tokens[index + 1]?.type !== 'inline') {
      continue;
    }

    const text = headingText(tokens[index + 1]);
    const customAnchor = text.match(/\s*\{#([^}]+)}\s*$/)?.[1];
    const base = customAnchor ?? slugifyHeading(text.replace(/\s*\{#[^}]+}\s*$/, ''));
    const occurrence = occurrences.get(base) ?? 0;
    const anchor = occurrence === 0 ? base : `${base}-${occurrence}`;

    occurrences.set(base, occurrence + 1);
    anchors.add(anchor);
  }

  return anchors;
};

const decodeLinkPart = (value, context) => {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error(`Invalid URL encoding in ${context}: ${value}`);
  }
};

const normalizeLinkTarget = (rawTarget, sourcePath) => {
  if (rawTarget.startsWith('//')) {
    return null;
  }

  const rawScheme = rawTarget.match(/^([a-z][a-z+.-]*):/i)?.[1]?.toLowerCase();

  if (rawScheme) {
    assert(
      ['http', 'https', 'mailto', 'tel'].includes(rawScheme),
      `Unsupported or unsafe URL scheme in ${sourcePath}: ${rawTarget}`,
    );

    return null;
  }

  const hashIndex = rawTarget.indexOf('#');
  const pathAndQuery = hashIndex === -1 ? rawTarget : rawTarget.slice(0, hashIndex);
  const rawFragment = hashIndex === -1 ? '' : rawTarget.slice(hashIndex + 1);
  const queryIndex = pathAndQuery.indexOf('?');
  const rawPath = queryIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, queryIndex);
  const targetPath = decodeLinkPart(rawPath, `link path in ${sourcePath}`);
  const fragment = decodeLinkPart(rawFragment, `link fragment in ${sourcePath}`);

  assert(!/^[a-z]:[\\/]/i.test(targetPath), `Windows absolute link in ${sourcePath}: ${rawTarget}`);
  assert(!targetPath.startsWith('\\'), `Backslash link is not portable in ${sourcePath}: ${rawTarget}`);
  assert(!targetPath.startsWith('/'), `Root-relative link is not portable in ${sourcePath}: ${rawTarget}`);

  return { fragment, targetPath };
};

const resolveBundleLink = (bundle, sourcePath, targetPath) => {
  const joinedPath = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), targetPath));

  assert(
    joinedPath !== '..' && !joinedPath.startsWith('../') && !path.posix.isAbsolute(joinedPath),
    `Link escapes skill bundle in ${sourcePath}: ${targetPath}`,
  );

  if (bundle.has(joinedPath)) {
    return joinedPath;
  }

  const directoryIndex = path.posix.join(joinedPath, 'README.md');

  if (bundle.has(directoryIndex)) {
    return directoryIndex;
  }

  throw new Error(`Broken link in ${sourcePath}: ${targetPath}`);
};

const normalizeReferenceLabel = (label) => label.trim().replace(/\s+/g, ' ').toUpperCase();

const assertDefinedReferenceLinks = (tokens, references, filePath) => {
  for (const token of tokens) {
    if (token.type !== 'inline') {
      continue;
    }

    const inspectableContent = token.content.replace(/(`+)[\s\S]*?\1/g, '');

    for (const match of inspectableContent.matchAll(/(?<!\\)!?\[([^\]]+)]\[([^\]]*)]/g)) {
      const label = normalizeReferenceLabel(match[2] || match[1]);

      assert(references[label], `Undefined reference-style link in ${filePath}: ${match[0]}`);
    }
  }
};

const collectMarkdownLinks = (tokens) => {
  const links = [];

  for (const token of tokens) {
    for (const child of token.children ?? []) {
      if (child.type === 'link_open') {
        links.push(child.attrGet('href'));
      } else if (child.type === 'image') {
        links.push(child.attrGet('src'));
      }
    }
  }

  return links.filter((link) => typeof link === 'string');
};

const parseMarkdown = (content, filePath) => {
  const environment = {};
  const tokens = markdown.parse(content, environment);

  assertDefinedReferenceLinks(tokens, environment.references ?? {}, filePath);

  return { links: collectMarkdownLinks(tokens), tokens };
};

const assertMarkdownLinks = (bundle, filePath, content) => {
  const { links, tokens } = parseMarkdown(content, filePath);

  for (const rawTarget of links) {
    const target = normalizeLinkTarget(rawTarget, filePath);

    if (!target) {
      continue;
    }

    const resolvedPath = target.targetPath === ''
      ? filePath
      : resolveBundleLink(bundle, filePath, target.targetPath);

    if (target.fragment === '') {
      continue;
    }

    const targetContent = bundle.get(resolvedPath).content.toString('utf8');
    const targetTokens = markdown.parse(targetContent, {});
    const anchors = createHeadingAnchors(targetTokens);

    assert(anchors.has(target.fragment), `Broken anchor in ${filePath}: ${rawTarget}`);
  }

  createHeadingAnchors(tokens);
};

const assertPortableText = (content, filePath, repoRoot, legacyMarkers) => {
  assert(!content.includes(repoRoot), `${filePath} contains an absolute workspace path.`);
  assert(
    !/(?:^|[\s("'`])\/(?:home|Users)\/[^/\s]+\//m.test(content),
    `${filePath} contains a user-specific absolute path.`,
  );
  assert(
    !/(?:^|[\s("'`])[a-z]:\\Users\\/im.test(content),
    `${filePath} contains a Windows user-specific absolute path.`,
  );
  assert(!content.includes('<!-- include:'), `${filePath} contains an unresolved include.`);

  for (const marker of legacyMarkers) {
    assert(!content.includes(marker), `${filePath} contains legacy marker: ${marker}`);
  }
};

export const validateSkillBundle = ({ bundle, config, repoRoot }) => {
  const skillEntry = bundle.get('SKILL.md');

  assert(skillEntry, 'Skill bundle must contain SKILL.md.');

  const skillContent = skillEntry.content.toString('utf8');
  const frontmatter = parseFrontmatter(skillContent);
  const skillTokens = markdown.parse(skillContent, {});
  const headings = new Set(
    skillTokens.flatMap((token, index) => {
      return token.type === 'heading_open' && skillTokens[index + 1]?.type === 'inline'
        ? [headingText(skillTokens[index + 1])]
        : [];
    }),
  );
  const requiredHeadings = [
    'Универсальный цикл решения',
    'Алгоритмы выбора',
    'Реализация',
    'Миграция Level 1 -> Level 2',
    'Архитектурное ревью',
    'Anti-patterns',
    'Stop conditions и адресные вопросы',
    'Когда открывать references',
  ];

  assert(frontmatter.name === config.name, `SKILL.md name must be ${config.name}.`);
  assert(
    typeof frontmatter.description === 'string' && frontmatter.description.trim() !== '',
    'SKILL.md frontmatter must contain a non-empty string description.',
  );

  for (const heading of requiredHeadings) {
    assert(headings.has(heading), `SKILL.md is missing operational heading: ${heading}`);
  }

  for (const [filePath, entry] of bundle) {
    const extension = path.posix.extname(filePath).toLowerCase();

    if (!textExtensions.has(extension)) {
      continue;
    }

    const content = entry.content.toString('utf8');

    assertPortableText(content, filePath, repoRoot, config.legacyMarkers ?? []);

    if (extension === '.md') {
      assertMarkdownLinks(bundle, filePath, content);
    }
  }
};

export const listBundleFiles = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  const rootStats = fs.lstatSync(directoryPath);

  assert(!rootStats.isSymbolicLink(), `Symbolic links are not allowed in generated skill: ${directoryPath}`);
  assert(rootStats.isDirectory(), `Generated skill path must be a directory: ${directoryPath}`);

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    assert(!entry.isSymbolicLink(), `Symbolic links are not allowed in generated skill: ${entryPath}`);

    if (entry.isDirectory()) {
      files.push(...listBundleFiles(entryPath));
    } else {
      assert(entry.isFile(), `Unsupported generated skill entry: ${entryPath}`);
      files.push(entryPath);
    }
  }

  return files.sort(comparePaths);
};

export const writeSkillBundle = ({ bundle, outputDir }) => {
  const outputParent = path.dirname(outputDir);

  assertSafeSource(outputParent, outputParent, 'directory');

  if (fs.existsSync(outputDir)) {
    const outputStats = fs.lstatSync(outputDir);

    assert(!outputStats.isSymbolicLink(), `Generated skill output cannot be a symbolic link: ${outputDir}`);
    assert(outputStats.isDirectory(), `Generated skill output must be a directory: ${outputDir}`);
  }

  const temporaryDir = fs.mkdtempSync(path.join(outputParent, `.${path.basename(outputDir)}-`));
  const backupDir = path.join(outputParent, `.${path.basename(outputDir)}-backup-${process.pid}`);
  let movedExistingOutput = false;

  try {
    for (const [filePath, entry] of bundle) {
      const normalizedPath = normalizeBundlePath(filePath);
      const outputPath = path.resolve(temporaryDir, ...normalizedPath.split('/'));

      assert(normalizedPath === filePath, `Bundle key is not normalized: ${filePath}`);
      assert(isWithin(outputPath, temporaryDir), `Bundle target escapes temporary directory: ${filePath}`);

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, entry.content);
    }

    if (fs.existsSync(outputDir)) {
      assert(!fs.existsSync(backupDir), `Temporary backup already exists: ${backupDir}`);
      fs.renameSync(outputDir, backupDir);
      movedExistingOutput = true;
    }

    fs.renameSync(temporaryDir, outputDir);

    if (movedExistingOutput) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
  } catch (error) {
    const recoveryErrors = [error];

    if (movedExistingOutput && !fs.existsSync(outputDir) && fs.existsSync(backupDir)) {
      try {
        fs.renameSync(backupDir, outputDir);
      } catch (rollbackError) {
        recoveryErrors.push(rollbackError);
      }
    }

    if (fs.existsSync(temporaryDir)) {
      try {
        fs.rmSync(temporaryDir, { recursive: true, force: true });
      } catch (cleanupError) {
        recoveryErrors.push(cleanupError);
      }
    }

    if (recoveryErrors.length > 1) {
      throw new AggregateError(recoveryErrors, 'Skill build failed and recovery was incomplete.');
    }

    throw error;
  }
};
