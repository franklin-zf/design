import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const validatorPath = resolve('scripts/validate-code-style.mjs');

function createProject() {
  const projectRoot = mkdtempSync(join(tmpdir(), 'design-code-style-test-'));
  const packageJson = {
    scripts: {
      'validate:code-style': 'node scripts/validate-code-style.mjs .',
      validate: 'npm run validate:code-style'
    }
  };
  writeFileSync(
    join(projectRoot, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
  return projectRoot;
}

function runValidator(projectRoot) {
  return spawnSync(process.execPath, [validatorPath, projectRoot], {
    cwd: projectRoot,
    encoding: 'utf8'
  });
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

test('code style ignores root exp-skill evidence', () => {
  const projectRoot = createProject();
  try {
    mkdirSync(join(projectRoot, '.exp-skill', 'runs', 'completed'), { recursive: true });
    mkdirSync(join(projectRoot, 'src'));
    writeFileSync(
      join(projectRoot, '.exp-skill', 'runs', 'completed', 'evidence.md'),
      'historical evidence with trailing whitespace  \n'
    );
    writeFileSync(join(projectRoot, 'src', 'index.mjs'), 'export const value = 1;\n');

    const result = runValidator(projectRoot);
    assert.equal(result.status, 0, output(result));
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('code style still rejects product source violations', () => {
  const projectRoot = createProject();
  try {
    mkdirSync(join(projectRoot, '.exp-skill', 'runs'), { recursive: true });
    mkdirSync(join(projectRoot, 'src'));
    writeFileSync(
      join(projectRoot, '.exp-skill', 'runs', 'evidence.md'),
      'historical evidence with trailing whitespace  \n'
    );
    writeFileSync(join(projectRoot, 'src', 'invalid.mjs'), 'export const value = 1;  \n');

    const result = runValidator(projectRoot);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /src\/invalid\.mjs: line 1 has trailing whitespace/);
    assert.doesNotMatch(output(result), /\.exp-skill/);
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test('code style does not ignore nested product directories by name', () => {
  const projectRoot = createProject();
  try {
    mkdirSync(join(projectRoot, 'src', '.exp-skill'), { recursive: true });
    writeFileSync(
      join(projectRoot, 'src', '.exp-skill', 'invalid.mjs'),
      'export const value = 1;  \n'
    );

    const result = runValidator(projectRoot);
    assert.notEqual(result.status, 0);
    assert.match(
      output(result),
      /src\/\.exp-skill\/invalid\.mjs: line 1 has trailing whitespace/
    );
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});
