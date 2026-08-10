import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createSkillBundle,
  listBundleFiles,
  resolveSkillPaths,
  validateSkillBundle,
  writeSkillBundle,
} from '../scripts/lib/skill-bundle.mjs';
import { slugifyHeading } from '../scripts/lib/slugify-heading.mjs';
import skillConfig from '../src-skills/slm-design/skill.config.mjs';

const requiredSkill = (extra = '') => [
  '---',
  'name: slm-design',
  'description: "Operational SLM skill."',
  '---',
  '',
  '# SLM Design',
  '',
  ...skillConfig.requiredHeadings.map((heading) => `## ${heading}`),
  '[Reference](./reference/docs/README.md)',
  extra,
  '',
].join('\n');

const entry = (content) => ({ content: Buffer.from(content), sourcePath: 'fixture' });
const config = {
  ...skillConfig,
  references: [],
};
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('validates parsed Markdown links and ignores code examples', () => {
  const extra = [
    '[Target](<./reference/docs/a(b).md#title>)',
    '[Encoded](./reference/docs/foo%23bar.md)',
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
    ['reference/docs/README.md', entry('# Documentation\n')],
    ['reference/docs/a(b).md', entry('Title\n=====\n')],
    ['reference/docs/foo#bar.md', entry('# Encoded\n')],
  ]);

  assert.doesNotThrow(() => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }));
});

test('rejects undefined reference-style links', () => {
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill('[broken][missing-reference]'))],
    ['reference/docs/README.md', entry('# Documentation\n')],
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
      ['reference/docs/README.md', entry('# Documentation\n')],
    ]);

    assert.throws(
      () => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }),
      /not portable|absolute link|absolute path|Unsupported or unsafe|Broken link/,
    );
  }
});

test('uses the same heading slugs as the documentation site', () => {
  assert.equal(slugifyHeading('Архитектурное ревью'), 'архитектурное-ревью');
  assert.equal(slugifyHeading('`app`'), 'layer-app');
});

test('requires operational sections to be real headings', () => {
  const fencedSkill = requiredSkill().replace(
    '## Рабочий режим',
    '```md\n## Рабочий режим\n```',
  );
  const bundle = new Map([
    ['SKILL.md', entry(fencedSkill)],
    ['reference/docs/README.md', entry('# Documentation\n')],
  ]);

  assert.throws(
    () => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }),
    /missing operational heading/,
  );
});

test('requires a non-empty unique operational heading list', () => {
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill())],
    ['reference/docs/README.md', entry('# Documentation\n')],
  ]);

  for (const requiredHeadings of [undefined, [], ['Рабочий режим', 'Рабочий режим']]) {
    assert.throws(
      () => validateSkillBundle({
        bundle,
        config: { ...config, requiredHeadings },
        repoRoot: '/workspace/repo',
      }),
      /requiredHeadings/,
    );
  }
});

test('rejects an incomplete reference map', () => {
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill('[Mapped](./reference/docs/mapped.md)'))],
    ['reference/docs/README.md', entry('# Documentation\n')],
    ['reference/docs/mapped.md', entry('# Mapped\n')],
    ['reference/docs/missing.md', entry('# Missing\n')],
  ]);
  const mapConfig = {
    ...config,
    referenceMap: {
      heading: 'Карта файлов',
      target: 'reference/docs',
    },
  };

  assert.throws(
    () => validateSkillBundle({ bundle, config: mapConfig, repoRoot: '/workspace/repo' }),
    /reference map is incomplete.*reference\/docs\/missing\.md/,
  );
});

test('requires reference map configuration', () => {
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill())],
    ['reference/docs/README.md', entry('# Documentation\n')],
  ]);

  assert.throws(
    () => validateSkillBundle({
      bundle,
      config: { ...config, referenceMap: undefined },
      repoRoot: '/workspace/repo',
    }),
    /referenceMap must be an object/,
  );
});

test('rejects configured legacy reference markers', () => {
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill('[Legacy](https://example.com/DRAFT/rules.md)'))],
    ['reference/docs/README.md', entry('# Documentation\n')],
  ]);

  assert.throws(
    () => validateSkillBundle({ bundle, config, repoRoot: '/workspace/repo' }),
    /legacy marker: DRAFT\//,
  );
});

test('validates the production skill and complete reference map', () => {
  const bundle = createSkillBundle({ config: skillConfig, repoRoot });

  assert.doesNotThrow(() => validateSkillBundle({ bundle, config: skillConfig, repoRoot }));
  assert(bundle.has('reference/docs/rules/registry.md'));
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

test('recursively bundles an entire reference root deterministically', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slm-skill-recursive-'));
  const sourceDir = path.join(fixtureRoot, 'src-skills', 'slm-design');
  const docsDir = path.join(fixtureRoot, 'docs');
  const architectureDir = path.join(docsDir, 'architecture');
  const recursiveConfig = {
    name: 'slm-design',
    source: 'SKILL.md',
    references: [
      {
        source: 'docs',
        target: 'reference/docs',
        include: ['.'],
      },
    ],
  };

  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(architectureDir, { recursive: true });
  fs.writeFileSync(path.join(sourceDir, 'SKILL.md'), requiredSkill());
  fs.writeFileSync(path.join(docsDir, 'README.md'), '# Documentation\n');
  fs.writeFileSync(path.join(architectureDir, 'modules.md'), '# Modules\n');

  try {
    const firstBundle = createSkillBundle({ config: recursiveConfig, repoRoot: fixtureRoot });
    const secondBundle = createSkillBundle({ config: recursiveConfig, repoRoot: fixtureRoot });
    const expectedPaths = [
      'SKILL.md',
      'reference/docs/README.md',
      'reference/docs/architecture/modules.md',
    ];

    assert.deepEqual([...firstBundle.keys()], expectedPaths);
    assert.deepEqual([...secondBundle.keys()], expectedPaths);
    assert.deepEqual(
      [...firstBundle.values()].map((item) => item.content.toString('utf8')),
      [...secondBundle.values()].map((item) => item.content.toString('utf8')),
    );
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('atomically replaces generated output and remains deterministic', () => {
  const outputParent = fs.mkdtempSync(path.join(os.tmpdir(), 'slm-skill-output-'));
  const outputDir = path.join(outputParent, 'slm-design');
  const bundle = new Map([
    ['SKILL.md', entry(requiredSkill())],
    ['reference/docs/README.md', entry('# Documentation\n')],
  ]);

  fs.mkdirSync(outputDir);
  fs.writeFileSync(path.join(outputDir, 'legacy.md'), 'legacy');

  try {
    writeSkillBundle({ bundle, outputDir });
    writeSkillBundle({ bundle, outputDir });

    const files = listBundleFiles(outputDir)
      .map((filePath) => path.relative(outputDir, filePath).replaceAll(path.sep, '/'));

    assert.deepEqual(files, ['SKILL.md', 'reference/docs/README.md']);
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
