#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-visual-rhythm.mjs <artifact-dir>');
  process.exit(2);
}

const errors = [];

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

const manifest = existsSync(join(dir, 'manifest.json')) ? readJson(join(dir, 'manifest.json'), 'manifest.json') : null;
const slidePlan = existsSync(join(dir, 'slide-plan.json')) ? readJson(join(dir, 'slide-plan.json'), 'slide-plan.json') : null;
const rhythm = manifest?.aesthetic_contract?.visual_rhythm;

if (!rhythm || !slidePlan?.slides?.length) {
  console.log(`Visual rhythm validation skipped: ${dir}`);
  process.exit(0);
}

let currentWeight = null;
let runLength = 0;
const maxRun = rhythm.max_same_weight_run || 2;
for (const [index, slide] of slidePlan.slides.entries()) {
  if (!slide.visual_weight) errors.push(`slide ${index + 1} missing visual_weight.`);
  if (slide.visual_weight === currentWeight) {
    runLength += 1;
  } else {
    currentWeight = slide.visual_weight;
    runLength = 1;
  }
  if (runLength > maxRun) {
    errors.push(`visual rhythm violation: ${runLength} consecutive slides use visual_weight ${slide.visual_weight}.`);
  }
}

if (slidePlan.slides.length >= 8 && rhythm.min_unique_layouts_for_8_slides) {
  const uniqueLayouts = new Set(slidePlan.slides.map((slide) => slide.layout_id));
  if (uniqueLayouts.size < rhythm.min_unique_layouts_for_8_slides) {
    errors.push(`visual rhythm violation: only ${uniqueLayouts.size} unique layouts for ${slidePlan.slides.length} slides.`);
  }
}

if (errors.length) {
  console.error('Visual rhythm validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Visual rhythm validation passed: ${dir}`);
