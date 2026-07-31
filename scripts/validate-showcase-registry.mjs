#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';
import { computeArtifactDigest } from './validate-evidence-contract.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const caseSchema = JSON.parse(readFileSync(resolve(skillRoot, 'schemas/showcase-case.schema.json'), 'utf8'));
const shaPattern = /^[a-f0-9]{64}$/;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function inside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function safeExisting(root, ref, kind) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).some((part) => part === '..')) return null;
  const candidate = resolve(root, ref);
  if (!inside(root, candidate) || !existsSync(candidate) || lstatSync(candidate).isSymbolicLink()) return null;
  const real = realpathSync(candidate);
  if (!inside(root, real)) return null;
  const metadata = statSync(real);
  if (kind === 'file' && !metadata.isFile()) return null;
  if (kind === 'directory' && !metadata.isDirectory()) return null;
  return real;
}

function readBoundFile(root, binding, label, errors) {
  const path = safeExisting(root, binding?.ref, 'file');
  if (!path) {
    errors.push(`${label} is missing or unsafe: ${binding?.ref || '(missing)'}`);
    return null;
  }
  const digest = sha256(readFileSync(path));
  if (!shaPattern.test(String(binding?.sha256 || '')) || digest !== binding.sha256) {
    errors.push(`${label} SHA-256 mismatch: ${binding?.ref}`);
  }
  return path;
}

