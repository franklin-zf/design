#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || '.';
const manifestSchema = JSON.parse(readFileSync(join(root, 'schemas/artifact-manifest.schema.json'), 'utf8'));
const aestheticSchema = JSON.parse(readFileSync(join(root, 'schemas/aesthetic-contract.schema.json'), 'utf8'));
const errors = [];

const validatorRequired = [
  'schema_version',
  'artifact_type',
  'audience',
  'surface',
  'style_preset',
  'schematic',
  'source_materials',
  'data_sources',
  'metrics',
  'charts',
  'layouts',
  'assumptions',
  'missing_data',
  'unverified_items'
];

const schemaRequired = manifestSchema.required || [];
const missing = validatorRequired.filter((field) => !schemaRequired.includes(field));
const extra = schemaRequired.filter((field) => !validatorRequired.includes(field));

if (missing.length || extra.length) {
  errors.push('Schema drift detected between artifact-manifest.schema.json and validator required fields.');
  if (missing.length) errors.push(`Schema missing: ${missing.join(', ')}`);
  if (extra.length) errors.push(`Schema extra: ${extra.join(', ')}`);
}

const manifestLayoutLocks = manifestSchema.$defs?.aesthetic_contract?.properties?.layout_lock?.enum || [];
const aestheticLayoutLocks = aestheticSchema.properties?.layout_lock?.enum || [];
const manifestLockSet = new Set(manifestLayoutLocks);
const aestheticLockSet = new Set(aestheticLayoutLocks);
for (const lock of manifestLayoutLocks) {
  if (!aestheticLockSet.has(lock)) errors.push(`aesthetic-contract.schema.json missing layout_lock enum: ${lock}`);
}
for (const lock of aestheticLayoutLocks) {
  if (!manifestLockSet.has(lock)) errors.push(`artifact-manifest.schema.json missing layout_lock enum: ${lock}`);
}

for (const file of [
  'schemas/deck-plan.schema.json',
  'schemas/chart-spec.schema.json',
  'schemas/claim-map.schema.json',
  'schemas/summary-map.schema.json',
  'schemas/visual-asset.schema.json',
  'schemas/layout-registry.schema.json',
  'schemas/poster-plan.schema.json',
  'design-systems/_schema/design-system-package.schema.json',
  'design-systems/_schema/tokens.schema.json',
  'design-systems/_schema/components-manifest.schema.json'
]) {
  JSON.parse(readFileSync(join(root, file), 'utf8'));
}

for (const artifactDir of ['examples/swiss-deck-pass', 'examples/poster-pass']) {
  const manifest = JSON.parse(readFileSync(join(root, artifactDir, 'manifest.json'), 'utf8'));
  const layoutLock = manifest.aesthetic_contract?.layout_lock;
  if (layoutLock && !manifestLockSet.has(layoutLock)) {
    errors.push(`${artifactDir}/manifest.json uses layout_lock not allowed by schemas: ${layoutLock}`);
  }
}

if (errors.length) {
  console.error('Design schemas validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Design schemas validation passed.');
