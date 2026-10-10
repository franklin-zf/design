#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync
} from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { validateJsonInstance } from './lib/json-schema.mjs';
import { validateColorContract } from './validate-color-system.mjs';

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

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function safeSystemFile(ref, label) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).includes('..')) {
    errors.push(`${label} must be a safe design-system-relative path`);
    return null;
  }
  const path = resolve(systemRoot, ref);
  const rel = relative(resolve(systemRoot), path);
  if (rel.startsWith('..') || isAbsolute(rel) || !existsSync(path)
      || lstatSync(path).isSymbolicLink()) {
    errors.push(`${label} is missing, unsafe, or a symlink: ${ref}`);
    return null;
  }
  const real = realpathSync(path);
  const realRel = relative(realpathSync(systemRoot), real);
  if (realRel.startsWith('..') || isAbsolute(realRel)
      || !statSync(real).isFile()) {
    errors.push(`${label} must resolve to a regular file: ${ref}`);
    return null;
  }
  return real;
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
if (systemId === 'operational-product'
    && !existsSync(join(systemRoot, 'preview/render-spec.json'))) {
  errors.push(
    'design-system package missing operational-product/preview/render-spec.json'
  );
}

const manifestPath = join(systemRoot, 'manifest.json');
const manifest = existsSync(manifestPath) ? readJson(manifestPath, `${systemId}/manifest.json`) : null;
if (manifest) {
  const schema = readJson(
    join(root, 'design-systems/_schema/design-system-package.schema.json'),
    'design-system-package.schema.json'
  );
  if (schema) {
    errors.push(...validateJsonInstance(schema, manifest).map(
      (error) => `${systemId}/manifest.json ${error}`
    ));
  }
  if (manifest.schema_version !== 'design-system-package/v1') {
    errors.push(`${systemId}/manifest.json schema_version must be design-system-package/v1.`);
  }
  if (manifest.id !== systemId) errors.push(`${systemId}/manifest.json id must be ${systemId}.`);
  for (const field of ['design', 'tokens', 'components', 'components_manifest']) {
    if (!manifest.files?.[field]) errors.push(`${systemId}/manifest.json files.${field} is required.`);
  }
  for (const field of [
    'layout_lock',
    'accent_policy',
    'color_policy',
    'svg_text_policy',
    'motion_policy'
  ]) {
    if (!manifest.contracts?.[field]) errors.push(`${systemId}/manifest.json contracts.${field} is required.`);
  }
  for (const asset of manifest.visual_assets || []) {
    const prefix = `${systemId}/manifest.json visual asset ${asset.id || 'unknown'}`;
    const assetPath = safeSystemFile(asset.file, `${prefix} file`);
    if (assetPath && sha256(readFileSync(assetPath)) !== asset.sha256) {
      errors.push(`${prefix} SHA-256 mismatch`);
    }
    safeSystemFile(
      asset.license_evidence_ref,
      `${prefix} license evidence`
    );
    if (!Array.isArray(asset.icons) || asset.icons.length === 0) {
      errors.push(`${prefix} icons must be non-empty`);
    }
  }
}

if (systemId === 'operational-product') {
  const renderSpecPath = join(systemRoot, 'preview/render-spec.json');
  const renderSpec = existsSync(renderSpecPath)
    ? readJson(renderSpecPath, `${systemId}/preview/render-spec.json`)
    : null;
  const renderSpecSchema = readJson(
    join(root, 'schemas/render-spec.schema.json'),
    'render-spec.schema.json'
  );
  if (renderSpec && renderSpecSchema) {
    errors.push(...validateJsonInstance(renderSpecSchema, renderSpec).map(
      (error) => `${systemId}/preview/render-spec.json ${error}`
    ));
  }
}

const tokensPath = join(systemRoot, 'design-tokens.json');
const tokens = existsSync(tokensPath) ? readJson(tokensPath, `${systemId}/design-tokens.json`) : null;
if (tokens) {
  const schema = readJson(
    join(root, 'design-systems/_schema/tokens.schema.json'),
    'tokens.schema.json'
  );
  if (schema) {
    errors.push(...validateJsonInstance(schema, tokens).map(
      (error) => `${systemId}/design-tokens.json ${error}`
    ));
  }
  const colorSchema = readJson(
    join(root, 'schemas/color-contract.schema.json'),
    'color-contract.schema.json'
  );
  if (colorSchema) {
    errors.push(...validateColorContract(
      tokens.color_contract,
      tokens.colors,
      {
        label: `${systemId}/design-tokens.json color contract`,
        schema: colorSchema
      }
    ));
  }
  if (manifest?.contracts?.color_policy !== tokens.color_contract?.paradigm) {
    errors.push(
      `${systemId}/manifest.json contracts.color_policy must match `
      + 'design-tokens.json color_contract.paradigm.'
    );
  }
}

const componentsPath = join(systemRoot, 'components.manifest.json');
const components = existsSync(componentsPath) ? readJson(componentsPath, `${systemId}/components.manifest.json`) : null;
if (components) {
  const schema = readJson(
    join(root, 'design-systems/_schema/components-manifest.schema.json'),
    'components-manifest.schema.json'
  );
  if (schema) {
    errors.push(...validateJsonInstance(schema, components).map(
      (error) => `${systemId}/components.manifest.json ${error}`
    ));
  }
  if (components.schema_version !== 'components-manifest/v1') {
    errors.push(`${systemId}/components.manifest.json schema_version must be components-manifest/v1.`);
  }
  if (!Array.isArray(components.components) || components.components.length === 0) {
    errors.push(`${systemId}/components.manifest.json components must be non-empty.`);
  }
  if (components.system_id !== systemId) {
    errors.push(`${systemId}/components.manifest.json system_id must match.`);
  }
  const componentSource = [
    'components.html',
    'layouts.css'
  ].filter((file) => existsSync(join(systemRoot, file)))
    .map((file) => readFileSync(join(systemRoot, file), 'utf8'))
    .join('\n');
  for (const component of components.components || []) {
    for (const selector of component.selectors || []) {
      if (!componentSource.includes(selector)) {
        errors.push(
          `${systemId} component ${component.id} selector is not materialized: ${selector}`
        );
      }
    }
  }
}

if (errors.length) {
  console.error('Design system package validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Design system package validation passed: ${systemId}`);
