#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || '.';
const systemId = process.argv[3] || 'swiss-deck';
const systemRoot = join(root, 'design-systems', systemId);
const errors = [];

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

for (const file of [
  'manifest.json',
  'DESIGN.md',
  'USAGE.md',
  'tokens.css',
  'design-tokens.json',
  'components.html',
  'components.manifest.json',
  'preview/colors.html',
  'preview/typography.html',
  'preview/spacing.html',
  'preview/deck.html',
  'source/evidence.md',
  'source/token-contract.report.json'
]) {
  if (!existsSync(join(systemRoot, file))) errors.push(`design-system package missing ${systemId}/${file}`);
}

const manifestPath = join(systemRoot, 'manifest.json');
const manifest = existsSync(manifestPath) ? readJson(manifestPath, `${systemId}/manifest.json`) : null;
if (manifest) {
  if (manifest.schema_version !== 'design-system-package/v1') {
    errors.push(`${systemId}/manifest.json schema_version must be design-system-package/v1.`);
  }
  if (manifest.id !== systemId) errors.push(`${systemId}/manifest.json id must be ${systemId}.`);
  for (const field of ['design', 'tokens', 'components', 'components_manifest']) {
    if (!manifest.files?.[field]) errors.push(`${systemId}/manifest.json files.${field} is required.`);
  }
  for (const field of ['layout_lock', 'accent_policy', 'svg_text_policy', 'motion_policy']) {
    if (!manifest.contracts?.[field]) errors.push(`${systemId}/manifest.json contracts.${field} is required.`);
  }
}

const tokensPath = join(systemRoot, 'design-tokens.json');
const tokens = existsSync(tokensPath) ? readJson(tokensPath, `${systemId}/design-tokens.json`) : null;
if (tokens && tokens.schema_version !== 'design-tokens/v1') {
  errors.push(`${systemId}/design-tokens.json schema_version must be design-tokens/v1.`);
}

const componentsPath = join(systemRoot, 'components.manifest.json');
const components = existsSync(componentsPath) ? readJson(componentsPath, `${systemId}/components.manifest.json`) : null;
if (components) {
  if (components.schema_version !== 'components-manifest/v1') {
    errors.push(`${systemId}/components.manifest.json schema_version must be components-manifest/v1.`);
  }
  if (!Array.isArray(components.components) || components.components.length === 0) {
    errors.push(`${systemId}/components.manifest.json components must be non-empty.`);
  }
}

if (errors.length) {
  console.error('Design system package validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Design system package validation passed: ${systemId}`);
