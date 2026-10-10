import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
const fixtureRoot = join(root, 'tests/fixtures/history/content-integrity');
const fixture = join(fixtureRoot, 'content-ledger.json');
const schemaPath = join(root, 'schemas/content-ledger.schema.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function runLedger(path) {
  return spawnSync(process.execPath, ['scripts/validate-content-ledger.mjs', path], {
    cwd: root,
    encoding: 'utf8'
  });
}

function copyFixture() {
  const dir = mkdtempSync(join('/tmp', 'design-content-ledger-'));
  cpSync(join(fixtureRoot, 'source.txt'), join(dir, 'source.txt'));
  return dir;
}

function writeLedger(dir, ledger) {
  const path = join(dir, 'content-ledger.json');
  writeFileSync(path, JSON.stringify(ledger, null, 2));
  return path;
}

test('content ledger schema compiles and the product management baseline validates', async () => {
  const { compileSchema, validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const schema = readJson(schemaPath);
  const ledger = readJson(fixture);
  assert.doesNotThrow(() => compileSchema(schema));
  assert.deepEqual(validateJsonInstance(schema, ledger), []);
  assert.equal(runLedger(fixture).status, 0);
});

test('must-keep coverage cannot silently omit a semantic unit', () => {
  const dir = copyFixture();
  const ledger = readJson(fixture);
  ledger.semantic_context.coverage.status = 'complete';
  ledger.semantic_context.coverage.represented_ids = ledger.semantic_context.coverage.represented_ids
    .filter((id) => id !== 'acceptance-criteria');
  ledger.semantic_context.coverage.explicit_omissions = [];
  ledger.semantic_context.coverage.unresolved_ids = [];
  const result = runLedger(writeLedger(dir, ledger));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must_keep unit acceptance-criteria is neither represented nor explicitly omitted/);
});

test('plan, target, question, and cause semantics fail closed when relabeled', () => {
  const dir = copyFixture();
  const ledger = readJson(fixture);
  const units = ledger.semantic_context.semantic_units;
  const projectStart = units.find((unit) => unit.id === 'project-start');
  projectStart.kind = 'plan';
  projectStart.canonical_entry_id = 'platform-position';
  const question = units.find((unit) => unit.id === 'open-boundary-question');
  question.canonical_entry_id = 'platform-position';
  ledger.semantic_context.relationships.push({
    id: 'unsupported-cause',
    type: 'causes',
    from: 'platform-position',
    to: 'information-fragmentation',
    evidence_status: 'inferred',
    source_refs: ['source.txt']
  });
  const result = runLedger(writeLedger(dir, ledger));
  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /plan must use modality=plan|question must use modality=question|question must use evidence_status=unverified|causes relationship unsupported-cause must be explicit or computed/
  );
});

test('source snapshot hash drift is rejected', () => {
  const dir = copyFixture();
  const ledger = readJson(fixture);
  ledger.semantic_context.source_snapshot.sha256 = createHash('sha256').update('wrong').digest('hex');
  const result = runLedger(writeLedger(dir, ledger));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /source snapshot hash mismatch/);
});

test('protected token drift is rejected even when the source quote remains valid', () => {
  const dir = copyFixture();
  const ledger = readJson(fixture);
  const entry = ledger.entries.find((item) => item.id === 'project-start');
  entry.protected_tokens[0].text = '2025年7月';
  const result = runLedger(writeLedger(dir, ledger));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /protected token is absent from source_quote/);
});
