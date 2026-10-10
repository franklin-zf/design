import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { compileSchema, validateJsonInstance } from '../scripts/lib/json-schema.mjs';

const root = resolve('.');
const passFixture = join(root, 'examples/source-extraction-pass');
const negativeFixtures = [
  ['invalid-source-extraction-original-hash', /original.*sha256 mismatch/i],
  ['invalid-source-extraction-extracted-hash', /extracted text.*sha256 mismatch/i],
  ['invalid-source-extraction-missing-capability', /capability.*(missing|regular file)/i],
  ['invalid-source-extraction-tool-drift', /tool version.*does not match/i],
  ['invalid-source-extraction-forged-locator', /locator.*(does not match|out of range)/i],
  ['invalid-source-extraction-path-escape', /must stay inside the artifact directory/i]
];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

function runValidator(dir) {
  return spawnSync(process.execPath, [join(root, 'scripts/validate-source-extraction.mjs'), dir], {
    cwd: root,
    encoding: 'utf8'
  });
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

function copyPassFixture() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-source-extraction-'));
  const copy = join(tempRoot, 'fixture');
  cpSync(passFixture, copy, { recursive: true });
  return { tempRoot, copy };
}

test('source extraction schemas accept the canonical positive fixture', () => {
  const capabilitySchema = readJson(join(root, 'schemas/source-extraction-capability.schema.json'));
  const extractionSchema = readJson(join(root, 'schemas/source-extraction.schema.json'));
  const capability = readJson(join(passFixture, 'extraction-capability.json'));
  const extraction = readJson(join(passFixture, 'source-extraction.json'));

  assert.doesNotThrow(() => compileSchema(capabilitySchema));
  assert.doesNotThrow(() => compileSchema(extractionSchema));
  assert.deepEqual(validateJsonInstance(capabilitySchema, capability), []);
  assert.deepEqual(validateJsonInstance(extractionSchema, extraction), []);
});

test('canonical extraction binds text paragraphs and binary pages', () => {
  const result = runValidator(passFixture);
  assert.equal(result.status, 0, output(result));
  assert.match(output(result), /2 records and 4 locator mappings/i);
});

test('static integrity and provenance failures fail closed', () => {
  for (const [fixture, message] of negativeFixtures) {
    const result = runValidator(join(root, 'examples', fixture));
    assert.notEqual(result.status, 0, `${fixture} unexpectedly passed`);
    assert.match(output(result), message, fixture);
  }
});

test('capability bytes and declared identity are both immutable', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const capabilityPath = join(copy, 'extraction-capability.json');
    const capability = readJson(capabilityPath);
    capability.tool.version = '9.9.9';
    writeJson(capabilityPath, capability);

    const changedBytes = runValidator(copy);
    assert.notEqual(changedBytes.status, 0);
    assert.match(output(changedBytes), /capability sha256 mismatch/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('declared capability and tool identities cannot drift independently', () => {
  for (const [field, value, message] of [
    ['capability_id', 'different-capability/v1', /capability_id does not match/i],
    ['tool_name', 'different-tool', /tool name does not match/i],
    ['tool_version', '2.0.0', /tool version does not match/i]
  ]) {
    const { tempRoot, copy } = copyPassFixture();
    try {
      const extractionPath = join(copy, 'source-extraction.json');
      const extraction = readJson(extractionPath);
      extraction.capability[field] = value;
      writeJson(extractionPath, extraction);

      const result = runValidator(copy);
      assert.notEqual(result.status, 0);
      assert.match(output(result), message);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});

test('post-extraction source and text byte drift both fail closed', () => {
  for (const [path, message] of [
    ['sources/proposal.txt', /original sha256 mismatch/i],
    ['extracted/proposal.txt', /extracted text sha256 mismatch/i]
  ]) {
    const { tempRoot, copy } = copyPassFixture();
    try {
      writeFileSync(join(copy, path), `${readFileSync(join(copy, path), 'utf8')}mutated\n`);
      const result = runValidator(copy);
      assert.notEqual(result.status, 0);
      assert.match(output(result), message);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});

test('locator ranges must exist and bind the declared extracted bytes', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const extractionPath = join(copy, 'source-extraction.json');
    const extraction = readJson(extractionPath);
    extraction.records[0].mappings[0].source_locator.start = 99;
    extraction.records[0].mappings[0].source_locator.end = 99;
    writeJson(extractionPath, extraction);

    const result = runValidator(copy);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /locator.*out of range/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('realpath containment rejects a symlink that escapes the artifact', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const outside = join(tempRoot, 'outside.txt');
    writeFileSync(outside, 'outside artifact boundary\n');
    const escaped = join(copy, 'sources/escaped.txt');
    symlinkSync(outside, escaped);

    const extractionPath = join(copy, 'source-extraction.json');
    const extraction = readJson(extractionPath);
    extraction.records[0].original.path = 'sources/escaped.txt';
    writeJson(extractionPath, extraction);

    const result = runValidator(copy);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /must stay inside the artifact directory/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
