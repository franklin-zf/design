import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('.');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

test('dependency-free schema validator handles local refs and conditional requirements', async () => {
  const { compileSchema, validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const manifestSchema = readJson(join(root, 'schemas/artifact-manifest.schema.json'));
  const claimSchema = readJson(join(root, 'schemas/claim-map.schema.json'));
  const validManifest = readJson(join(root, 'examples/chart-frame-pass/manifest.json'));
  const validClaim = readJson(join(root, 'examples/chart-frame-pass/claim-map.json'));
  const invalidClaim = readJson(join(root, 'examples/invalid-claim-missing-evidence-quote/claim-map.json'));

  assert.doesNotThrow(() => compileSchema(manifestSchema));
  assert.deepEqual(validateJsonInstance(manifestSchema, validManifest), []);
  assert.deepEqual(validateJsonInstance(claimSchema, validClaim), []);
  assert.match(validateJsonInstance(claimSchema, invalidClaim).join('\n'), /required|evidence_quotes/);
});

test('schema compiler fails closed on unsupported validation keywords', async () => {
  const { compileSchema } = await import('../scripts/lib/json-schema.mjs');
  assert.throws(
    () => compileSchema({ type: 'string', minLength: 1, madeUpConstraint: true }),
    /unsupported schema keyword.*madeUpConstraint/i
  );
});

test('artifact manifest schema and runtime share canonical required fields', async () => {
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const schema = readJson(join(root, 'schemas/artifact-manifest.schema.json'));
  const valid = readJson(join(root, 'examples/chart-frame-pass/manifest.json'));

  for (const field of ['template_id', 'template_selection', 'validation']) {
    const invalid = structuredClone(valid);
    delete invalid[field];
    assert.match(validateJsonInstance(schema, invalid).join('\n'), new RegExp(field));
  }
});
