import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import skillConfig from '../src-skills/slm-design/skill.config.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'src-skills', skillConfig.name);
const sourcePath = path.join(sourceDir, skillConfig.source);
const legacyDocsDir = path.join(repoRoot, 'old-docs');
const outputDir = path.join(repoRoot, 'skills', skillConfig.name);
const includePattern = /<!--\s*include:\s*(.*?)\s*-->/g;

const isWithin = (filePath, parentPath) => {
  const relativePath = path.relative(parentPath, filePath);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const removeFrontmatter = (content) => {
  return content.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
};

const shiftHeadings = (content) => {
  return content.replace(/^(#{1,6})(?=\s)/gm, (heading) => '#'.repeat(Math.min(heading.length + 1, 6)));
};

const resolveIncludes = (content, baseDir) => {
  return content.replace(includePattern, (match, includePath) => {
    const resolvedPath = path.resolve(baseDir, includePath);

    if (!isWithin(resolvedPath, repoRoot) || !fs.existsSync(resolvedPath)) {
      throw new Error(`Include file not found: ${includePath}`);
    }

    return shiftHeadings(removeFrontmatter(fs.readFileSync(resolvedPath, 'utf8')).trim());
  });
};

const rewriteLinks = (content) => {
  return skillConfig.linkRewrites.reduce((result, { from, to }) => {
    return result.split(`](${from})`).join(`](${to})`);
  }, content);
};

const createFrontmatter = () => {
  return `---\nname: ${skillConfig.name}\ndescription: ${JSON.stringify(skillConfig.description)}\n---`;
};

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Skill source not found: ${path.relative(repoRoot, sourcePath)}`);
}

if (!fs.existsSync(legacyDocsDir)) {
  throw new Error('Legacy documentation directory not found: old-docs');
}

const source = fs.readFileSync(sourcePath, 'utf8');
const content = rewriteLinks(resolveIncludes(source, path.dirname(sourcePath))).trim();
const output = [
  createFrontmatter(),
  '<!-- Generated from src-skills/slm-design/SKILL.md. Do not edit manually. -->',
  content,
].join('\n\n');

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'SKILL.md'), `${output}\n`);
fs.cpSync(legacyDocsDir, path.join(outputDir, 'reference'), { recursive: true });

console.log(path.relative(repoRoot, path.join(outputDir, 'SKILL.md')));
