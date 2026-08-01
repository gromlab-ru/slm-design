import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import skillConfig from '../src-skills/slm-design/skill.config.mjs';
import {
  createSkillBundle,
  resolveSkillPaths,
  validateSkillBundle,
  writeSkillBundle,
} from './lib/skill-bundle.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { outputDir, outputRoot } = resolveSkillPaths({ config: skillConfig, repoRoot });
const bundle = createSkillBundle({ config: skillConfig, repoRoot });

validateSkillBundle({ bundle, config: skillConfig, repoRoot });
fs.mkdirSync(outputRoot, { recursive: true });
writeSkillBundle({ bundle, outputDir });

console.log(`Built ${path.relative(repoRoot, outputDir)} (${bundle.size} files)`);
