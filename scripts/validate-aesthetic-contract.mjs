#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-aesthetic-contract.mjs <artifact-dir>');
  process.exit(2);
}

const errors = [];
const manifestPath = join(dir, 'manifest.json');
const htmlPath = join(dir, 'index.html');

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function stripRootBlocks(cssOrHtml) {
  return cssOrHtml.replace(/:root\s*\{[\s\S]*?\}/g, '');
}

if (!existsSync(manifestPath)) errors.push('Missing manifest.json.');
const manifest = existsSync(manifestPath) ? readJson(manifestPath, 'manifest.json') : null;
const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';

if (manifest) {
  const contract = manifest.aesthetic_contract;
  if (!contract) {
    errors.push('aesthetic_contract is required for aesthetic validation.');
  } else {
    for (const field of ['layout_lock', 'accent_policy', 'svg_text_policy', 'motion_policy', 'visual_rhythm']) {
      if (!(field in contract)) errors.push(`aesthetic_contract missing ${field}.`);
    }
    if (contract.layout_lock === 'swiss-s01-s22' && manifest.style_preset !== 'swiss-deck') {
      errors.push('aesthetic_contract layout_lock swiss-s01-s22 requires style_preset swiss-deck.');
    }
    if (contract.layout_lock === 'swiss-s01-s22' && manifest.design_system?.id !== 'swiss-deck') {
      errors.push('aesthetic_contract layout_lock swiss-s01-s22 requires design_system.id swiss-deck.');
    }
    if (contract.accent_policy?.accent_2 === 'marker_only') {
      const bodyWithoutRoot = stripRootBlocks(html);
      if (/(background|background-color|border|box-shadow)\s*:\s*#d7ff00/i.test(bodyWithoutRoot)) {
        errors.push('accent_2 marker_only violation: #d7ff00 used as surface, border, or shadow outside tokens.');
      }
    }
    if (contract.motion_policy === 'semantic_with_reduced_motion' && html && !/prefers-reduced-motion/i.test(html)) {
      errors.push('motion_policy semantic_with_reduced_motion requires prefers-reduced-motion fallback.');
    }
    if (['L1-interactive', 'L2-motion'].includes(contract.expression_level)) {
      for (const field of ['semantic_job', 'reader_value', 'attention_budget', 'fallback']) {
        if (!(field in contract)) errors.push(`aesthetic_contract ${contract.expression_level} missing ${field}.`);
      }
    }
    if (contract.expression_level === 'L2-motion'
        && contract.motion_policy !== 'semantic_with_reduced_motion') {
      errors.push('aesthetic_contract L2-motion requires semantic_with_reduced_motion.');
    }
    if ((contract.attention_budget?.signature_move_count ?? 0) > 1) {
      errors.push('aesthetic_contract attention budget allows at most one signature move.');
    }
    if ((contract.attention_budget?.ambient_field_count ?? 0) > 1) {
      errors.push('aesthetic_contract attention budget allows at most one ambient field.');
    }
    if (contract.fallback) {
      for (const field of ['reduced_motion', 'static_html', 'ppt_handoff']) {
        if (!String(contract.fallback[field] || '').trim()) {
          errors.push(`aesthetic_contract fallback missing ${field}.`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error('Aesthetic contract validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Aesthetic contract validation passed: ${dir}`);
