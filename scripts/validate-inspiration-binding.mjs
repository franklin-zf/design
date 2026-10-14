#!/usr/bin/env node
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync
} from 'node:fs';
import {
  dirname,
  isAbsolute,
  relative,
  resolve
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadShotsIndex } from '../packages/dribbble-hub-mcp/src/index.mjs';
import { validateJsonInstance } from './lib/json-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const schema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/inspiration-binding.schema.json'),
  'utf8'
));

function inside(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
}

function readArtifactFile(root, ref, label) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).includes('..')) {
    throw new Error(`${label} must be a safe artifact-relative path`);
  }
  const path = resolve(root, ref);
  if (!inside(root, path) || !existsSync(path)
      || lstatSync(path).isSymbolicLink()) {
    throw new Error(`${label} is missing, unsafe, or a symlink: ${ref}`);
  }
  const real = realpathSync(path);
  if (!inside(root, real) || !statSync(real).isFile()) {
    throw new Error(`${label} must resolve to a regular artifact file: ${ref}`);
  }
  return JSON.parse(readFileSync(real, 'utf8'));
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${stable(value[key])}`
    ).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function validateInspirationBinding(directory, options = {}) {
  const errors = [];
  if (!existsSync(directory)) return ['artifact directory does not exist'];
  const root = realpathSync(directory);
  let binding;
  try {
    binding = readArtifactFile(
      root,
      options.bindingRef || 'inspiration-binding.json',
      'inspiration binding'
    );
  } catch (error) {
    return [error.message];
  }
  errors.push(...validateJsonInstance(schema, binding).map(
    (error) => `inspiration-binding ${error}`
  ));
  if (!binding || typeof binding !== 'object') return errors;

  let manifest = null;
  if (existsSync(resolve(root, 'manifest.json'))) {
    try {
      manifest = readArtifactFile(root, 'manifest.json', 'artifact manifest');
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (manifest?.artifact_type
      && manifest.artifact_type !== binding.artifact_type) {
    errors.push('inspiration binding artifact_type must match manifest');
  }

  let plan = null;
  if (options.executionPlanPath) {
    try {
      plan = JSON.parse(readFileSync(resolve(options.executionPlanPath), 'utf8'));
    } catch (error) {
      errors.push(`execution plan is unreadable: ${error.message}`);
    }
  }
  if (plan) {
    if (plan.resolved_gate_plan_digest !== binding.execution_plan_digest) {
      errors.push('inspiration binding execution_plan_digest mismatch');
    }
    if (plan.artifact?.artifact_type !== binding.artifact_type) {
      errors.push('inspiration binding artifact_type must match execution plan');
    }
    const expectedRef = plan.evidence_contract?.inspiration_binding_ref;
    if (expectedRef && expectedRef !== (options.bindingRef || 'inspiration-binding.json')) {
      errors.push('inspiration binding ref must match execution plan');
    }
  }

  const index = loadShotsIndex();
  const records = new Map(index.shots.map((shot) => [shot.id, shot]));
  const roles = new Set();
  for (const reference of binding.selected_references || []) {
    const source = records.get(reference.id);
    if (!source) {
      errors.push(`inspiration reference is unknown: ${reference.id}`);
      continue;
    }
    if (roles.has(reference.role)) {
      errors.push(`inspiration reference role is duplicated: ${reference.role}`);
    }
    roles.add(reference.role);
    for (const field of [
      'source_url',
      'preview_source_url',
      'preview_sha256'
    ]) {
      if (reference[field] !== source[field]) {
        errors.push(`inspiration reference ${reference.id} ${field} drift`);
      }
    }
    if (stable(reference.rights) !== stable(source.rights)) {
      errors.push(`inspiration reference ${reference.id} rights drift`);
    }
    const availableMethods = new Set(source.annotation?.visual_methods || []);
    if (reference.extracted_methods?.some(
      (method) => !availableMethods.has(method)
    )) {
      errors.push(
        `inspiration reference ${reference.id} uses an unverified method`
      );
    }
    if (stable(reference.do_not_copy)
        !== stable(source.annotation?.do_not_copy || [])) {
      errors.push(`inspiration reference ${reference.id} do_not_copy drift`);
    }
  }
  return [...new Set(errors)].sort();
}

function option(name) {
  return process.argv.find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const directory = process.argv[2];
  if (!directory) {
    console.error(
      'Usage: node scripts/validate-inspiration-binding.mjs '
      + '<artifact-dir> [--binding=<ref>] [--execution-plan=<path>]'
    );
    process.exit(2);
  }
  const errors = validateInspirationBinding(directory, {
    bindingRef: option('--binding'),
    executionPlanPath: option('--execution-plan')
  });
  if (errors.length) {
    console.error('Inspiration binding validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Inspiration binding validation passed: ${directory}`);
}
