#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || '.';
const manifestSchema = JSON.parse(readFileSync(join(root, 'schemas/artifact-manifest.schema.json'), 'utf8'));

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
  console.error('Schema drift detected between artifact-manifest.schema.json and validator required fields.');
  if (missing.length) console.error(`Schema missing: ${missing.join(', ')}`);
  if (extra.length) console.error(`Schema extra: ${extra.join(', ')}`);
  process.exit(1);
}

for (const file of ['schemas/deck-plan.schema.json', 'schemas/chart-spec.schema.json', 'schemas/claim-map.schema.json', 'schemas/summary-map.schema.json']) {
  JSON.parse(readFileSync(join(root, file), 'utf8'));
}

console.log('Design schemas validation passed.');
