#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { z } from 'playwright-core/lib/utilsBundle';

const manifestRequired = [
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

const schemaFiles = [
  'schemas/intake-direction.schema.json',
  'schemas/data-provenance.schema.json',
  'schemas/deck-plan.schema.json',
  'schemas/chart-spec.schema.json',
  'schemas/claim-map.schema.json',
  'schemas/summary-map.schema.json',
  'schemas/visual-asset.schema.json',
  'schemas/layout-registry.schema.json',
  'schemas/poster-plan.schema.json',
  'design-systems/_schema/design-system-package.schema.json',
  'design-systems/_schema/tokens.schema.json',
  'design-systems/_schema/components-manifest.schema.json'
];

const instanceSchemaByName = {
  'manifest.json': 'schemas/artifact-manifest.schema.json',
  'data-provenance.json': 'schemas/data-provenance.schema.json',
  'claim-map.json': 'schemas/claim-map.schema.json',
  'summary-map.json': 'schemas/summary-map.schema.json',
  'deck-plan.json': 'schemas/deck-plan.schema.json',
  'chart-spec.json': 'schemas/chart-spec.schema.json',
  'poster-plan.json': 'schemas/poster-plan.schema.json',
  'visual-asset.json': 'schemas/visual-asset.schema.json',
  'layout-registry.json': 'schemas/layout-registry.schema.json',
  'intake-direction.json': 'schemas/intake-direction.schema.json'
};

function stripConditionals(value) {
  if (Array.isArray(value)) return value.map(stripConditionals);
  if (!value || typeof value !== 'object') return value;

  const result = {};
  for (const [key, child] of Object.entries(value)) {
    if (key !== 'if' && key !== 'then' && key !== 'else') {
      result[key] = stripConditionals(child);
    }
  }
  if (!Object.hasOwn(result, 'type')) {
    if (result.properties || result.required || result.additionalProperties) result.type = 'object';
    else if (result.items || result.minItems !== undefined || result.maxItems !== undefined || result.uniqueItems !== undefined) {
      result.type = 'array';
    }
  }
  return result;
}

function formatIssue(issue) {
  const path = issue.path?.length ? `/${issue.path.join('/')}` : '/';
  return `${path}: ${issue.message}`;
}

function baseValidation(schema, instance) {
  const validator = z.fromJSONSchema(stripConditionals(schema));
  const result = validator.safeParse(instance);
  return result.success ? [] : result.error.issues.map(formatIssue);
}

function prefixErrors(errors, path) {
  return errors.map((error) => `${path || '/'} ${error}`);
}

function validateConditionalNodes(schema, instance, path, errors) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.if) {
    const conditionMatches = baseValidation(schema.if, instance).length === 0;
    const branch = conditionMatches ? schema.then : schema.else;
    if (branch) {
      errors.push(...prefixErrors(validateJsonInstance(branch, instance), path));
    }
  }

  if (schema.properties && instance && typeof instance === 'object' && !Array.isArray(instance)) {
    for (const [property, propertySchema] of Object.entries(schema.properties)) {
      if (Object.hasOwn(instance, property)) {
        validateConditionalNodes(propertySchema, instance[property], `${path}/${property}`, errors);
      }
    }
  }

  if (schema.items && Array.isArray(instance)) {
    for (const [index, item] of instance.entries()) {
      validateConditionalNodes(schema.items, item, `${path}/${index}`, errors);
    }
  }

  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    for (const child of schema[key] || []) {
      validateConditionalNodes(child, instance, path, errors);
    }
  }
}

// Validate a JSON instance against a draft-2020-12 schema. Zod is bundled by
// the existing Playwright dependency; this adapter preserves the conditional
// keywords used by these schemas.
export function validateJsonInstance(schema, instance) {
  try {
    const errors = baseValidation(schema, instance);
    validateConditionalNodes(schema, instance, '', errors);
    return errors;
  } catch (error) {
    return [`schema compilation failed: ${error.message}`];
  }
}

