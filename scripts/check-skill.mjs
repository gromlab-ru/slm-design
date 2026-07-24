import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import skillConfig from '../src-skills/slm-design/skill.config.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = path.join(repoRoot, 'skills', skillConfig.name);
const skillPath = path.join(skillDir, 'SKILL.md');
const referenceFiles = [
  'README.md',
  'canons/business-factory.md',
  'canons/business-runtime-boundary.md',
  'canons/decision-process.md',
  'canons/file-atlas.md',
  'canons/index.md',
  'canons/layers.md',
  'canons/modules.md',
  'canons/monorepo.md',
  'canons/segments.md',
  'canons/validation.md',
  'examples/business-composition.md',
  'examples/business-testing.md',
  'examples/react/composition-provider.md',
  'examples/react/composition-structures.md',
];

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const listMarkdownFiles = (directoryPath) => {
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return listMarkdownFiles(entryPath);
    }

    return entry.isFile() && path.extname(entry.name) === '.md' ? [entryPath] : [];
  });
};

const assertLocalLinksExist = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const links = [...content.matchAll(/]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)];

  for (const [, rawTarget] of links) {
    if (rawTarget.startsWith('#') || /^[a-z][a-z+.-]*:/i.test(rawTarget) || rawTarget.startsWith('//')) {
      continue;
    }

    const [targetPath] = rawTarget.split('#');
    const resolvedPath = path.resolve(path.dirname(filePath), targetPath);

    assert(fs.existsSync(resolvedPath), `Broken link in ${path.relative(repoRoot, filePath)}: ${rawTarget}`);
  }
};

assert(fs.existsSync(skillPath), 'Run npm run build before checking the skill.');

const skillContent = fs.readFileSync(skillPath, 'utf8');

assert(skillContent.startsWith(`---\nname: ${skillConfig.name}\n`), 'SKILL.md must contain the skill name in frontmatter.');
assert(skillContent.includes('description: '), 'SKILL.md must contain a description in frontmatter.');
assert(!skillContent.includes('<!-- include:'), 'SKILL.md contains an unresolved include.');
assert(!skillContent.includes('/home/gromov/'), 'SKILL.md must not contain an absolute workspace path.');
assert(!skillContent.includes('reference/slm-design'), 'SKILL.md contains an old documentation path.');
assert(skillContent.includes('## Процесс архитектурного решения'), 'SKILL.md does not include the decision process.');
assert(skillContent.includes('## Runtime-граница business'), 'SKILL.md does not include the business runtime boundary.');
assert(skillContent.includes('## Архитектурная проверка'), 'SKILL.md does not include the validation rules.');
assert(
  skillContent.includes('./reference/canons/business-factory.md'),
  'The business factory link must point to local reference documentation.',
);

for (const referenceFile of referenceFiles) {
  assert(
    fs.existsSync(path.join(skillDir, 'reference', referenceFile)),
    `Missing copied reference file: ${referenceFile}`,
  );
}

for (const filePath of listMarkdownFiles(skillDir)) {
  const content = fs.readFileSync(filePath, 'utf8');

  assert(
    !content.includes('/home/gromov/'),
    `${path.relative(repoRoot, filePath)} contains an absolute workspace path.`,
  );
  assert(
    !content.includes('reference/slm-design'),
    `${path.relative(repoRoot, filePath)} contains an old documentation path.`,
  );
  assertLocalLinksExist(filePath);
}

console.log(`Validated ${path.relative(repoRoot, skillPath)}`);
