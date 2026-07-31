#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(process.argv[2] || '.');
const fixture = join(root, 'examples/swiss-evidence-deck-production-pass');
const provenanceValidator = join(root, 'scripts/validate-data-provenance.mjs');
const outputValidator = join(root, 'scripts/validate-design-output.mjs');
const summaryValidator = join(root, 'scripts/validate-summary-map.mjs');
const claimValidator = join(root, 'scripts/validate-claim-map.mjs');
const tempRoot = mkdtempSync(join(tmpdir(), 'design-provenance-negative-'));
const failures = [];

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runCase(name, expected, mutate, validator = provenanceValidator, execute = false) {
  const caseDir = join(tempRoot, name);
  cpSync(fixture, caseDir, { recursive: true });
  mutate(caseDir);
  const args = [validator, caseDir];
  if (execute) args.push('--execute-trusted');
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0 || !output.includes(expected)) {
    failures.push(`${name}: expected non-zero output containing "${expected}", got status ${result.status}: ${output.trim()}`);
  }
}

try {
  runCase('source-hash', 'hash mismatch', (dir) => {
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.sources[0].sha256 = '0'.repeat(64);
    writeJson(path, data);
  });

  runCase('output-hash', 'output_sha256 hash mismatch', (dir) => {
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.derivations[0].output_sha256 = '0'.repeat(64);
    writeJson(path, data);
  });

  runCase('path-traversal', 'normalized POSIX-style relative path', (dir) => {
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.sources[0].path = '../outside.md';
    writeJson(path, data);
  });

  runCase('symlink', 'must not be a symbolic link', (dir) => {
    symlinkSync('decision-brief.md', join(dir, 'source/decision-link.md'));
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.sources[0].path = 'source/decision-link.md';
    writeJson(path, data);
  });

  runCase('source-alias', 'aliases raw source', (dir) => {
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.derivations[0].output_ref = 'source/layout-inventory.csv';
    data.derivations[0].output_sha256 = data.sources[1].sha256;
    writeJson(path, data);
  });

  runCase('source-overwrite', '--execute-trusted is disabled', (dir) => {
    const codePath = join(dir, 'calculations/inventory.mjs');
    const code = readFileSync(codePath, 'utf8');
    const modified = code.replace(
      "import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';",
      "import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';"
    );
    writeFileSync(codePath, `${modified}\nappendFileSync(inputPath, '\\n');\n`);
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.derivations[0].code_sha256 = hashFile(codePath);
    writeJson(path, data);
  }, provenanceValidator, true);

  runCase('calculation-failure', '--execute-trusted is disabled', (dir) => {
    const codePath = join(dir, 'calculations/inventory.mjs');
    writeFileSync(codePath, 'process.exit(7);\n');
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.derivations[0].code_sha256 = hashFile(codePath);
    writeJson(path, data);
  }, provenanceValidator, true);

  runCase('test-failure', '--execute-trusted is disabled', (dir) => {
    const testPath = join(dir, 'calculations/inventory.test.mjs');
    writeFileSync(testPath, "import assert from 'node:assert/strict';\nassert.fail('forced test failure');\n");
    const path = join(dir, 'data-provenance.json');
    const data = readJson(path);
    data.derivations[0].tests[0].test_sha256 = hashFile(testPath);
    writeJson(path, data);
  }, provenanceValidator, true);

  runCase('unknown-metric-ref', 'unknown derivation_ref', (dir) => {
    const path = join(dir, 'manifest.json');
    const data = readJson(path);
    data.metrics[0].derivation_ref = 'missing-derivation';
    writeJson(path, data);
  }, outputValidator);

  runCase('missing-summary-ref', 'code_derived values require derivation_refs', (dir) => {
    const path = join(dir, 'summary-map.json');
    const data = readJson(path);
    delete data.summaries[4].derivation_refs;
    writeJson(path, data);
  }, summaryValidator);

  runCase('wrong-summary-pointer', 'JSON Pointer does not resolve', (dir) => {
    const path = join(dir, 'summary-map.json');
    const data = readJson(path);
    data.summaries[4].derived_values[0].json_pointer = '/missing_value';
    writeJson(path, data);
  }, summaryValidator);

  runCase('wrong-claim-pointer', 'JSON Pointer does not resolve', (dir) => {
    const path = join(dir, 'claim-map.json');
    const data = readJson(path);
    data.claims[1].derived_values[0].json_pointer = '/missing_value';
    writeJson(path, data);
  }, claimValidator);

  runCase('wrong-metric-pointer', 'value_pointer does not resolve', (dir) => {
    const path = join(dir, 'manifest.json');
    const data = readJson(path);
    data.metrics[0].value_pointer = '/missing_value';
    writeJson(path, data);
  }, outputValidator);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

if (failures.length) {
  console.error('Data provenance negative tests failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Data provenance negative tests passed.');
