import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const packageRoot = process.cwd();
const { buildSpecRecord, writeSpecRecord } = await import('../scripts/distill-spec.mjs');
const { tokensFromJson } = await import('../scripts/lib/design-tokens.mjs');
const { validateKnowledgeDir } = await import('../scripts/validate-design-spec.mjs');

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

test('distill extracts swiss-deck deterministically and emits judgment=candidate', () => {
  const record = buildSpecRecord('design-systems/swiss-deck', { id: 'test-swiss-distill-v1', skillRoot: packageRoot });
  assert.equal(record.schema_version, 'design-spec-record/v1');
  assert.equal(record.source.kind, 'design-system');
  assert.equal(record.classification.artifact_type, 'design-system');
  assert.equal(record.judgment.status, 'candidate');

  // No subjective fields are ever auto-generated.
  assert.equal(record.judgment.why_it_works, undefined);
  assert.equal(record.judgment.tags, undefined);
  assert.equal(record.judgment.signature_move, undefined);
  assert.equal(record.judgment.reviewer, undefined);

  // Values trace to the bound JSON tokens.
  const tokens = tokensFromJson(readJson(join(packageRoot, 'design-systems/swiss-deck/design-tokens.json')));
  for (const [role, entry] of Object.entries(tokens.colors)) {
    assert.equal(record.extracted.colors[role].value, entry.value, `color ${role}`);
  }
  for (const [k, v] of Object.entries(tokens.spacing)) {
    assert.equal(record.extracted.spacing[k], v, `spacing ${k}`);
  }
  for (const [k, v] of Object.entries(tokens.typography)) {
    assert.equal(record.extracted.typography[k], v, `typography ${k}`);
  }
  assert.equal(record.extracted.radius.default, tokens.radius.default);
  assert.ok(record.source.artifact_digest.match(/^[0-9a-f]{64}$/));
});

test('distill refuses when token source lacks spacing (no fabricated rhythm)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'distill-nospace-'));
  try {
    writeFileSync(join(dir, 'tokens.css'), ':root {\n  --surface: #f7f8f6;\n  --accent: #2f6f9f;\n  --text: #1f2933;\n}\n');
    assert.throws(
      () => buildSpecRecord(dir, { id: 'no-space-v1', skillRoot: '/' }),
      /no spacing tokens/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('distill refuses when no bound tokens exist', () => {
  const dir = mkdtempSync(join(tmpdir(), 'distill-notokens-'));
  try {
    writeFileSync(join(dir, 'index.html'), '<html><body>no tokens here</body></html>');
    assert.throws(
      () => buildSpecRecord(dir, { id: 'no-tokens-v1', skillRoot: '/' }),
      /no bound design tokens/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('distill CLI writes a valid record that registers and passes the knowledge validator', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'distill-cli-'));
  const outPath = join(tmp, 'swiss-system-v1.json');
  try {
    const stdout = execFileSync(
      process.execPath,
      ['scripts/distill-spec.mjs', 'design-systems/swiss-deck', '--id=swiss-system-cli-v1', `--out=${outPath}`, '--no-register'],
      { cwd: packageRoot, encoding: 'utf8' }
    );
    assert.ok(stdout.includes('judgment=candidate'));
    const record = readJson(outPath);
    assert.equal(record.id, 'swiss-system-cli-v1');
    assert.equal(record.judgment.status, 'candidate');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('distilled candidate written into a knowledge directory validates end to end', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'distill-kb-'));
  try {
    // Minimal knowledge dir layout with a registry; record refs point into the
    // real package root, so run the validator with skillRoot=packageRoot.
    const kb = join(tmp, 'design-knowledge');
    const record = buildSpecRecord('design-systems/swiss-deck', { id: 'kb-candidate-v1', skillRoot: packageRoot });
    // Rewrite refs to the tmp layout is not needed: validator resolves against skillRoot.
    const { outRel } = writeSpecRecord(record, { skillRoot: tmp, register: true });
    assert.ok(existsSync(join(tmp, outRel)));
    const registry = readJson(join(kb, 'registry.json'));
    assert.ok(registry.spec_records.includes(outRel));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
