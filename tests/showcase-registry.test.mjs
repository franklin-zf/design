import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const packageRoot = resolve('.');
const caseRef = 'showcases/swiss-evidence-deck-production/case.json';

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'design-showcase-'));
  cpSync(join(packageRoot, 'showcases'), join(root, 'showcases'), { recursive: true });
  cpSync(
    join(packageRoot, 'examples/swiss-evidence-deck-production-pass'),
    join(root, 'examples/swiss-evidence-deck-production-pass'),
    { recursive: true }
  );
  return root;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test('existing showcase registry is eligible and keeps explicit coverage gaps', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = packageRoot;
  const registry = JSON.parse(readFileSync(resolve(root, 'showcases/registry.json'), 'utf8'));
  assert.deepEqual(validateShowcaseRegistry(registry, root), []);
});

test('fixture promotion and hidden coverage gaps fail showcase eligibility', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = packageRoot;
  const registry = JSON.parse(readFileSync(resolve(root, 'showcases/registry.json'), 'utf8'));
  registry.coverage_gaps = [];
  registry.showcases.push({ id: 'fixture-promoted', artifact_type: 'poster', template_id: 'poster-type-led', case_ref: 'examples/poster-pass/manifest.json', artifact_ref: 'examples/poster-pass', surface_evidence: [], production_status: 'fixture_pass', review_scope: '' });
  const errors = validateShowcaseRegistry(registry, root).join('\n');
  assert.match(errors, /coverage_gaps.*report/i);
  assert.match(errors, /ineligible production_status/i);
  assert.match(errors, /requires surface_evidence/i);
});

test('missing showcase artifact fails closed', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = fixtureRoot();
  try {
    const registry = readJson(join(root, 'showcases/registry.json'));
    const record = readJson(join(root, caseRef));
    record.artifact_ref = 'examples/missing-artifact/';
    registry.showcases[0].artifact_ref = record.artifact_ref;
    writeJson(join(root, caseRef), record);
    assert.match(validateShowcaseRegistry(registry, root).join('\n'), /artifact_ref is missing or unsafe/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('source and surface hash drift fail showcase eligibility', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = fixtureRoot();
  try {
    const registry = readJson(join(root, 'showcases/registry.json'));
    const record = readJson(join(root, caseRef));
    record.artifact_binding.source_bindings[0].sha256 = '0'.repeat(64);
    record.artifact_binding.surface_bindings[0].sha256 = 'f'.repeat(64);
    writeJson(join(root, caseRef), record);
    const errors = validateShowcaseRegistry(registry, root).join('\n');
    assert.match(errors, /source evidence SHA-256 mismatch/i);
    assert.match(errors, /surface evidence SHA-256 mismatch/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('surface evidence newer than its review is stale and ineligible', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = fixtureRoot();
  try {
    const registry = readJson(join(root, 'showcases/registry.json'));
    const record = readJson(join(root, caseRef));
    record.artifact_binding.surface_bindings[0].captured_at = new Date(
      Date.parse(record.review_binding.reviewed_at) + 1000
    ).toISOString();
    writeJson(join(root, caseRef), record);
    assert.match(validateShowcaseRegistry(registry, root).join('\n'), /review is stale relative to surface evidence/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('fabricated arbitrary review state is rejected by schema and eligibility checks', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = fixtureRoot();
  try {
    const registry = readJson(join(root, 'showcases/registry.json'));
    const record = readJson(join(root, caseRef));
    record.review_binding.status = 'looks_good';
    record.assurance.visually_reviewed = 'probably';
    writeJson(join(root, caseRef), record);
    const errors = validateShowcaseRegistry(registry, root).join('\n');
    assert.match(errors, /review_binding\.status.*allowed values|review status must be approved/i);
    assert.match(errors, /assurance\.visually_reviewed.*allowed values|lacks required passed/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
