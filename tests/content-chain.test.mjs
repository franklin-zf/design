import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { compileSchema, validateJsonInstance } from '../scripts/lib/json-schema.mjs';

const root = resolve('.');
const passFixture = join(root, 'examples/content-chain-pass');
const negativeFixtures = [
  'invalid-content-plan-to-verified-actual',
  'invalid-content-requirement-to-gate',
  'invalid-content-question-to-precondition',
  'invalid-content-historical-to-current',
  'invalid-content-target-to-actual'
];

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

function runValidator(dir) {
  return spawnSync(process.execPath, [join(root, 'scripts/validate-content-chain.mjs'), dir], {
    cwd: root,
    encoding: 'utf8'
  });
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

function copyPassFixture() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-content-chain-'));
  const copy = join(tempRoot, 'fixture');
  cpSync(passFixture, copy, { recursive: true });
  return { tempRoot, copy };
}

function syncLedgerDigest(dir) {
  const ledgerPath = join(dir, 'content-ledger.json');
  const claimsPath = join(dir, 'surface-claims.json');
  const claims = readJson(claimsPath);
  claims.ledger_sha256 = sha256(readFileSync(ledgerPath));
  writeJson(claimsPath, claims);
}

test('content schemas accept the canonical positive fixture', () => {
  const ledgerSchema = readJson(join(root, 'schemas/content-ledger.schema.json'));
  const claimsSchema = readJson(join(root, 'schemas/surface-claims.schema.json'));
  const ledger = readJson(join(passFixture, 'content-ledger.json'));
  const claims = readJson(join(passFixture, 'surface-claims.json'));

  assert.doesNotThrow(() => compileSchema(ledgerSchema));
  assert.doesNotThrow(() => compileSchema(claimsSchema));
  assert.deepEqual(validateJsonInstance(ledgerSchema, ledger), []);
  assert.deepEqual(validateJsonInstance(claimsSchema, claims), []);
});

test('canonical content chain passes lexical and declared-signature validation', () => {
  const result = runValidator(passFixture);
  assert.equal(result.status, 0, output(result));
  assert.match(output(result), /natural-language semantics require human review/i);
});

test('five semantic signature transitions fail closed', () => {
  for (const fixture of negativeFixtures) {
    const result = runValidator(join(root, 'examples', fixture));
    assert.notEqual(result.status, 0, `${fixture} unexpectedly passed`);
    assert.match(output(result), /semantic_signature must exactly equal referenced ledger entry/i);
  }
});

