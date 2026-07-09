#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-asset-contract.mjs <artifact-dir>');
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

const manifestPath = join(dir, 'manifest.json');
const slidePlanPath = join(dir, 'slide-plan.json');
const htmlPath = join(dir, 'index.html');
const manifest = existsSync(manifestPath) ? readJson(manifestPath, 'manifest.json') : null;
const slidePlan = existsSync(slidePlanPath) ? readJson(slidePlanPath, 'slide-plan.json') : null;
const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';

const htmlSlots = new Set([...html.matchAll(/\bdata-image-slot=["']([^"']+)["']/gi)].map((match) => match[1]));
const slideBySlot = new Map();
for (const slide of slidePlan?.slides || []) {
  if (typeof slide.image_slot === 'string' && slide.image_slot) slideBySlot.set(slide.image_slot, slide);
  if (slide.slot_contract?.slot) slideBySlot.set(slide.slot_contract.slot, slide);
}

for (const [index, asset] of (manifest?.visual_assets || []).entries()) {
  for (const field of ['id', 'file', 'slot', 'kind', 'provenance', 'text_policy']) {
    if (!(field in asset)) errors.push(`visual_assets[${index}] missing ${field}.`);
  }
  if (asset.slot && !htmlSlots.has(asset.slot)) {
    errors.push(`visual_assets[${index}] slot is not rendered by HTML: ${asset.slot}`);
  }
  const slide = asset.slot ? slideBySlot.get(asset.slot) : null;
  if (slide) {
    if (asset.declared_media_decision && asset.declared_media_decision !== slide.media_decision) {
      errors.push(`visual_assets[${index}] declared_media_decision does not match slide-plan media_decision.`);
    }
    if (slide.media_decision === 'screenshot' && asset.kind !== 'screenshot') {
      errors.push(`fake screenshot label: slide ${slide.slide} media_decision screenshot but asset kind is ${asset.kind}.`);
    }
  }
  if (asset.allowed_slot && asset.allowed_slot !== asset.slot) {
    errors.push(`visual_assets[${index}] allowed_slot does not match slot.`);
  }
  const filePath = asset.file ? join(dir, asset.file) : null;
  if (filePath && existsSync(filePath)) {
    const extension = extname(filePath).toLowerCase();
    if (asset.kind === 'screenshot' && extension === '.svg' && asset.provenance !== 'user_source') {
      errors.push(`fake screenshot label: screenshot asset ${asset.file} must be a user_source or raster screenshot.`);
    }
    if (
      extension === '.svg' &&
      manifest?.aesthetic_contract?.svg_text_policy === 'forbid_visible_text_in_swiss_assets' &&
      asset.text_policy === 'html_labels_only'
    ) {
      const svg = readFileSync(filePath, 'utf8');
      if (/<text\b/i.test(svg)) {
        errors.push(`SVG text policy violation: ${asset.file} contains visible <text>.`);
      }
    }
  }
}

if (errors.length) {
  console.error('Asset contract validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Asset contract validation passed: ${dir}`);
