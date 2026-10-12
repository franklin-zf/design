#!/usr/bin/env node
// Validate digest-bound comprehension and preference evidence. This validator
// checks the record and computes rates from counts; it never accepts a
// caller-supplied win rate as truth.

import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { validateJsonInstance } from './lib/json-schema.mjs';
import { decodePng } from './lib/png.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const evaluationSchema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/design-evaluation-record.schema.json'),
  'utf8'
));
const policySchema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/design-evaluation-policy.schema.json'),
  'utf8'
));
const directionSchema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/direction-comparison.schema.json'),
  'utf8'
));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function inside(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
}

function readRegularFile(root, ref, label) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).includes('..')) {
    throw new Error(`${label} must be a safe relative path`);
  }
  const path = resolve(root, ref);
  if (!inside(root, path) || !existsSync(path) || lstatSync(path).isSymbolicLink()) {
    throw new Error(`${label} is missing, unsafe, or a symlink: ${ref}`);
  }
  const real = realpathSync(path);
  if (!inside(root, real) || !statSync(real).isFile()) {
    throw new Error(`${label} must resolve to a regular file: ${ref}`);
  }
  return { path: real, bytes: readFileSync(real) };
}

function readJsonFile(root, ref, label) {
  const file = readRegularFile(root, ref, label);
  try {
    return { ...file, value: JSON.parse(file.bytes.toString('utf8')) };
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

function validateEvidenceRefs(root, refs, label, errors) {
  for (const ref of refs || []) {
    try { readRegularFile(root, ref, `${label} evidence`); }
    catch (error) { errors.push(error.message); }
  }
}

function addSchemaErrors(schema, value, label, errors) {
  errors.push(...validateJsonInstance(schema, value).map((issue) => `${label} ${issue}`));
}

function validateThreeSecond(record, root, errors) {
  const section = record.three_second;
  const sampleSize = section?.sample_size ?? 0;
  const recall = section?.recall || {};
  for (const key of ['reader_job_correct', 'primary_conclusion_correct', 'required_action_correct']) {
    if (Number.isInteger(recall[key]) && recall[key] > sampleSize) {
      errors.push(`three_second.recall.${key} cannot exceed sample_size`);
    }
  }
  validateEvidenceRefs(root, section?.evidence_refs, 'three_second', errors);
  if (section?.status === 'not_run') {
    if (sampleSize !== 0) errors.push('three_second not_run must have sample_size=0');
    if (Object.values(recall).some((value) => value !== 0)) {
      errors.push('three_second not_run must have zero recall counts');
    }
  }
  if (section?.status === 'passed') {
    if (sampleSize < 1) errors.push('three_second passed requires sample_size >= 1');
    if (!section.evidence_refs?.length) errors.push('three_second passed requires evidence_refs');
  }
}

function validateTaskEvidence(root, result, evidenceOwners, errors) {
  for (const binding of result.evidence_refs || []) {
    const key = `${binding.ref}\0${binding.sha256}`;
    const owner = evidenceOwners.get(key);
    if (owner && owner !== result.task_id) {
      errors.push(
        `task_observation evidence ${binding.ref} cannot support multiple task ids`
      );
    } else {
      evidenceOwners.set(key, result.task_id);
    }
    try {
      const evidence = readRegularFile(
        root,
        binding.ref,
        `task ${result.task_id || 'unknown'} evidence`
      );
      if (sha256(evidence.bytes) !== binding.sha256) {
        errors.push(
          `task ${result.task_id || 'unknown'} evidence SHA-256 mismatch: `
          + binding.ref
        );
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
}

export function summarizeTaskObservation(section) {
  if (!section) {
    return {
      status: 'not_claimed',
      observed_task_count: 0,
      successful_task_count: 0,
      failed_task_count: 0,
      rejected_task_count: 0,
      terminal_task_ids: []
    };
  }
  const results = section.task_results || [];
  const successors = new Map();
  for (const result of results) {
    const target = result.rejection_of_task_id || result.supersedes_task_id;
    if (target && !successors.has(target)) successors.set(target, result.task_id);
  }
  const terminal = results.filter((result) => !successors.has(result.task_id));
  const counts = {
    successful_task_count: terminal.filter(
      (result) => result.outcome === 'passed'
    ).length,
    failed_task_count: terminal.filter(
      (result) => result.outcome === 'failed'
    ).length,
    rejected_task_count: terminal.filter(
      (result) => result.outcome === 'rejected'
    ).length
  };
  const status = counts.rejected_task_count
    ? 'rejected'
    : counts.failed_task_count
      ? 'failed'
      : counts.successful_task_count
        ? 'passed'
        : 'not_run';
  return {
    status,
    observed_task_count: terminal.length,
    ...counts,
    terminal_task_ids: terminal.map((result) => result.task_id)
  };
}

function validateTaskObservation(record, root, evaluatorTypes, errors) {
  const section = record.task_observation;
  if (!section) return;
  if (!evaluatorTypes.has('user_observed')
      || section.evaluator_type !== 'user_observed') {
    errors.push(
      'task_observation requires evaluator_types to include user_observed'
    );
  }
  const results = section.task_results || [];
  const ids = new Set();
  const resultById = new Map();
  const successors = new Map();
  const evidenceOwners = new Map();
  for (const [index, result] of results.entries()) {
    if (!result.task_id || ids.has(result.task_id)) {
      errors.push('task_observation task ids must be unique');
    } else {
      ids.add(result.task_id);
      resultById.set(result.task_id, result);
    }
    if (result.artifact_sha256 !== record.artifact_sha256) {
      errors.push(
        `task ${result.task_id || index} artifact_sha256 must match the `
        + 'current evaluated artifact'
      );
    }
    if (Number.isNaN(Date.parse(result.observed_at))) {
      errors.push(`task ${result.task_id || index} observed_at must be ISO-8601`);
    }
    validateTaskEvidence(root, result, evidenceOwners, errors);
    const relationFields = [
      result.rejection_of_task_id ? 'rejection_of_task_id' : null,
      result.supersedes_task_id ? 'supersedes_task_id' : null
    ].filter(Boolean);
    if (relationFields.length > 1) {
      errors.push(`task ${result.task_id || index} may declare only one relation`);
      continue;
    }
    const field = relationFields[0];
    if (!field) continue;
    const targetId = result[field];
    const target = resultById.get(targetId);
    if (!target || targetId === result.task_id) {
      errors.push(
        `task ${result.task_id || index} relation target must be a distinct `
        + 'earlier task'
      );
      continue;
    }
    if (successors.has(targetId)) {
      errors.push(`task ${targetId} may have only one rejection or supersession`);
      continue;
    }
    if (field === 'rejection_of_task_id'
        && (result.outcome !== 'rejected' || target.outcome !== 'passed')) {
      errors.push(
        `task ${result.task_id || index} rejection must target an earlier `
        + 'passed task'
      );
      continue;
    }
    if (field === 'supersedes_task_id'
        && (result.outcome === 'passed' || target.outcome === 'passed')) {
      errors.push(
        `task ${result.task_id || index} supersession is limited to `
        + 'non-passed tasks'
      );
      continue;
    }
    if (target.artifact_sha256 !== result.artifact_sha256) {
      errors.push(
        `task ${result.task_id || index} relation cannot cross artifact digests`
      );
      continue;
    }
    successors.set(targetId, result.task_id);
  }

  for (const start of results) {
    const seen = new Set();
    let current = start.task_id;
    while (successors.has(current)) {
      if (seen.has(current)) {
        errors.push('task_observation relation graph cannot contain cycles');
        break;
      }
      seen.add(current);
      current = successors.get(current);
    }
  }
  const summary = summarizeTaskObservation(section);
  for (const field of [
    'observed_task_count',
    'successful_task_count',
    'failed_task_count',
    'rejected_task_count',
    'status'
  ]) {
    if (section[field] !== summary[field]) {
      errors.push(
        `task_observation ${field} must equal derived value `
        + JSON.stringify(summary[field])
      );
    }
  }
}

function loadDirectionComparison(root, section, errors) {
  let file;
  try {
    file = readJsonFile(root, section.direction_comparison_ref, 'direction comparison');
  } catch (error) {
    errors.push(error.message);
    return null;
  }
  addSchemaErrors(directionSchema, file.value, 'direction-comparison', errors);
  if (sha256(file.bytes) !== section.direction_comparison_sha256) {
    errors.push('blinded_preference direction_comparison_sha256 mismatch');
  }
  const directions = file.value?.directions;
  if (!Array.isArray(directions) || directions.length !== 2) {
    errors.push('blinded_preference direction comparison must contain exactly two directions');
    return file.value;
  }
  for (const direction of directions) {
    try {
      const preview = readRegularFile(
        root,
        direction.preview_ref,
        `direction ${direction.id || 'unknown'} preview`
      );
      if (sha256(preview.bytes) !== direction.preview_sha256) {
        errors.push(`direction ${direction.id || 'unknown'} preview_sha256 mismatch`);
      }
      const decoded = decodePng(preview.bytes);
      if (!decoded) {
        errors.push(`direction ${direction.id || 'unknown'} preview must be a complete decodable PNG`);
      } else if (decoded.width !== direction.preview_frame?.width
          || decoded.height !== direction.preview_frame?.height) {
        errors.push(`direction ${direction.id || 'unknown'} preview dimensions mismatch`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  return file.value;
}

export function summarizeDesignEvaluation(record) {
  const votes = record?.blinded_preference?.votes || { A: 0, B: 0, tie: 0 };
  const validVotes = votes.A + votes.B;
  const winner = votes.A === votes.B ? null : (votes.A > votes.B ? 'A' : 'B');
  return {
    three_second: {
      sample_size: record?.three_second?.sample_size || 0,
      recall_rates: Object.fromEntries(
        Object.entries(record?.three_second?.recall || {}).map(([key, value]) => [
          key,
          record.three_second.sample_size
            ? value / record.three_second.sample_size
            : null
        ])
      )
    },
    blinded_preference: {
      sample_size: record?.blinded_preference?.sample_size || 0,
      valid_votes: validVotes,
      winner,
      win_rate: validVotes ? Math.max(votes.A, votes.B) / validVotes : null
    },
    task_observation: summarizeTaskObservation(record?.task_observation)
  };
}

export function validateDesignEvaluation(directory, options = {}) {
  const errors = [];
  if (!existsSync(directory)) return ['artifact directory does not exist'];
  const root = realpathSync(directory);
  const evaluationRef = options.evaluationRef || 'design-evaluation.json';
  let recordFile;
  let record;
  try {
    recordFile = readJsonFile(root, evaluationRef, 'design evaluation');
    record = recordFile.value;
  } catch (error) {
    return [error.message];
  }
  addSchemaErrors(evaluationSchema, record, 'design-evaluation', errors);

  let manifest = null;
  let policy = null;
  if (existsSync(resolve(root, 'manifest.json'))) {
    try {
      manifest = readJsonFile(root, 'manifest.json', 'manifest').value;
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (!manifest) errors.push('manifest.json is required for design evaluation');
  if (manifest && ![
    'dashboard',
    'ppt-handoff',
    'html-deck',
    'poster'
  ].includes(manifest.artifact_type)) {
    errors.push(`design evaluation does not support artifact_type=${manifest.artifact_type}`);
  }

  try {
    const artifact = readRegularFile(root, record.artifact_ref, 'evaluated artifact');
    if (sha256(artifact.bytes) !== record.artifact_sha256) errors.push('artifact_sha256 mismatch');
  } catch (error) {
    errors.push(error.message);
  }

  const policyRoot = resolve(options.policyRoot || root);
  try {
    const policyFile = readJsonFile(policyRoot, record.policy_ref, 'evaluation policy');
    policy = policyFile.value;
    if (sha256(policyFile.bytes) !== record.policy_sha256) errors.push('policy_sha256 mismatch');
    addSchemaErrors(policySchema, policy, 'evaluation-policy', errors);
  } catch (error) {
    errors.push(error.message);
  }

  const evaluatorTypes = new Set(record.evaluator_types || []);
  for (const section of [record.three_second, record.blinded_preference]) {
    if (section?.evaluator_type && !evaluatorTypes.has(section.evaluator_type)) {
      errors.push(`evaluator_types must include ${section.evaluator_type}`);
    }
  }
  validateTaskObservation(record, root, evaluatorTypes, errors);
  if (!record.three_second || !record.blinded_preference) {
    errors.push('three_second and blinded_preference sections are required');
  } else {
    validateThreeSecond(record, root, errors);
    const preference = record.blinded_preference;
    const hasComparisonRef = preference.direction_comparison_ref
      || preference.direction_comparison_sha256;
    let comparison = null;
    if (hasComparisonRef) {
      if (!preference.direction_comparison_ref
          || !preference.direction_comparison_sha256) {
        errors.push(
          'blinded_preference direction comparison requires ref and sha256 together'
        );
      } else {
        comparison = loadDirectionComparison(root, preference, errors);
      }
    }
    const votes = preference.votes || {};
    const voteTotal = (votes.A || 0) + (votes.B || 0) + (votes.tie || 0);
    if (voteTotal !== preference.sample_size) {
      errors.push('blinded_preference vote total must equal sample_size');
    }
    validateEvidenceRefs(root, preference.evidence_refs, 'blinded_preference', errors);
    if (preference.status === 'not_run') {
      if (preference.sample_size !== 0) errors.push('blinded_preference not_run must have sample_size=0');
      if (voteTotal !== 0) errors.push('blinded_preference not_run must have zero votes');
    }
    if (['passed', 'failed'].includes(preference.status)) {
      if (!hasComparisonRef) {
        errors.push(
          `blinded_preference ${preference.status} requires direction comparison`
        );
      }
      if (preference.sample_size < 1) {
        errors.push(
          `blinded_preference ${preference.status} requires sample_size >= 1`
        );
      }
      if (!preference.evidence_refs?.length) {
        errors.push(
          `blinded_preference ${preference.status} requires evidence_refs`
        );
      }
    }
    if (preference.status === 'passed') {
      if (policy?.status !== 'calibrated') {
        errors.push('blinded_preference passed requires a calibrated evaluation policy');
      }
      if (!preference.randomized_order) errors.push('blinded_preference passed requires randomized_order=true');
      if (!preference.anonymized) errors.push('blinded_preference passed requires anonymized=true');
      if (!preference.randomization_seed) errors.push('blinded_preference passed requires randomization_seed');
      if (votes.A === votes.B) errors.push('blinded_preference passed requires a non-tied winner');
    }
    if (comparison && comparison.directions?.some((direction) => !direction?.id)) {
      errors.push('direction comparison directions must each have an id');
    }
  }

  if (record.baseline) {
    try {
      const baseline = readRegularFile(root, record.baseline.ref, 'baseline artifact');
      if (sha256(baseline.bytes) !== record.baseline.sha256) errors.push('baseline.sha256 mismatch');
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (options.requireComplete) {
    if (policy?.status !== 'calibrated') {
      errors.push('--require-complete requires a calibrated evaluation policy');
    }
    for (const [name, section] of [
      ['three_second', record.three_second],
      ['blinded_preference', record.blinded_preference]
    ]) {
      if (section?.status !== 'passed') {
        errors.push(`--require-complete requires ${name}.status=passed`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const directory = process.argv[2];
  if (!directory) {
    console.error('Usage: node scripts/validate-design-evaluation.mjs <artifact-dir> [--evaluation=<ref>] [--policy-root=<path>] [--require-complete]');
    process.exit(2);
  }
  const option = (name) => process.argv.find(
    (arg) => arg.startsWith(`--${name}=`)
  )?.slice(name.length + 3);
  const errors = validateDesignEvaluation(directory, {
    evaluationRef: option('evaluation'),
    policyRoot: option('policy-root'),
    requireComplete: process.argv.includes('--require-complete')
  });
  if (errors.length) {
    console.error('Design evaluation validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  const record = readJsonFile(
    realpathSync(directory),
    option('evaluation') || 'design-evaluation.json',
    'design evaluation'
  ).value;
  console.log(`Design evaluation validation passed: ${directory}`);
  console.log(JSON.stringify(summarizeDesignEvaluation(record), null, 2));
}
