#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const vendorDir = join(root, 'assets/vendor/open-design-html-ppt');
const provenancePath = join(vendorDir, 'PROVENANCE.json');
const errors = [];

if (!existsSync(provenancePath)) {
  errors.push('Missing Open Design vendor PROVENANCE.json.');
} else {
  const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
  if (provenance.license !== 'MIT') errors.push('Open Design vendor license must be MIT.');
  if (!provenance.source_commit) errors.push('Open Design vendor provenance missing source_commit.');
  for (const file of provenance.files || []) {
    const path = join(vendorDir, file.destination);
    if (!existsSync(path)) {
      errors.push(`Missing adopted vendor file: ${file.destination}`);
      continue;
    }
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (actual !== file.sha256) {
      errors.push(`Vendor hash mismatch for ${file.destination}: expected ${file.sha256}, got ${actual}.`);
    }
  }
}

if (errors.length) {
  console.error('Vendor provenance validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Vendor provenance validation passed.');
