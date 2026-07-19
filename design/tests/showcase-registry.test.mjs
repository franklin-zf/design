import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

test('existing showcase registry is eligible and keeps explicit coverage gaps', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = resolve('.');
  const registry = JSON.parse(readFileSync(resolve(root, 'showcases/registry.json'), 'utf8'));
  assert.deepEqual(validateShowcaseRegistry(registry, root), []);
});

test('fixture promotion and hidden coverage gaps fail showcase eligibility', async () => {
  const { validateShowcaseRegistry } = await import('../scripts/validate-showcase-registry.mjs');
  const root = resolve('.');
  const registry = JSON.parse(readFileSync(resolve(root, 'showcases/registry.json'), 'utf8'));
  registry.coverage_gaps = [];
  registry.showcases.push({ id: 'fixture-promoted', artifact_type: 'poster', template_id: 'poster-type-led', case_ref: 'examples/poster-pass/manifest.json', artifact_ref: 'examples/poster-pass', surface_evidence: [], production_status: 'fixture_pass', review_scope: '' });
  const errors = validateShowcaseRegistry(registry, root).join('\n');
  assert.match(errors, /coverage_gaps.*report/i);
  assert.match(errors, /ineligible production_status/i);
  assert.match(errors, /requires surface_evidence/i);
});
