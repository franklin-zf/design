#!/usr/bin/env node
import { createHash } from 'node:crypto';
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
import { computeArtifactDigest } from './lib/artifact-digest.mjs';
import { validateJsonInstance } from './lib/json-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const schema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/browser-test-evidence.schema.json'),
  'utf8'
));

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

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
  return { path: real, bytes: readFileSync(real) };
}

function readJsonFile(path, label, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is unreadable: ${error.message}`);
    return null;
  }
}

export function validateBrowserTestEvidence(directory, options = {}) {
  const errors = [];
  if (!existsSync(directory)) return ['artifact directory does not exist'];
  const root = realpathSync(directory);
  let evidenceFile;
  try {
    evidenceFile = readArtifactFile(
      root,
      options.evidenceRef || 'browser-test-evidence.json',
      'browser test evidence'
    );
  } catch (error) {
    return [error.message];
  }
  let evidence;
  try {
    evidence = JSON.parse(evidenceFile.bytes.toString('utf8'));
  } catch (error) {
    return [`browser test evidence is invalid JSON: ${error.message}`];
  }
  errors.push(...validateJsonInstance(schema, evidence).map(
    (error) => `browser-test-evidence ${error}`
  ));
  if (!evidence || typeof evidence !== 'object') return errors;

  let artifactDigest = null;
  try {
    artifactDigest = computeArtifactDigest(root);
  } catch (error) {
    errors.push(error.message);
  }
  if (artifactDigest && evidence.artifact_digest !== artifactDigest) {
    errors.push('browser test evidence artifact_digest mismatch');
  }

  const planPath = options.executionPlanPath
    ? resolve(options.executionPlanPath)
    : resolve(root, '.design', 'execution-plan.json');
  if (existsSync(planPath)) {
    const plan = readJsonFile(planPath, 'execution plan', errors);
    if (plan?.resolved_gate_plan_digest !== evidence.execution_plan_digest) {
      errors.push('browser test evidence execution_plan_digest mismatch');
    }
  } else if (options.requirePlan !== false) {
    errors.push('browser test evidence requires an execution plan');
  }

  const renderSpecPath = options.renderSpecPath
    ? resolve(options.renderSpecPath)
    : resolve(root, '.design', 'render-spec.json');
  if (existsSync(renderSpecPath)) {
    const renderSpec = readJsonFile(renderSpecPath, 'render spec', errors);
    if (renderSpec?.spec_digest !== evidence.render_spec_digest) {
      errors.push('browser test evidence render_spec_digest mismatch');
    }
  } else if (options.requireRenderSpec !== false) {
    errors.push('browser test evidence requires a render spec');
  }

  const runIds = new Set();
  const coveredRequirementIds = new Set();
  for (const run of evidence.runs || []) {
    if (runIds.has(run.id)) {
      errors.push(`browser test run id is duplicated: ${run.id}`);
    }
    runIds.add(run.id);
    for (const id of run.requirement_ids || []) coveredRequirementIds.add(id);
    try {
      const screenshot = readArtifactFile(
        root,
        run.after_screenshot?.ref,
        `browser test run ${run.id} screenshot`
      );
      if (sha256(screenshot.bytes) !== run.after_screenshot?.sha256) {
        errors.push(`browser test run ${run.id} screenshot SHA-256 mismatch`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  for (const requirementId of options.expectedRequirementIds || []) {
    if (!coveredRequirementIds.has(requirementId)) {
      errors.push(
        `browser test evidence does not cover requirement ${requirementId}`
      );
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
      'Usage: node scripts/validate-browser-test-evidence.mjs '
      + '<artifact-dir> [--evidence=<ref>] [--execution-plan=<path>] '
      + '[--render-spec=<path>]'
    );
    process.exit(2);
  }
  const errors = validateBrowserTestEvidence(directory, {
    evidenceRef: option('--evidence'),
    executionPlanPath: option('--execution-plan'),
    renderSpecPath: option('--render-spec')
  });
  if (errors.length) {
    console.error('Browser test evidence validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Browser test evidence validation passed: ${directory}`);
}
