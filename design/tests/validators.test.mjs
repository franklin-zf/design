import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { validateJsonInstance } from '../scripts/validate-schemas.mjs';

const root = resolve('.');

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runScript(script, artifactDir) {
  return spawnSync(process.execPath, [join(root, 'scripts', script), artifactDir], {
    cwd: root,
    encoding: 'utf8'
  });
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

function copyFixture(name) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-validator-test-'));
  const fixture = join(root, 'examples', name);
  const copy = join(tempRoot, name);
  cpSync(fixture, copy, { recursive: true });
  return { tempRoot, copy };
}

test('runtime bytes match the provenance record', () => {
  const runtimePath = join(root, 'assets/vendor/open-design-html-ppt/runtime.js');
  const provenance = readJson(join(root, 'assets/vendor/open-design-html-ppt/PROVENANCE.json'));
  const declared = provenance.files.find((file) => file.destination === 'runtime.js');

  assert.equal(hashFile(runtimePath), declared.sha256);
});

test('installed runtime bytes match when DESIGN_INSTALLED_SKILL is provided', {
  skip: !process.env.DESIGN_INSTALLED_SKILL
}, () => {
  const runtimePath = join(root, 'assets/vendor/open-design-html-ppt/runtime.js');
  const installedPath = join(
    resolve(process.env.DESIGN_INSTALLED_SKILL),
    'assets/vendor/open-design-html-ppt/runtime.js'
  );
  const provenance = readJson(join(root, 'assets/vendor/open-design-html-ppt/PROVENANCE.json'));
  const declared = provenance.files.find((file) => file.destination === 'runtime.js');

  assert.equal(hashFile(installedPath), declared.sha256);
  assert.deepEqual(readFileSync(runtimePath), readFileSync(installedPath));
});

test('schema instance validation rejects a conditional contract violation', () => {
  const schema = readJson(join(root, 'schemas/claim-map.schema.json'));
  const valid = readJson(join(root, 'examples/chart-frame-pass/claim-map.json'));
  const invalid = readJson(join(root, 'examples/invalid-claim-missing-evidence-quote/claim-map.json'));

  assert.deepEqual(validateJsonInstance(schema, valid), []);
  assert.match(validateJsonInstance(schema, invalid).join('\n'), /required|evidence_quotes/);
});

test('runtime validator rejects a manifest missing canonical template and validation fields', () => {
  for (const field of ['template_id', 'template_selection', 'validation']) {
    const { tempRoot, copy } = copyFixture('chart-frame-pass');
    try {
      const manifestPath = join(copy, 'manifest.json');
      const manifest = readJson(manifestPath);
      delete manifest[field];
      writeJson(manifestPath, manifest);
      const failed = runScript('validate-design-output.mjs', copy);
      assert.notEqual(failed.status, 0);
      assert.match(output(failed), new RegExp(`missing field: ${field}|${field} is required`));
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});

test('legacy provenance execution flag is disabled and cannot bypass the policy runner', () => {
  const { tempRoot, copy } = copyFixture('swiss-evidence-deck-production-pass');
  try {
    const codePath = join(copy, 'calculations/inventory.mjs');
    writeFileSync(codePath, "import { rmSync } from 'node:fs';\nrmSync('derived/inventory.json');\n");
    const provenancePath = join(copy, 'data-provenance.json');
    const provenance = readJson(provenancePath);
    provenance.derivations[0].code_sha256 = hashFile(codePath);
    writeJson(provenancePath, provenance);

    const result = spawnSync(
      process.execPath,
      [join(root, 'scripts/validate-data-provenance.mjs'), copy, '--execute-trusted'],
      { cwd: root, encoding: 'utf8' }
    );
    assert.notEqual(result.status, 0);
    assert.match(output(result), /--execute-trusted is disabled.*run-execution-plan/i);
    assert.equal(readJson(join(copy, 'data-provenance.json')).derivations[0].code_sha256, hashFile(codePath));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('claim and summary maps validate declared source SHA-256 values', () => {
  for (const [fixtureName, mapName, validator] of [
    ['chart-frame-pass', 'claim-map.json', 'validate-claim-map.mjs'],
    ['chart-frame-pass', 'summary-map.json', 'validate-summary-map.mjs']
  ]) {
    const { tempRoot, copy } = copyFixture(fixtureName);
    try {
      const mapPath = join(copy, mapName);
      const map = readJson(mapPath);
      const refs = [...new Set(map[mapName === 'claim-map.json' ? 'claims' : 'summaries']
        .flatMap((item) => item.source_refs))];
      map.source_sha256 = Object.fromEntries(refs.map((ref) => [
        ref,
        hashFile(ref.startsWith('examples/') ? join(root, ref) : join(copy, ref))
      ]));
      writeJson(mapPath, map);

      assert.equal(runScript(validator, copy).status, 0);
      map.source_sha256[refs[0]] = '0'.repeat(64);
      writeJson(mapPath, map);
      const failed = runScript(validator, copy);
      assert.notEqual(failed.status, 0);
      assert.match(output(failed), /source_sha256.*hash mismatch/);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});
