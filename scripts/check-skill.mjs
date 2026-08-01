import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import skillConfig from '../src-skills/slm-design/skill.config.mjs';
import {
  createSkillBundle,
  listBundleFiles,
  resolveSkillPaths,
  validateSkillBundle,
} from './lib/skill-bundle.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { outputDir } = resolveSkillPaths({ config: skillConfig, repoRoot });
const bundle = createSkillBundle({ config: skillConfig, repoRoot });

validateSkillBundle({ bundle, config: skillConfig, repoRoot });

if (!fs.existsSync(outputDir)) {
  throw new Error('Generated skill is missing. Run npm run build:skill.');
}

const actualFiles = listBundleFiles(outputDir);
const actualPaths = actualFiles
  .map((filePath) => path.relative(outputDir, filePath).replaceAll(path.sep, '/'))
  .sort();
const expectedPaths = [...bundle.keys()];

if (actualPaths.join('\n') !== expectedPaths.join('\n')) {
  const missing = expectedPaths.filter((filePath) => !actualPaths.includes(filePath));
  const unexpected = actualPaths.filter((filePath) => !bundle.has(filePath));
  const details = [
    missing.length > 0 ? `Missing: ${missing.join(', ')}` : '',
    unexpected.length > 0 ? `Unexpected: ${unexpected.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  throw new Error(`Generated skill file list is stale. Run npm run build:skill.\n${details}`);
}

for (const filePath of expectedPaths) {
  const expected = bundle.get(filePath).content;
  const actual = fs.readFileSync(path.join(outputDir, ...filePath.split('/')));

  if (!actual.equals(expected)) {
    throw new Error(`Generated skill file is stale: ${filePath}. Run npm run build:skill.`);
  }
}

console.log(`Validated ${path.relative(repoRoot, outputDir)} (${bundle.size} files)`);
