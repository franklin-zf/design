import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { validatePackedReferences } from '../scripts/validate-packed-references.mjs';

const root = resolve('.');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function isLocalReference(path) {
  return !/^[a-z][a-z0-9+.-]*:\/\//i.test(path);
}

function referencedPaths() {
  const paths = new Set([
    'package.json',
    'assets/templates/registry.json',
    'assets/components/registry.json'
  ]);
  const templates = readJson(join(root, 'assets/templates/registry.json')).templates;
  for (const template of templates) {
    if (template.thinking_ref) paths.add(template.thinking_ref);
    if (template.template_path) paths.add(template.template_path);
    for (const path of template.showcase_refs || []) paths.add(path);
  }
  const components = readJson(join(root, 'assets/components/registry.json')).components;
  for (const component of components) {
    if (component.license?.evidence_ref && isLocalReference(component.license.evidence_ref)) {
      paths.add(component.license.evidence_ref);
    }
    for (const path of component.evidence_refs || []) {
      if (isLocalReference(path)) paths.add(path);
    }
    for (const path of component.implementation?.materialized_files || []) paths.add(path);
  }
  return [...paths];
}

function copyReferenceFixture() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-packed-refs-test-'));
  for (const path of referencedPaths()) {
    const destination = join(tempRoot, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(root, path), destination);
  }
  return tempRoot;
}

test('all registered runtime references are included in package files', () => {
  const result = validatePackedReferences(root);
  assert.deepEqual(result.errors, []);
  assert.ok(result.referenceCount > 0);
});

test('package validation fails when showcases are excluded or missing', () => {
  const tempRoot = copyReferenceFixture();
  try {
    const packagePath = join(tempRoot, 'package.json');
    const packageJson = readJson(packagePath);
    packageJson.files = packageJson.files.filter((path) => path !== 'showcases');
    writeJson(packagePath, packageJson);
    assert.match(
      validatePackedReferences(tempRoot).errors.join('\n'),
      /showcase_ref is excluded from package files/
    );

    packageJson.files.push('showcases');
    writeJson(packagePath, packageJson);
    unlinkSync(join(tempRoot, 'showcases/swiss-evidence-deck-production/case.json'));
    assert.match(
      validatePackedReferences(tempRoot).errors.join('\n'),
      /showcase_ref is missing/
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
