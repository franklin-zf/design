#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  catalogueSha256,
  loadComponentCatalogue,
  resolveComponentSelection
} from './lib/component-catalogue.mjs';
import { computeArtifactDigest } from './validate-evidence-contract.mjs';

const modulePath = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(modulePath), '..');
const sha256Pattern = /^[a-f0-9]{64}$/;

function sortedUniqueStrings(value, label, errors) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  if (value.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(`${label} must contain non-empty strings`);
  }
  const normalized = value.map((item) => String(item).trim());
  if (new Set(normalized).size !== normalized.length) {
    errors.push(`${label} must contain unique values`);
  }
  return [...new Set(normalized)].sort();
}

function markerComponentIds(html) {
  return [...html.matchAll(
    /\bdata-design-component\s*=\s*(?:"([^"]+)"|'([^']+)')/gi
  )].map((match) => match[1] || match[2]);
}

function hasActiveRemoteResource(html) {
  const remote = String.raw`(?:https?:)?//`;
  const tagResource = new RegExp(
    String.raw`<(?:script|img|source|video|audio|iframe|embed)\b[^>]*\b(?:src|srcset)\s*=\s*["']\s*${remote}`,
    'i'
  );
  const stylesheet = new RegExp(
    String.raw`<link\b[^>]*\bhref\s*=\s*["']\s*${remote}`,
    'i'
  );
  const objectData = new RegExp(
    String.raw`<object\b[^>]*\bdata\s*=\s*["']\s*${remote}`,
    'i'
  );
  const cssResource = new RegExp(
    String.raw`(?:@import\s+|url\(\s*["']?)${remote}`,
    'i'
  );
  const scriptRequest = new RegExp(
    String.raw`\b(?:fetch|import)\s*\(\s*["']\s*${remote}|\bnew\s+(?:WebSocket|EventSource)\s*\(\s*["']\s*${remote}`,
    'i'
  );
  return [
    tagResource,
    stylesheet,
    objectData,
    cssResource,
    scriptRequest
  ].some((pattern) => pattern.test(html));
}

function compareResolution(actual, expected, errors) {
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
    errors.push('component resolution must be an object');
    return;
  }
  if (actual.schema_version !== 'design-component-resolution/v1') {
    errors.push('component resolution schema_version is invalid');
  }
  if (actual.catalogue_digest !== expected.catalogue_digest) {
    errors.push('component resolution catalogue digest mismatch');
  }
  if (catalogueSha256(actual.selected || []) !== catalogueSha256(expected.selected)) {
    errors.push('component resolution selected records mismatch');
  }
  if (Object.hasOwn(actual, 'plan_digest')
      && !sha256Pattern.test(actual.plan_digest)) {
    errors.push('component resolution plan_digest must be lowercase SHA-256');
  }
  if (Object.hasOwn(actual, 'artifact_digest')
      && !sha256Pattern.test(actual.artifact_digest)) {
    errors.push('component resolution artifact_digest must be lowercase SHA-256');
  }
}

export function validateComponentUsage({
  artifactRoot,
  catalogue,
  resolution
}) {
  const errors = [];
  const root = resolve(artifactRoot);
  const manifestPath = join(root, 'manifest.json');
  const htmlPath = join(root, 'index.html');
  if (!existsSync(manifestPath)) return ['manifest.json is required'];
  if (!existsSync(htmlPath)) return ['index.html is required'];

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return [`manifest.json is invalid JSON: ${error.message}`];
  }
  const html = readFileSync(htmlPath, 'utf8');
  const manifestIds = sortedUniqueStrings(
    manifest.component_refs,
    'manifest.component_refs',
    errors
  );
  const markerIds = sortedUniqueStrings(
    markerComponentIds(html),
    'data-design-component markers',
    errors
  );
  const resolvedIds = sortedUniqueStrings(
    resolution?.selected?.map((item) => item.component_id),
    'component resolution selected ids',
    errors
  );

  if (catalogueSha256(manifestIds) !== catalogueSha256(resolvedIds)) {
    errors.push('manifest component_refs must match the resolved plan');
  }
  if (catalogueSha256(markerIds) !== catalogueSha256(resolvedIds)) {
    errors.push('artifact data-design-component markers must match the resolved plan');
  }
  if (resolvedIds.length && hasActiveRemoteResource(html)) {
    errors.push('component usage cannot load active remote resources');
  }

  try {
    const expected = resolveComponentSelection({
      catalogue,
      componentIds: resolvedIds,
      templateId: manifest.template_id,
      artifactType: manifest.artifact_type
    });
    compareResolution(resolution, expected, errors);
  } catch (error) {
    errors.push(error.message);
  }

  if (resolution?.artifact_digest
      && resolution.artifact_digest !== computeArtifactDigest(root)) {
    errors.push('component resolution artifact digest mismatch');
  }
  return [...new Set(errors)].sort();
}

function parseCli(argv) {
  const positional = argv.filter((argument) => !argument.startsWith('--'));
  const resolutionArgument = argv.find((argument) => (
    argument.startsWith('--resolution=')
  ));
  if (positional.length !== 1) {
    throw new Error(
      'Usage: node scripts/validate-component-usage.mjs '
      + '<artifact-dir> [--resolution=<path>]'
    );
  }
  return {
    artifactRoot: resolve(positional[0]),
    resolutionPath: resolutionArgument
      ? resolve(resolutionArgument.slice('--resolution='.length))
      : null
  };
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const cli = parseCli(process.argv.slice(2));
    if (cli.resolutionPath && isAbsolute(cli.resolutionPath)
        && !existsSync(cli.resolutionPath)) {
      throw new Error(`component resolution is missing: ${cli.resolutionPath}`);
    }
    const catalogue = loadComponentCatalogue(
      join(packageRoot, 'assets/components/registry.json'),
      join(packageRoot, 'schemas/component-catalogue.schema.json')
    );
    const resolution = cli.resolutionPath
      ? JSON.parse(readFileSync(cli.resolutionPath, 'utf8'))
      : {
          schema_version: 'design-component-resolution/v1',
          catalogue_digest: catalogueSha256(catalogue),
          selected: []
        };
    const errors = validateComponentUsage({
      artifactRoot: cli.artifactRoot,
      catalogue,
      resolution
    });
    if (errors.length) {
      console.error('Component usage validation failed:');
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
    } else {
      console.log('Component usage validation passed.');
    }
  } catch (error) {
    console.error(`Component usage validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