export function validateShowcaseRegistry(registry, root) {
  const errors = [];
  const canonicalRoot = realpathSync(root);
  if (registry?.schema_version !== 'design-showcase-registry/v1') errors.push('registry schema_version must be design-showcase-registry/v1');
  if (!String(registry?.fixture_policy || '').match(/fixtures?.*(not|aren't|are not).*production|not production/i)) errors.push('fixture_policy must state fixtures are not production showcases');
  const gaps = (registry?.coverage_gaps || []).join(' ').toLowerCase();
  for (const type of ['report', 'dashboard', 'poster']) if (!gaps.includes(type)) errors.push(`coverage_gaps must explicitly address ${type}`);
  const ids = new Set();
  for (const [index, item] of (registry?.showcases || []).entries()) {
    const id = item?.id || `showcases[${index}]`;
    if (!item?.id || ids.has(item.id)) errors.push(`showcases[${index}] has missing or duplicate id`);
    ids.add(item?.id);
    if (!['validated_vertical_slice', 'reviewed_production_case'].includes(item?.production_status)) errors.push(`showcase ${id} has ineligible production_status`);
    if (!item?.review_scope) errors.push(`showcase ${id} requires review_scope`);
    if (!Array.isArray(item?.surface_evidence) || item.surface_evidence.length < 2) errors.push(`showcase ${id} requires surface_evidence`);
    const casePath = safeExisting(canonicalRoot, item?.case_ref, 'file');
    if (!casePath) {
      errors.push(`showcase ${id} case evidence is missing or unsafe: ${item?.case_ref || '(missing)'}`);
      continue;
    }
    let caseRecord;
    try {
      caseRecord = JSON.parse(readFileSync(casePath, 'utf8'));
    } catch (error) {
      errors.push(`showcase ${id} case JSON is invalid: ${error.message}`);
      continue;
    }
    errors.push(...validateJsonInstance(caseSchema, caseRecord).map((error) => `showcase ${id} case ${error}`));
    if (caseRecord.id !== item.id || caseRecord.artifact_type !== item.artifact_type
        || caseRecord.template_id !== item.template_id) {
      errors.push(`showcase ${id} registry/case identity mismatch`);
    }
    if (caseRecord.artifact_ref !== item.artifact_ref) errors.push(`showcase ${id} registry/case artifact_ref mismatch`);
    if (stable([...(caseRecord.surface_evidence || [])].sort())
        !== stable([...(item.surface_evidence || [])].sort())) {
      errors.push(`showcase ${id} registry/case surface_evidence mismatch`);
    }
    const artifactPath = safeExisting(canonicalRoot, caseRecord.artifact_ref, 'directory');
    if (!artifactPath) {
      errors.push(`showcase ${id} artifact_ref is missing or unsafe: ${caseRecord.artifact_ref || '(missing)'}`);
    } else {
      try {
        if (computeArtifactDigest(artifactPath) !== caseRecord.artifact_binding?.artifact_digest) {
          errors.push(`showcase ${id} artifact digest drift`);
        }
      } catch (error) {
        errors.push(`showcase ${id} artifact digest failed: ${error.message}`);
      }
    }

    const sourceBindings = caseRecord.artifact_binding?.source_bindings || [];
    if (stable(sourceBindings.map((binding) => binding.ref).sort())
        !== stable([...(caseRecord.source_refs || [])].sort())) {
      errors.push(`showcase ${id} source refs are not exactly bound`);
    }
    for (const binding of sourceBindings) readBoundFile(canonicalRoot, binding, `showcase ${id} source evidence`, errors);

    const surfaceBindings = caseRecord.artifact_binding?.surface_bindings || [];
    if (stable(surfaceBindings.map((binding) => binding.ref).sort())
        !== stable([...(caseRecord.surface_evidence || [])].sort())) {
      errors.push(`showcase ${id} surface refs are not exactly bound`);
    }
    for (const binding of surfaceBindings) {
      readBoundFile(canonicalRoot, binding, `showcase ${id} surface evidence`, errors);
      if (Number.isNaN(Date.parse(binding.captured_at))) errors.push(`showcase ${id} surface captured_at must be an ISO timestamp`);
    }
    const surfaceDigest = sha256(stable(surfaceBindings));

    if (caseRecord.assurance?.structure_passed !== 'passed'
        || caseRecord.assurance?.evidence_traced !== 'passed'
        || caseRecord.assurance?.visually_reviewed !== 'passed') {
      errors.push(`showcase ${id} lacks required passed structure, evidence, or visual assurance`);
    }
    const review = caseRecord.review_binding;
    if (review?.status !== 'approved') errors.push(`showcase ${id} review status must be approved`);
    if (review?.artifact_digest !== caseRecord.artifact_binding?.artifact_digest) errors.push(`showcase ${id} review artifact digest mismatch`);
    if (review?.surface_evidence_digest !== surfaceDigest) errors.push(`showcase ${id} review surface evidence digest mismatch`);
    if (Number.isNaN(Date.parse(review?.reviewed_at))) {
      errors.push(`showcase ${id} review reviewed_at must be an ISO timestamp`);
    } else if (surfaceBindings.some((binding) => Date.parse(binding.captured_at) > Date.parse(review.reviewed_at))) {
      errors.push(`showcase ${id} review is stale relative to surface evidence`);
    }
    const reviewPath = safeExisting(canonicalRoot, review?.review_evidence_ref, 'file');
    if (!reviewPath) {
      errors.push(`showcase ${id} review evidence is missing or unsafe`);
    } else {
      const reviewDigest = sha256(readFileSync(reviewPath));
      if (reviewDigest !== review.review_evidence_sha256) errors.push(`showcase ${id} review evidence SHA-256 mismatch`);
      try {
        const reviewEvidence = JSON.parse(readFileSync(reviewPath, 'utf8'));
        if (reviewEvidence.schema_version !== 'design-showcase-review/v1'
            || reviewEvidence.status !== review.status
            || reviewEvidence.reviewer_id !== review.reviewer_id
            || reviewEvidence.reviewed_at !== review.reviewed_at
            || reviewEvidence.artifact_digest !== review.artifact_digest
            || reviewEvidence.surface_evidence_digest !== review.surface_evidence_digest) {
          errors.push(`showcase ${id} review evidence binding mismatch`);
        }
      } catch (error) {
        errors.push(`showcase ${id} review evidence is invalid JSON: ${error.message}`);
      }
    }
    if (!Array.isArray(caseRecord.non_claims) || !caseRecord.non_claims.length) errors.push(`showcase ${id} requires explicit non_claims`);
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const root = resolve(process.argv[2] || '.');
  const path = resolve(root, 'showcases/registry.json');
  if (!existsSync(path)) { console.error('Missing showcases/registry.json'); process.exit(1); }
  const errors = validateShowcaseRegistry(JSON.parse(readFileSync(path, 'utf8')), root);
  if (errors.length) {
    console.error('Showcase registry validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('Showcase registry validation passed.');
}
