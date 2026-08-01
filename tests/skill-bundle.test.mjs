import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createSkillBundle,
  listBundleFiles,
  resolveSkillPaths,
  validateSkillBundle,
  writeSkillBundle,
} from '../scripts/lib/skill-bundle.mjs';
import { slugifyHeading } from '../scripts/lib/slugify-heading.mjs';

const requiredSkill = (extra = '') => [
  '---',
  'name: slm-design',
  'description: "Operational SLM skill."',
  '---',
  '',
  '# SLM Design',
  '',
  '## Универсальный цикл решения',
  '## Алгоритмы выбора',
  '### Реализация',
  '### Миграция Level 1 -> Level 2',
  '### Архитектурное ревью',
  '## Anti-patterns',
  '## Stop conditions и адресные вопросы',
  '## Когда открывать references',
  extra,
  '',
].join('\n');

const entry = (content) => ({ content: Buffer.from(content), sourcePath: 'fixture' });
const config = { name: 'slm-design', references: [], legacyMarkers: ['old-docs'] };

test('validates parsed Markdown links and ignores code examples', () => {
  const extra = [
    '[Target](<./reference/draft/a(b).md#title>)',
    '[Encoded](./reference/draft/foo%23bar.md)',
    '<https://example.com/docs>',
    '`[inline][missing]`',
    '\\[escaped][missing]',
    '',
    '```md',
    '[fenced](./missing.md)',
    '# Not a real heading',
    '```',
  ].join('\n');
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill(extra))],
    ['reference/draft/a(b).md', entry('Title\n=====\n')],
    ['reference/draft/foo#bar.md', entry('# Encoded\n')],
  ]);

  assert.doesNotThrow(() => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }));
});

test('rejects undefined reference-style links', () => {
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill('[broken][missing-reference]'))],
  ]);

  assert.throws(
    () => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }),
    /Undefined reference-style link/,
  );
});

test('rejects non-portable or unsafe links', () => {
  for (const target of [
    '/rules/',
    'file:///tmp/rules.md',
    'C:\\Users\\name\\rules.md',
    'javascript:alert(1)',
    'https%3A%2F%2Fexample.com',
  ]) {
    const bundle = new Map([
      ['SKILL.md', entry(requiredSkill(`[broken](${target})`))],
    ]);

    assert.throws(
      () => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }),
      /not portable|absolute link|absolute path|Unsupported or unsafe|Broken link/,
    );
  }
});

test('uses the same heading slugs as the documentation site', () => {
  assert.equal(slugifyHeading('Миграция Level 1 -> Level 2'), 'миграция-level-1-level-2');
  assert.equal(slugifyHeading('`app`'), 'layer-app');
});

test('requires operational sections to be real headings', () => {
  const fencedSkill = requiredSkill().replace(
    '## Универсальный цикл решения',
    '```md\n## Универсальный цикл решения\n```',
  );
  const bundle = new Map([['SKILL.md', entry(fencedSkill)]]);

  assert.throws(
    () => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }),
    /missing operational heading/,
  );
});

test('rejects traversal through the skill name', () => {
  assert.throws(
    () => resolveSkillPaths({ config: { name: '../source' }, repoRoot: '/workspace/repo' }),
    /Invalid skill name/,
  );
});

test('rejects a symbolic link used as the generated root', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slm-skill-root-'));
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slm-skill-outside-'));

  fs.mkdirSync(path.join(repoRoot, 'src-skills'));
  fs.symlinkSync(outsideRoot, path.join(repoRoot, 'skills'));

  try {
    assert.throws(
      () => resolveSkillPaths({ config: { name: 'slm-design' }, repoRoot }),
      /Symbolic links are not allowed/,
    );
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
    fs.rmSync(outsideRoot, { recursive: true, force: true });
  }
});

test('rejects symbolic links in source and generated trees', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slm-skill-source-'));
  const sourceDir = path.join(repoRoot, 'src-skills', 'slm-design');
  const outsideSource = path.join(repoRoot, 'outside.md');
  const generatedDir = path.join(repoRoot, 'generated');

  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(generatedDir);
  fs.writeFileSync(outsideSource, requiredSkill());
  fs.symlinkSync(outsideSource, path.join(sourceDir, 'SKILL.md'));
  fs.symlinkSync(outsideSource, path.join(generatedDir, 'extra.md'));

  try {
    assert.throws(
      () => createSkillBundle({ config: { name: 'slm-design', source: 'SKILL.md' }, repoRoot }),
      /Symbolic links are not allowed/,
    );
    assert.throws(() => listBundleFiles(generatedDir), /Symbolic links are not allowed/);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('atomically replaces generated output and remains deterministic', () => {
  const outputParent = fs.mkdtempSync(path.join(os.tmpdir(), 'slm-skill-output-'));
  const outputDir = path.join(outputParent, 'slm-design');
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill())],
    ['reference/draft/README.md', entry('# Draft\n')],
  ]);

  fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, 'legacy.md'), 'legacy');

  try {
    writeSkillBundle({ bundle, outputDir });
    writeSkillBundle({ bundle, outputDir });

    const files = listBundleFiles(outputDir)
      .map((filePath) => path.relative(outputDir, filePath).replaceAll(path.sep, '/'));

    assert.deepEqual(files, ['SKILL.md', 'reference/draft/README.md']);
    assert.equal(fs.readFileSync(path.join(outputDir, 'SKILL.md'), 'utf8'), requiredSkill());
  } finally {
    fs.rmSync(outputParent, { recursive: true, force: true });
  }
});

test('writer rejects a bundle key escaping its temporary directory', () => {
  const outputParent = fs.mkdtempSync(path.join(os.tmpdir(), 'slm-skill-escape-'));
  const outputDir = path.join(outputParent, 'slm-design');
  const bundle = new Map([['../escaped.txt', entry('escaped')]]);

  try {
    assert.throws(() => writeSkillBundle({ bundle, outputDir }), /Invalid bundle path/);
    assert.equal(fs.existsSync(path.join(outputParent, 'escaped.txt')), false);
  } finally {
    fs.rmSync(outputParent, { recursive: true, force: true });
  }
});
