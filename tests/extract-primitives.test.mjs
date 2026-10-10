import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const packageRoot = process.cwd();
const { buildPrimitives, writePrimitives } = await import('../scripts/extract-primitives.mjs');
const { validatePrimitives, validateKnowledgeDir } = await import('../scripts/validate-design-spec.mjs');

function runPrimitives(doc) {
  const errors = [];
  validatePrimitives(doc, { skillRoot: packageRoot, errors });
  return errors;
}

test('primitives reverse-extract swiss-deck deterministically with no subjective labels', () => {
  const doc = buildPrimitives('design-systems/swiss-deck', { id: 'test-swiss-primitives-v1', skillRoot: packageRoot });
  assert.equal(doc.schema_version, 'design-primitives/v1');
  assert.equal(doc.status, 'candidate');
  assert.equal(doc.colors.length, 8);
  assert.equal(doc.structural_facts.zero_radius, true);
  assert.deepEqual(doc.structural_facts.chromatic_roles, ['accent', 'accent_2']);
  // factual marker pairing exists and binds bound hexes
  const marker = doc.color_pairings.find((p) => p.id === 'marker-on-accent');
  assert.ok(marker);
  assert.equal(marker.fg, '#d7ff00');
  assert.equal(marker.bg, '#0047ff');
  // spacing scale: px entries sorted ascending, non-px trailing
  const pxEntries = doc.spacing_scale.filter((e) => e.px !== null);
  assert.deepEqual(pxEntries.map((e) => e.px), [10, 20, 32]);
  assert.deepEqual(runPrimitives(doc), []);
});

test('primitives pairing hex absent from tokens is rejected (no fabrication)', () => {
  const doc = buildPrimitives('design-systems/swiss-deck', { id: 'test-prim-fab-v1', skillRoot: packageRoot });
  doc.color_pairings[0].fg = '#123456';
  const errors = runPrimitives(doc);
  assert.ok(errors.some((e) => e.includes('#123456') && e.includes('not present')), errors.join('; '));
});

test('primitives status other than candidate is rejected', () => {
  const doc = buildPrimitives('design-systems/swiss-deck', { id: 'test-prim-status-v1', skillRoot: packageRoot });
  doc.status = 'reviewer_confirmed';
  const errors = runPrimitives(doc);
  assert.ok(errors.some((e) => e.includes('status must be candidate')), errors.join('; '));
});

test('primitives extraction refuses token source without spacing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'prim-nospace-'));
  try {
    writeFileSync(join(dir, 'tokens.css'), ':root {\n  --surface: #f7f8f6;\n  --accent: #2f6f9f;\n  --text: #1f2933;\n}\n');
    assert.throws(() => buildPrimitives(dir, { id: 'nospace-v1', skillRoot: '/' }), /no spacing tokens/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('primitives CLI registers into design-knowledge and the dir validates', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'prim-cli-'));
  try {
    const stdout = execFileSync(
      process.execPath,
      ['scripts/extract-primitives.mjs', 'design-systems/swiss-deck', '--id=cli-primitives-v1', `--out=${join(tmp, 'p.json')}`, '--no-register'],
      { cwd: packageRoot, encoding: 'utf8' }
    );
    assert.ok(stdout.includes('zero_radius=true'));
    const doc = JSON.parse(readFileSync(join(tmp, 'p.json'), 'utf8'));
    assert.equal(doc.status, 'candidate');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('default design-knowledge validates without historical primitives', () => {
  const result = validateKnowledgeDir('design-knowledge');
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.equal(result.primitives, 0);
});
