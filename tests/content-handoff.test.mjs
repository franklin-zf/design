import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
const fixtureRoot = join(root, 'examples/content-handoff-pass');
const fixture = join(fixtureRoot, 'content-handoff.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function copyFixture() {
  const dir = mkdtempSync(join('/tmp', 'design-content-handoff-'));
  for (const file of ['content-ledger.json', 'source.txt', 'content-handoff.json']) {
    cpSync(join(fixtureRoot, file), join(dir, file));
  }
  return dir;
}

function runHandoff(path) {
  return spawnSync(process.execPath, ['scripts/validate-content-handoff.mjs', path], {
    cwd: root,
    encoding: 'utf8'
  });
}

function writeHandoff(dir, handoff) {
  const path = join(dir, 'content-handoff.json');
  writeFileSync(path, JSON.stringify(handoff, null, 2));
  return path;
}

test('content handoff binds the poster narrative to the canonical ledger', async () => {
  const { compileSchema, validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const schema = readJson(join(root, 'schemas/content-handoff.schema.json'));
  const handoff = readJson(fixture);
  assert.doesNotThrow(() => compileSchema(schema));
  assert.deepEqual(validateJsonInstance(schema, handoff), []);
  assert.equal(runHandoff(fixture).status, 0);
});

test('content handoff rejects a changed ledger digest', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  handoff.ledger_sha256 = '0'.repeat(64);
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ledger_sha256 mismatch/);
});

test('content handoff rejects a must-keep unit with a dropped protected number', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  const performance = handoff.content_units.find((unit) => unit.id === 'performance');
  performance.protected_token_refs = performance.protected_token_refs.filter((ref) => !ref.endsWith('#response-time'));
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing protected token ref performance-criteria#response-time/);
});

test('content handoff keeps unresolved questions visibly unresolved', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  handoff.content_units.find((unit) => unit.id === 'boundary-question').content_mode = 'plain_summary';
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must use content_mode=open_question/);
});

test('content handoff rejects a newly introduced number in a plain summary', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  handoff.content_units.find((unit) => unit.id === 'position').display_text += ' 覆盖3个部门。';
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /introduces numeric token not present in source_quote: 3/);
});

test('content handoff rejects a manifest artifact type mismatch', () => {
  const dir = copyFixture();
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ artifact_type: 'ppt-handoff' }));
  const handoff = readJson(join(dir, 'content-handoff.json'));
  handoff.artifact_type = 'poster';
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /artifact_type must match manifest/);
});

test('content handoff rejects production commentary in display text', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  handoff.content_units.find((unit) => unit.id === 'position').display_text += ' 依据保留文本快照整理。';
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /contains production commentary/);
});

test('content handoff rejects production commentary in the primary message', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  handoff.one_sentence_message += ' 原文未单独展开。';
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /one_sentence_message contains production commentary/);
});

test('production copy checks do not scan internal review metadata', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  handoff.review.method += ' 依据保留文本快照整理。';
  assert.equal(runHandoff(writeHandoff(dir, handoff)).status, 0);
});

test('a quote label cannot exempt commentary that is absent from the source', () => {
  const dir = copyFixture();
  const handoff = readJson(fixture);
  const unit = handoff.content_units.find((item) => item.id === 'position');
  unit.content_mode = 'source_verbatim';
  unit.display_text += ' 依据保留文本快照整理。';
  const result = runHandoff(writeHandoff(dir, handoff));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /contains production commentary/);
});
