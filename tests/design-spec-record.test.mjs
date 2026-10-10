import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const packageRoot = resolve('.');
const {
  validateCaseRecord,
  validateEvaluationPolicy,
  validateRecord,
  validateKnowledgeDir
} = await import('../scripts/validate-design-spec.mjs');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function seedRecord() {
  const record = readJson(join(packageRoot, 'tests/fixtures/history/design-knowledge/spec-records/swiss-deck-evidence-v1.json'));
  record.source.review_ref = `tests/fixtures/history/${record.source.review_ref}`;
  record.judgment.review_ref = `tests/fixtures/history/${record.judgment.review_ref}`;
  return record;
}

function seedCase() {
  const record = readJson(join(packageRoot, 'tests/fixtures/history/design-knowledge/cases/swiss-evidence-deck-production.json'));
  record.source.artifact_ref = `tests/fixtures/history/${record.source.artifact_ref}`;
  record.judgment.review_ref = `tests/fixtures/history/${record.judgment.review_ref}`;
  return record;
}

function runRecord(record) {
  const errors = [];
  validateRecord(record, { recordPath: 'test-record', skillRoot: packageRoot, errors });
  return errors;
}

function runCase(record) {
  const errors = [];
  validateCaseRecord(record, { recordPath: 'test-case', skillRoot: packageRoot, errors });
  return errors;
}

test('standards-only knowledge directory validates without endorsed history', () => {
  const result = validateKnowledgeDir('design-knowledge');
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.equal(result.records, 0);
  assert.equal(result.cases, 0);
});

test('seeded project case validates and binds its reviewed source materials', () => {
  assert.deepEqual(runCase(seedCase()), []);
});

test('shared evaluation policy validates before it can govern evidence', () => {
  const errors = [];
  validateEvaluationPolicy(
    readJson(join(packageRoot, 'design-knowledge/evaluation-policy.json')),
    { errors }
  );
  assert.deepEqual(errors, []);
});

test('reviewed project case without a review binding is rejected', () => {
  const record = seedCase();
  delete record.judgment.review_ref;
  const errors = runCase(record);
  assert.ok(errors.some((e) => e.includes('judgment.review_ref')), errors.join('; '));
});

test('reviewer_confirmed seed traces extracted colors to tokens and binds independent review', () => {
  const errors = runRecord(seedRecord());
  assert.deepEqual(errors, []);
});

test('extracted color not present in tokens is rejected (no fabricated values)', () => {
  const rec = seedRecord();
  rec.extracted.colors.accent.value = '#123456';
  const errors = runRecord(rec);
  assert.ok(errors.some((e) => e.includes('not present in') && e.includes('#123456')), errors.join('; '));
});

test('extracted typography that drifts from tokens is rejected', () => {
  const rec = seedRecord();
  rec.extracted.typography.display = 'Comic Sans MS, sans-serif';
  const errors = runRecord(rec);
  assert.ok(errors.some((e) => e.includes('typography.display')), errors.join('; '));
});

test('reviewer_confirmed without review binding is rejected', () => {
  const rec = seedRecord();
  delete rec.judgment.review_ref;
  delete rec.judgment.reviewer;
  const errors = runRecord(rec);
  assert.ok(errors.some((e) => e.includes('review_ref')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('named reviewer')), errors.join('; '));
});

test('candidate judgment is allowed without reviewer-confirmed rationale', () => {
  const rec = seedRecord();
  rec.judgment = { status: 'candidate' };
  const errors = runRecord(rec);
  assert.ok(!errors.some((e) => e.includes('review') || e.includes('why_it_works')), errors.join('; '));
});

test('invalid artifact type and risk lane are rejected', () => {
  const rec = seedRecord();
  rec.classification.artifact_type = 'landing-page';
  rec.classification.risk_lane = 'ultra';
  const errors = runRecord(rec);
  assert.ok(errors.some((e) => e.includes('artifact_type')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('risk_lane')), errors.join('; '));
});

test('record present but unlisted in registry is rejected', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'design-knowledge-'));
  try {
    mkdirSync(join(tmp, 'spec-records'), { recursive: true });
    writeFileSync(join(tmp, 'spec-records/x.json'), JSON.stringify(seedRecord()));
    writeFileSync(join(tmp, 'registry.json'), JSON.stringify({
      schema_version: 'design-knowledge-registry/v1',
      record_root: 'spec-records',
      spec_records: []
    }));
    // Validate against an absolute knowledge dir whose record is unlisted.
    const result = validateKnowledgeDir(tmp);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('not listed in registry')), result.errors.join('; '));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
