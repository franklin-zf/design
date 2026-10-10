#!/usr/bin/env node
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const reviewerSchema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/reviewer-record.schema.json'),
  'utf8'
));
const requiredDimensions = [
  'color-material',
  'composition',
  'finish-micro-detail',
  'media-art-direction',
  'motion-interaction',
  'responsive-adaptation',
  'typography'
];
const requiredOperationalChecks = [
  'alignment',
  'locale',
  'iconography',
  'palette'
];

function inside(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
}

function validateEvidenceRef(root, ref, label, errors) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).includes('..')) {
    errors.push(`${label} must be a safe artifact-relative path`);
    return;
  }
  const path = resolve(root, ref);
  if (!inside(root, path) || !existsSync(path) || lstatSync(path).isSymbolicLink()) {
    errors.push(`${label} is missing, unsafe, or a symlink: ${ref}`);
    return;
  }
  const real = realpathSync(path);
  if (!inside(root, real) || !statSync(real).isFile()) {
    errors.push(`${label} must resolve to a regular artifact file: ${ref}`);
  }
}

export function validateVisualReview(record, artifactRoot) {
  const errors = [];
  const root = realpathSync(artifactRoot);
  errors.push(...validateJsonInstance(reviewerSchema, record).map(
    (error) => `reviewer record ${error}`
  ));
  if (record?.schema_version !== 'design-reviewer-record/v4') {
    errors.push('visual review requires design-reviewer-record/v4');
    return [...new Set(errors)].sort();
  }
  const checks = record.checks || [];
  const checkIds = checks.map((check) => check.id);
  if (new Set(checkIds).size !== checkIds.length) {
    errors.push('reviewer checks require unique ids');
  }
  for (const check of checks) {
    const label = `reviewer check ${check.id || 'unknown'}`;
    for (const ref of check.evidence_refs || []) {
      validateEvidenceRef(root, ref, `${label} evidence`, errors);
    }
    if (record.review_status === 'approved' && check.status !== 'passed') {
      errors.push(`approved reviewer record requires ${label} to be passed`);
    }
  }
  const craft = record.craft_review;
  if (craft?.experience_mode === 'operational') {
    for (const id of requiredOperationalChecks) {
      const matches = checks.filter((check) => check.id === id);
      if (matches.length !== 1) {
        errors.push(
          `operational visual review requires exactly one ${id} check`
        );
      } else if (matches[0].status !== 'passed') {
        errors.push(`operational reviewer check ${id} must be passed`);
      }
    }
  }
  const dimensions = craft?.dimensions || [];
  const ids = dimensions.map((dimension) => dimension.id).sort();
  if (JSON.stringify(ids) !== JSON.stringify(requiredDimensions)) {
    errors.push('craft review requires each rubric dimension exactly once');
  }
  const scores = [];
  for (const dimension of dimensions) {
    const label = `craft dimension ${dimension.id || 'unknown'}`;
    if (dimension.status === 'not_applicable') {
      if (dimension.id !== 'motion-interaction') {
        errors.push(`${label} cannot be not_applicable`);
      }
    } else if (dimension.status === 'scored') {
      scores.push(dimension.score);
      if (dimension.score < 3) {
        errors.push(`${label} must score at least 3 for candidate_ready`);
      }
    }
    for (const ref of dimension.evidence_refs || []) {
      validateEvidenceRef(root, ref, `${label} evidence`, errors);
    }
  }
  const ownership = craft?.ownership || {};
  for (const field of [
    'content_specificity',
    'world_coherence',
    'memorable_element'
  ]) {
    if (ownership[field] < 3) {
      errors.push(`craft ownership ${field} must score at least 3`);
    }
  }
  for (const ref of ownership.evidence_refs || []) {
    validateEvidenceRef(root, ref, 'craft ownership evidence', errors);
  }
  const expectedApplicable = scores.length;
  const expectedMinimum = scores.length ? Math.min(...scores) : 0;
  const expectedStatus = expectedApplicable >= 6
      && expectedMinimum >= 3
      && [
        ownership.content_specificity,
        ownership.world_coherence,
        ownership.memorable_element
      ].every((score) => score >= 3)
    ? 'passed'
    : 'failed';
  if (craft?.summary?.applicable_count !== expectedApplicable) {
    errors.push(
      `craft summary applicable_count must equal ${expectedApplicable}`
    );
  }
  if (craft?.summary?.minimum_score !== expectedMinimum) {
    errors.push(`craft summary minimum_score must equal ${expectedMinimum}`);
  }
  if (craft?.summary?.gate_status !== expectedStatus) {
    errors.push(`craft summary gate_status must equal ${expectedStatus}`);
  }
  if (record.review_status === 'approved' && expectedStatus !== 'passed') {
    errors.push('approved reviewer record requires a passed craft gate');
  }
  return [...new Set(errors)].sort();
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const directory = process.argv[2];
  const recordArgument = process.argv.find((argument) => (
    argument.startsWith('--record=')
  ));
  if (!directory) {
    console.error(
      'Usage: node scripts/validate-visual-review.mjs '
      + '<artifact-dir> [--record=<ref>]'
    );
    process.exit(2);
  }
  try {
    const root = realpathSync(directory);
    const recordRef = recordArgument?.slice('--record='.length)
      || 'reviewer-record.json';
    const recordPath = resolve(root, recordRef);
    if (!inside(root, recordPath) || !existsSync(recordPath)
        || lstatSync(recordPath).isSymbolicLink()
        || !statSync(recordPath).isFile()) {
      throw new Error(`reviewer record is missing or unsafe: ${recordRef}`);
    }
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    const errors = validateVisualReview(record, root);
    if (errors.length) {
      console.error('Visual review validation failed:');
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
    } else {
      console.log(`Visual review validation passed: ${directory}`);
    }
  } catch (error) {
    console.error(`Visual review validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
