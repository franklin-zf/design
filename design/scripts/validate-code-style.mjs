#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  readdirSync
} from 'node:fs';
import {
  extname,
  join,
  relative
} from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.argv[2] || '.';
const checkedExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.md', '.yaml', '.yml']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'vendor']);
const errors = [];

function toPosix(path) {
  return path.split('\\').join('/');
}

function listFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...listFiles(join(directory, entry.name)));
      }
      continue;
    }
    if (entry.isFile()) {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

function addError(file, message) {
  errors.push(`${toPosix(relative(root, file))}: ${message}`);
}

function validateTextFile(file) {
  const ext = extname(file);
  if (!checkedExtensions.has(ext)) return;

  const text = readFileSync(file, 'utf8');
  if (text.includes('\r\n')) addError(file, 'use LF line endings');
  if (text && !text.endsWith('\n')) addError(file, 'missing trailing newline');

  const lines = text.split('\n');
  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (/[ \t]+$/.test(line)) addError(file, `line ${lineNumber} has trailing whitespace`);
    if (line.includes('\t')) addError(file, `line ${lineNumber} uses a tab`);

    if (['.js', '.mjs', '.cjs'].includes(ext)) {
      const indent = line.match(/^ */)?.[0].length ?? 0;
      if (indent % 2 !== 0) addError(file, `line ${lineNumber} indentation is not a multiple of 2 spaces`);
      if (/\bvar\s+/.test(line)) addError(file, `line ${lineNumber} uses var`);
    }
  }

  if (['.js', '.mjs', '.cjs'].includes(ext)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      const output = result.stderr.trim() || result.stdout.trim();
      addError(file, `syntax check failed: ${output}`);
    }
  }
}

function validatePackageJson() {
  const packagePath = join(root, 'package.json');
  if (!existsSync(packagePath)) {
    errors.push('package.json: missing package file');
    return;
  }

  try {
    const raw = readFileSync(packagePath, 'utf8');
    const parsed = JSON.parse(raw);
    const formatted = `${JSON.stringify(parsed, null, 2)}\n`;
    if (raw !== formatted) errors.push('package.json: must be formatted with JSON.stringify(data, null, 2)');
    if (!parsed.scripts?.['validate:code-style']) {
      errors.push('package.json: missing scripts.validate:code-style');
    }
    if (!parsed.scripts?.validate?.startsWith('npm run validate:code-style')) {
      errors.push('package.json: scripts.validate must run validate:code-style first');
    }
  } catch (error) {
    errors.push(`package.json: invalid JSON: ${error.message}`);
  }
}

for (const file of listFiles(root)) {
  validateTextFile(file);
}
validatePackageJson();

if (errors.length) {
  console.error('Code style validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Code style validation passed.');