test('artifact-local semantic transition authorization is rejected', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const claimsPath = join(copy, 'surface-claims.json');
    const claims = readJson(claimsPath);
    const claim = claims.claims.find((item) => item.id === 'plan');
    const before = structuredClone(claim.semantic_signature);
    claim.semantic_signature = {
      modality: 'actual',
      temporal_status: 'current',
      evidence_status: 'verified'
    };
    claim.authorized_transition = {
      authorization_type: 'user_confirmation',
      authorization_ref: 'host-event-2026-08-22-001',
      from_signature: before,
      to_signature: structuredClone(claim.semantic_signature),
      rationale: 'The host recorded explicit confirmation against new evidence.'
    };
    writeJson(claimsPath, claims);

    const failed = runValidator(copy);
    assert.notEqual(failed.status, 0);
    assert.match(output(failed), /authorized_transition|additional propert/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('source quotes must exist in their declared local source', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const ledgerPath = join(copy, 'content-ledger.json');
    const ledger = readJson(ledgerPath);
    ledger.entries[0].source_quote = 'This quote is not in the source.';
    writeJson(ledgerPath, ledger);
    syncLedgerDigest(copy);

    const result = runValidator(copy);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /source_quote.*not found/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('content entries bind to declared extraction paths, locators, and mapped spans', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const extractionPath = join(copy, 'source-extraction.json');
    const extraction = readJson(extractionPath);
    const ledgerPath = join(copy, 'content-ledger.json');
    const ledger = readJson(ledgerPath);
    assert.equal(runValidator(copy).status, 0, output(runValidator(copy)));

    extraction.records[0].mappings = [extraction.records[0].mappings[0]];
    writeJson(extractionPath, extraction);
    const outsideMapping = runValidator(copy);
    assert.notEqual(outsideMapping.status, 0);
    assert.match(output(outsideMapping), /source_locator is not covered.*containing source_quote/i);

    writeJson(extractionPath, readJson(join(passFixture, 'source-extraction.json')));
    ledger.entries[0].source_ref = 'source.txt';
    writeJson(ledgerPath, ledger);
    syncLedgerDigest(copy);
    const originalPath = runValidator(copy);
    assert.equal(originalPath.status, 0, output(originalPath));
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('line and out-of-range paragraph locators fail closed', () => {
  for (const locator of [
    { kind: 'line', start: 999, end: 999 },
    { kind: 'paragraph', start: 999, end: 999 }
  ]) {
    const { tempRoot, copy } = copyPassFixture();
    try {
      const ledgerPath = join(copy, 'content-ledger.json');
      const ledger = readJson(ledgerPath);
      ledger.entries[0].source_locator = locator;
      writeJson(ledgerPath, ledger);
      syncLedgerDigest(copy);

      const result = runValidator(copy);
      assert.notEqual(result.status, 0, `${locator.kind} 999 unexpectedly passed`);
      assert.match(output(result), /source_locator|enum/i);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
});

test('derived evidence must reference code-backed derivations', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const ledgerPath = join(copy, 'content-ledger.json');
    const ledger = readJson(ledgerPath);
    ledger.entries[0].semantic_signature.evidence_status = 'derived_verified';
    writeJson(ledgerPath, ledger);
    syncLedgerDigest(copy);

    const result = runValidator(copy);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /derivation_refs/);

    ledger.entries[0].derivation_refs = ['missing-derivation'];
    writeJson(ledgerPath, ledger);
    syncLedgerDigest(copy);
    const missingProvenance = runValidator(copy);
    assert.notEqual(missingProvenance.status, 0);
    assert.match(output(missingProvenance), /data_provenance_ref.*derived_verified/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('surface claims bind the exact canonical ledger bytes', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const ledgerPath = join(copy, 'content-ledger.json');
    const ledger = readJson(ledgerPath);
    ledger.ledger_id = 'mutated-ledger';
    writeJson(ledgerPath, ledger);

    const result = runValidator(copy);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /ledger_sha256 mismatch/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('visible data-claim-id mapping is exact and bidirectional', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const htmlPath = join(copy, 'index.html');
    writeFileSync(htmlPath, readFileSync(htmlPath, 'utf8').replace(
      '</main>',
      '<p data-claim-id="orphan">未映射内容</p></main>'
    ));
    const orphan = runValidator(copy);
    assert.notEqual(orphan.status, 0);
    assert.match(output(orphan), /visible data-claim-id orphan has no surface claim/i);

    writeFileSync(htmlPath, readFileSync(join(passFixture, 'index.html'), 'utf8').replace(
      /<p data-claim-id="target">[\s\S]*?<\/p>/,
      ''
    ));
    const missing = runValidator(copy);
    assert.notEqual(missing.status, 0);
    assert.match(output(missing), /surface claim target has no visible data-claim-id/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('displayed_text must exactly equal normalized visible text', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const claimsPath = join(copy, 'surface-claims.json');
    const claims = readJson(claimsPath);
    claims.claims[0].displayed_text = '计划已经完成。';
    writeJson(claimsPath, claims);

    const result = runValidator(copy);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /displayed_text must exactly match visible text/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('every protected token from selected content remains lexically intact', () => {
  const { tempRoot, copy } = copyPassFixture();
  try {
    const htmlPath = join(copy, 'index.html');
    const claimsPath = join(copy, 'surface-claims.json');
    const html = readFileSync(htmlPath, 'utf8').replace('约17人月', '17人月');
    const claims = readJson(claimsPath);
    claims.claims[0].displayed_text = claims.claims[0].displayed_text.replace('约17人月', '17人月');
    writeFileSync(htmlPath, html);
    writeJson(claimsPath, claims);

    const result = runValidator(copy);
    assert.notEqual(result.status, 0);
    assert.match(output(result), /protected token.*约17人月.*missing/i);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