function readJson(path, label, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function walkFiles(root) {
  const files = [];
  if (!statSync(root).isDirectory()) return files;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function validatePositiveInstances(root, schemas, errors) {
  const examplesRoot = join(root, 'examples');
  if (!statSync(examplesRoot, { throwIfNoEntry: false })?.isDirectory()) return;

  for (const instancePath of walkFiles(examplesRoot)) {
    const relativePath = relative(examplesRoot, instancePath);
    const directoryName = relativePath.split('/')[0];
    const schemaPath = instanceSchemaByName[instancePath.split('/').pop()];
    if (!schemaPath || !directoryName.endsWith('-pass')) continue;

    const instance = readJson(instancePath, relativePath, errors);
    if (!instance) continue;
    const schema = schemas.get(schemaPath);
    for (const issue of validateJsonInstance(schema, instance)) {
      errors.push(`${relativePath} does not match ${schemaPath}: ${issue}`);
    }
  }
}

export function validateSchemas(root = '.') {
  const errors = [];
  const resolvedRoot = resolve(root);
  const manifestSchemaPath = join(resolvedRoot, 'schemas/artifact-manifest.schema.json');
  const aestheticSchemaPath = join(resolvedRoot, 'schemas/aesthetic-contract.schema.json');
  const schemas = new Map();

  const manifestSchema = readJson(manifestSchemaPath, 'artifact-manifest.schema.json', errors);
  const aestheticSchema = readJson(aestheticSchemaPath, 'aesthetic-contract.schema.json', errors);
  if (manifestSchema && aestheticSchema) {
    const schemaRequired = manifestSchema.required || [];
    const missing = manifestRequired.filter((field) => !schemaRequired.includes(field));
    const extra = schemaRequired.filter((field) => !manifestRequired.includes(field));
    if (missing.length || extra.length) {
      errors.push('Schema drift detected between artifact-manifest.schema.json and validator required fields.');
      if (missing.length) errors.push(`Schema missing: ${missing.join(', ')}`);
      if (extra.length) errors.push(`Schema extra: ${extra.join(', ')}`);
    }

    const manifestLayoutLocks = manifestSchema.$defs?.aesthetic_contract?.properties?.layout_lock?.enum || [];
    const aestheticLayoutLocks = aestheticSchema.properties?.layout_lock?.enum || [];
    const manifestLockSet = new Set(manifestLayoutLocks);
    const aestheticLockSet = new Set(aestheticLayoutLocks);
    for (const lock of manifestLayoutLocks) {
      if (!aestheticLockSet.has(lock)) errors.push(`aesthetic-contract.schema.json missing layout_lock enum: ${lock}`);
    }
    for (const lock of aestheticLayoutLocks) {
      if (!manifestLockSet.has(lock)) errors.push(`artifact-manifest.schema.json missing layout_lock enum: ${lock}`);
    }
  }

  for (const relativePath of [
    'schemas/artifact-manifest.schema.json',
    'schemas/aesthetic-contract.schema.json',
    ...schemaFiles
  ]) {
    const path = join(resolvedRoot, relativePath);
    const schema = readJson(path, relativePath, errors);
    if (schema) {
      try {
        z.fromJSONSchema(stripConditionals(schema));
        schemas.set(relativePath, schema);
      } catch (error) {
        errors.push(`${relativePath} is not a supported valid schema: ${error.message}`);
      }
    }
  }

  validatePositiveInstances(resolvedRoot, schemas, errors);

  for (const artifactDir of ['examples/swiss-deck-pass', 'examples/poster-pass']) {
    const manifestPath = join(resolvedRoot, artifactDir, 'manifest.json');
    if (!statSync(manifestPath, { throwIfNoEntry: false })?.isFile()) continue;
    const manifest = readJson(manifestPath, `${artifactDir}/manifest.json`, errors);
    const layoutLock = manifest?.aesthetic_contract?.layout_lock;
    const manifestSchema = schemas.get('schemas/artifact-manifest.schema.json');
    const allowed = manifestSchema?.$defs?.aesthetic_contract?.properties?.layout_lock?.enum || [];
    if (layoutLock && !allowed.includes(layoutLock)) {
      errors.push(`${artifactDir}/manifest.json uses layout_lock not allowed by schemas: ${layoutLock}`);
    }
  }

  return errors;
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] || '.';
  const errors = validateSchemas(root);
  if (errors.length) {
    console.error('Design schemas validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log('Design schemas validation passed.');
  }
}
