#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const artifactArg = process.argv[2];
if (!artifactArg) {
  console.error('Usage: node scripts/validate-deck-capture-set.mjs <artifact-dir>');
  process.exit(2);
}

const artifactDir = resolve(artifactArg);
const qaDir = join(artifactDir, 'qa');
const artifactName = basename(artifactDir);
const slidePlan = JSON.parse(readFileSync(join(artifactDir, 'slide-plan.json'), 'utf8'));
const expected = new Set();
for (let slide = 1; slide <= slidePlan.slides.length; slide += 1) {
  const number = String(slide).padStart(2, '0');
  for (const suffix of ['desktop', 'mobile', 'desktop-reduced', 'mobile-reduced']) {
    expected.add(`${artifactName}-slide-${number}-${suffix}.png`);
  }
}

const actual = new Set(readdirSync(qaDir).filter((file) => file.startsWith(`${artifactName}-slide-`) && file.endsWith('.png')));
const missing = [...expected].filter((file) => !actual.has(file));
const unexpected = [...actual].filter((file) => !expected.has(file));

if (missing.length || unexpected.length) {
  console.error('Deck capture set validation failed:');
  if (missing.length) console.error(`- Missing captures: ${missing.join(', ')}`);
  if (unexpected.length) console.error(`- Unexpected captures: ${unexpected.join(', ')}`);
  process.exit(1);
}

console.log(`Deck capture set validation passed: ${actual.size} files for ${slidePlan.slides.length} slides.`);
