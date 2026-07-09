#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-layout-lock.mjs <artifact-dir>');
  process.exit(2);
}

const errors = [];
const allowed = new Set([
  'SWISS-COVER-ASCII',
  'SWISS-CLOSING-ASCII',
  ...Array.from({ length: 22 }, (_, index) => `S${String(index + 1).padStart(2, '0')}`)
]);

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

const manifest = existsSync(join(dir, 'manifest.json')) ? readJson(join(dir, 'manifest.json'), 'manifest.json') : null;
if (manifest?.aesthetic_contract?.layout_lock !== 'swiss-s01-s22') {
  console.log(`Layout lock validation skipped: ${dir}`);
  process.exit(0);
}

const slidePlan = existsSync(join(dir, 'slide-plan.json')) ? readJson(join(dir, 'slide-plan.json'), 'slide-plan.json') : null;
const html = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';

for (const layout of manifest.layouts || []) {
  if (!allowed.has(layout)) errors.push(`unregistered layout in manifest.layouts: ${layout}`);
}

for (const [index, slide] of (slidePlan?.slides || []).entries()) {
  if (!allowed.has(slide.layout_id)) errors.push(`unregistered layout in slide-plan slide ${index + 1}: ${slide.layout_id}`);
  if (slide.layout_id === 'S22' && slide.slot_contract?.slot !== 's22-hero-21x9') {
    errors.push('S22 requires slot_contract.slot s22-hero-21x9.');
  }
}

for (const match of html.matchAll(/<section\b[^>]*\bdata-layout=["']([^"']+)["'][^>]*>/gi)) {
  const layout = match[1];
  if (!allowed.has(layout)) errors.push(`unregistered layout in HTML data-layout: ${layout}`);
}

if (errors.length) {
  console.error('Layout lock validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Layout lock validation passed: ${dir}`);
