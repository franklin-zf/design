#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { hexSetInSource } from './lib/design-tokens.mjs';

const HEX = /^#[0-9a-f]{6}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const SCHEMA_VERSION = 'design-spec-record/v1';
const CASE_SCHEMA_VERSION = 'design-case-record/v1';
const ARTIFACT_TYPES = new Set([
  'data-report', 'dashboard', 'chart-frame', 'poster', 'html-deck', 'ppt-handoff',
  'screenshot-evidence', 'tweakable-artifact', 'design-system', 'multi-artifact'
]);
const EXPERIENCE_MODES = new Set(['static', 'expressive', 'navigational', 'consequential']);
const RISK_LANES = new Set(['express', 'standard', 'assured']);
const CASE_JUDGMENT_STATUSES = new Set([
  'candidate', 'reviewer_confirmed', 'user_validated', 'deprecated'
]);
const CREATIVE_BASES = new Set([
  'external_reference', 'knowledge_recombination', 'content_native'
]);

function readJson(path, errors, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label}: unreadable or invalid JSON (${error.message})`);
    return null;
  }
}

function withinRoot(skillRoot, relPath) {
  const abs = resolve(skillRoot, relPath);
  const rel = relative(skillRoot, abs);
  return rel === '' || (!rel.startsWith('..') && !rel.split(sep).includes('..'));
}

function digestFile(absPath) {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}

function validateRecord(record, { recordPath, skillRoot, errors }) {
  const where = recordPath || record?.id || 'record';
  const push = (msg) => errors.push(`${where}: ${msg}`);

  if (!record || typeof record !== 'object') return push('record is not an object');
  if (record.schema_version !== SCHEMA_VERSION) push(`schema_version must be ${SCHEMA_VERSION}`);
  if (record.record_type !== 'design_spec_record') push('record_type must be design_spec_record');
  if (!record.id || typeof record.id !== 'string') push('id is required');
  if (!record.created_at) push('created_at is required');
  if (!Array.isArray(record.non_claims) || record.non_claims.length === 0) {
    push('non_claims must be a non-empty array (state what this record does NOT prove)');
  }

  // Classification
  const c = record.classification;
  if (!c || typeof c !== 'object') push('classification is required');
  else {
    if (!c.project_type) push('classification.project_type is required');
    if (!ARTIFACT_TYPES.has(c.artifact_type)) push(`classification.artifact_type invalid: ${c.artifact_type}`);
    if (!EXPERIENCE_MODES.has(c.experience_mode)) push(`classification.experience_mode invalid: ${c.experience_mode}`);
    if (!RISK_LANES.has(c.risk_lane)) push(`classification.risk_lane invalid: ${c.risk_lane}`);
  }

  // Source / provenance
  const s = record.source;
  if (!s || typeof s !== 'object') push('source is required');
  else {
    if (!['artifact', 'design-system'].includes(s.kind)) push('source.kind must be artifact or design-system');
    if (!s.ref) push('source.ref is required');
    if (!s.tokens_ref) push('source.tokens_ref is required (extracted values must trace to tokens)');
    if (s.artifact_digest && !SHA256.test(s.artifact_digest)) push('source.artifact_digest must be a 64-hex sha256');
    for (const key of ['ref', 'tokens_ref', 'review_ref']) {
      const v = s[key];
      if (!v) continue;
      if (v.startsWith('/') || v.startsWith('~') || /^[A-Za-z]:/.test(v)) push(`source.${key} must be a relative path: ${v}`);
      else if (!withinRoot(skillRoot, v)) push(`source.${key} escapes skill root: ${v}`);
      else if (!existsSync(resolve(skillRoot, v))) push(`source.${key} does not exist: ${v}`);
    }
  }

  // Extracted values: must be present and, when tokens exist, match them exactly (no fabrication).
  const e = record.extracted;
  if (!e || typeof e !== 'object') return push('extracted is required');
  if (!e.colors || Object.keys(e.colors).length === 0) push('extracted.colors must be non-empty');
  const tokensAbs = s?.tokens_ref && withinRoot(skillRoot, s.tokens_ref)
    ? resolve(skillRoot, s.tokens_ref)
    : null;
  let tokens = null;
  let tokenColorHex = new Set();
  if (tokensAbs && existsSync(tokensAbs)) {
    tokenColorHex = hexSetInSource(tokensAbs);
    if (s.tokens_ref.endsWith('.json')) {
      try {
        tokens = JSON.parse(readFileSync(tokensAbs, 'utf8'));
      } catch {
        tokens = null;
      }
    }
  }
  for (const [role, entry] of Object.entries(e.colors || {})) {
    const val = entry && typeof entry === 'object' ? entry.value : entry;
    if (typeof val !== 'string' || !HEX.test(val)) {
      push(`extracted.colors.${role} must be a #rrggbb hex, got ${JSON.stringify(val)}`);
      continue;
    }
    if (tokenColorHex.size > 0 && !tokenColorHex.has(val.toLowerCase())) {
      push(`extracted.colors.${role}=${val} not present in ${s.tokens_ref}; extracted values must match tokens exactly`);
    }
  }
  if (!e.typography || Object.keys(e.typography).length === 0) push('extracted.typography must be non-empty');
  if (!e.spacing || Object.keys(e.spacing).length === 0) push('extracted.spacing must be non-empty');
  // Typography/spacing must also trace to tokens where comparable keys exist.
  if (tokens) {
    for (const [k, v] of Object.entries(e.typography || {})) {
      if (tokens.typography && tokens.typography[k] !== undefined && tokens.typography[k] !== v) {
        push(`extracted.typography.${k}="${v}" does not match tokens.typography.${k}="${tokens.typography[k]}"`);
      }
    }
    for (const [k, v] of Object.entries(e.spacing || {})) {
      if (tokens.spacing && tokens.spacing[k] !== undefined && tokens.spacing[k] !== v) {
        push(`extracted.spacing.${k}="${v}" does not match tokens.spacing.${k}="${tokens.spacing[k]}"`);
      }
    }
  }

  // Judgment: reviewer_confirmed requires independent review binding; values are never auto-judged.
  const j = record.judgment;
  if (!j || typeof j !== 'object') return push('judgment is required');
  if (!['candidate', 'reviewer_confirmed'].includes(j.status)) push('judgment.status must be candidate or reviewer_confirmed');
  if (j.status === 'reviewer_confirmed') {
    if (!j.reviewer || typeof j.reviewer !== 'string') push('reviewer_confirmed judgment requires a named reviewer');
    if (!j.review_ref) push('reviewer_confirmed judgment requires judgment.review_ref (independent review evidence)');
    if (j.review_ref) {
      if (j.review_ref.startsWith('/') || j.review_ref.startsWith('~')) push('judgment.review_ref must be relative');
      else if (!withinRoot(skillRoot, j.review_ref)) push(`judgment.review_ref escapes skill root: ${j.review_ref}`);
      else if (!existsSync(resolve(skillRoot, j.review_ref))) push(`judgment.review_ref does not exist: ${j.review_ref}`);
    }
    if (!j.why_it_works || !j.why_it_works.trim()) push('reviewer_confirmed judgment requires why_it_works (reviewer-confirmed rationale)');
    if (!j.signature_move || !j.signature_move.move) push('reviewer_confirmed judgment requires signature_move.move');
  }
}

function validatePrimitives(doc, { skillRoot, errors }) {
  const where = doc?.id || 'primitives';
  const push = (msg) => errors.push(`${where}: ${msg}`);
  if (!doc || typeof doc !== 'object') return push('document is not an object');
  if (doc.schema_version !== 'design-primitives/v1') push('schema_version must be design-primitives/v1');
  if (doc.status !== 'candidate') push('status must be candidate (subjective labels are confirmed only on reviewer-bound spec records)');

  const src = doc.source;
  if (!src || !src.tokens_ref) {
    push('source.tokens_ref is required');
    return;
  }
  const tokensAbs = resolve(skillRoot, src.tokens_ref);
  if (!existsSync(tokensAbs)) {
    push(`source.tokens_ref does not exist: ${src.tokens_ref}`);
    return;
  }
  const hexSet = hexSetInSource(tokensAbs);
  for (const c of doc.colors || []) {
    if (!HEX.test(c.value)) push(`colors.${c.role} must be #rrggbb, got ${JSON.stringify(c.value)}`);
    else if (!hexSet.has(c.value)) push(`colors.${c.role}=${c.value} not present in ${src.tokens_ref}`);
  }
  const roles = new Set((doc.colors || []).map((c) => c.role));
  for (const pair of doc.color_pairings || []) {
    if (pair.basis !== 'token-role-cooccurrence') push(`pairing ${pair.id} basis must be token-role-cooccurrence`);
    for (const key of ['fg', 'bg']) {
      if (!HEX.test(pair[key])) push(`pairing ${pair.id}.${key} must be #rrggbb`);
      else if (!hexSet.has(pair[key])) push(`pairing ${pair.id}.${key}=${pair[key]} not present in ${src.tokens_ref}`);
    }
    if (!roles.has(pair.fg_role)) push(`pairing ${pair.id}.fg_role ${pair.fg_role} is not a defined color role`);
    if (!roles.has(pair.bg_role)) push(`pairing ${pair.id}.bg_role ${pair.bg_role} is not a defined color role`);
  }
  if (src.tokens_ref.endsWith('.json')) {
    let tokens = null;
    try { tokens = JSON.parse(readFileSync(tokensAbs, 'utf8')); } catch { tokens = null; }
    if (tokens) {
      for (const [k, v] of Object.entries(doc.typography || {})) {
        if (tokens.typography && tokens.typography[k] !== undefined && tokens.typography[k] !== v) {
          push(`typography.${k}="${v}" does not match tokens.typography.${k}="${tokens.typography[k]}"`);
        }
      }
      const scaleValues = new Set((doc.spacing_scale || []).map((e) => e.value));
      for (const [k, v] of Object.entries(tokens.spacing || {})) {
        if (!scaleValues.has(v)) push(`spacing_scale omits tokens.spacing.${k}="${v}"`);
      }
    }
  }
  if (!Array.isArray(doc.spacing_scale) || doc.spacing_scale.length === 0) push('spacing_scale must be non-empty');
  if (!doc.structural_facts || typeof doc.structural_facts.zero_radius !== 'boolean') push('structural_facts.zero_radius boolean is required');
  if (!Array.isArray(doc.non_claims) || doc.non_claims.length === 0) push('non_claims must be non-empty');
}

function validateCaseRecord(record, { recordPath, skillRoot, errors }) {
  const where = recordPath || record?.id || 'case';
  const push = (msg) => errors.push(`${where}: ${msg}`);

  if (!record || typeof record !== 'object') return push('case is not an object');
  if (record.schema_version !== CASE_SCHEMA_VERSION) push(`schema_version must be ${CASE_SCHEMA_VERSION}`);
  if (record.record_type !== 'design_case_record') push('record_type must be design_case_record');
  if (!record.id || typeof record.id !== 'string') push('id is required');
  if (!record.created_at) push('created_at is required');
  if (!Array.isArray(record.non_claims) || record.non_claims.length === 0) {
    push('non_claims must be a non-empty array');
  }

  const c = record.classification;
  if (!c || typeof c !== 'object') push('classification is required');
  else {
    if (!c.project_type) push('classification.project_type is required');
    if (!ARTIFACT_TYPES.has(c.artifact_type)) push(`classification.artifact_type invalid: ${c.artifact_type}`);
    if (!EXPERIENCE_MODES.has(c.experience_mode)) push(`classification.experience_mode invalid: ${c.experience_mode}`);
    if (!RISK_LANES.has(c.risk_lane)) push(`classification.risk_lane invalid: ${c.risk_lane}`);
  }

  const source = record.source;
  if (!source || typeof source !== 'object') push('source is required');
  else {
    if (!['sanitized', 'public', 'private_local'].includes(source.mode)) push('source.mode is invalid');
    if (!source.artifact_ref) push('source.artifact_ref is required');
    if (!SHA256.test(source.artifact_digest || '')) push('source.artifact_digest must be a 64-hex sha256');
    if (!Array.isArray(source.source_materials) || source.source_materials.length === 0) {
      push('source.source_materials must be a non-empty array');
    }
    if (!['none', 'redacted', 'sensitive_local_only'].includes(source.sensitivity)) push('source.sensitivity is invalid');
    if (!['owned', 'permissioned', 'public_licensed', 'unknown'].includes(source.license)) push('source.license is invalid');
    for (const key of ['artifact_ref']) {
      const value = source[key];
      if (!value) continue;
      if (value.startsWith('/') || value.startsWith('~') || /^[A-Za-z]:/.test(value)) push(`source.${key} must be relative`);
      else if (!withinRoot(skillRoot, value)) push(`source.${key} escapes skill root`);
      else if (!existsSync(resolve(skillRoot, value))) push(`source.${key} does not exist: ${value}`);
    }
    for (const item of source.source_materials || []) {
      if (!item || typeof item !== 'object') { push('source.source_materials entries must be objects'); continue; }
      if (!item.ref || item.ref.startsWith('/') || item.ref.startsWith('~') || /^[A-Za-z]:/.test(item.ref)) {
        push('source.source_materials.ref must be relative');
      } else if (!withinRoot(skillRoot, item.ref)) {
        push(`source.source_materials.ref escapes skill root: ${item.ref}`);
      } else if (!existsSync(resolve(skillRoot, item.ref))) {
        push(`source.source_materials.ref does not exist: ${item.ref}`);
      }
      if (!SHA256.test(item.sha256 || '')) push(`source.source_materials.sha256 invalid: ${item.ref || '<missing>'}`);
    }
  }

  const readerJob = record.reader_job;
  if (!readerJob || !readerJob.statement || !readerJob.scenario) push('reader_job.statement and reader_job.scenario are required');

  const decisions = record.design_decisions;
  if (!decisions || typeof decisions !== 'object') push('design_decisions is required');
  else {
    for (const key of ['visual_thesis', 'content_tension', 'selected_direction', 'restraint_rule']) {
      if (!decisions[key] || typeof decisions[key] !== 'string') push(`design_decisions.${key} is required`);
    }
    if (!Array.isArray(decisions.creative_basis) || decisions.creative_basis.length === 0) {
      push('design_decisions.creative_basis must be non-empty');
    } else {
      for (const basis of decisions.creative_basis) if (!CREATIVE_BASES.has(basis)) push(`design_decisions.creative_basis invalid: ${basis}`);
    }
    if (!Array.isArray(decisions.rejected_directions)) push('design_decisions.rejected_directions must be an array');
  }

  const evaluation = record.evaluation;
  if (!evaluation || typeof evaluation !== 'object') push('evaluation is required');
  else {
    for (const key of ['three_second', 'preference']) {
      const result = evaluation[key];
      if (!result || !['not_run', 'passed', 'failed'].includes(result.status)) push(`evaluation.${key}.status is invalid`);
      if (!Array.isArray(result?.evidence_refs)) push(`evaluation.${key}.evidence_refs must be an array`);
    }
    if (!Array.isArray(evaluation.evaluator_types)) push('evaluation.evaluator_types must be an array');
    else for (const type of evaluation.evaluator_types) {
      if (!['model_panel', 'human_panel', 'user_observed'].includes(type)) push(`evaluation.evaluator_types invalid: ${type}`);
    }
  }

  const judgment = record.judgment;
  if (!judgment || !CASE_JUDGMENT_STATUSES.has(judgment.status)) push('judgment.status is invalid');
  if (['reviewer_confirmed', 'user_validated'].includes(judgment?.status)) {
    if (!judgment.reviewer) push('reviewed case requires judgment.reviewer');
    if (!judgment.review_ref) push('reviewed case requires judgment.review_ref');
    else if (!withinRoot(skillRoot, judgment.review_ref) || !existsSync(resolve(skillRoot, judgment.review_ref))) {
      push(`judgment.review_ref does not exist: ${judgment.review_ref}`);
    }
  }

  const lessons = record.lessons;
  if (!lessons || typeof lessons !== 'object') push('lessons is required');
  else {
    for (const key of ['reusable_rules', 'anti_patterns', 'reuse_boundary']) {
      if (!Array.isArray(lessons[key]) || lessons[key].length === 0) push(`lessons.${key} must be non-empty`);
    }
    if (!['not_ready', 'candidate', 'promoted', 'deprecated'].includes(lessons.standard_promotion)) {
      push('lessons.standard_promotion is invalid');
    }
  }
}

function validateEvaluationPolicy(policy, { errors }) {
  const push = (msg) => errors.push(`evaluation-policy: ${msg}`);
  if (!policy || typeof policy !== 'object') return push('document is not an object');
  if (policy.schema_version !== 'design-evaluation-policy/v1') {
    push('schema_version must be design-evaluation-policy/v1');
  }
  if (!['calibration_required', 'calibrated'].includes(policy.status)) {
    push('status must be calibration_required or calibrated');
  }
  if (!policy.purpose) push('purpose is required');
  const lanes = policy.required_by_lane;
  if (!lanes || typeof lanes !== 'object') push('required_by_lane is required');
  else {
    for (const lane of ['express', 'standard', 'assured']) {
      if (!Array.isArray(lanes[lane])) push(`required_by_lane.${lane} must be an array`);
      else for (const gate of lanes[lane]) {
        if (!['surface_review', 'three_second', 'blinded_preference', 'independent_review'].includes(gate)) {
          push(`required_by_lane.${lane} contains unsupported gate: ${gate}`);
        }
      }
    }
  }
  if (!Array.isArray(policy.evaluator_types) || policy.evaluator_types.length === 0) {
    push('evaluator_types must be a non-empty array');
  } else {
    for (const type of policy.evaluator_types) {
      if (!['model_panel', 'human_panel', 'user_observed'].includes(type)) {
        push(`evaluator_types contains unsupported type: ${type}`);
      }
    }
    if (new Set(policy.evaluator_types).size !== policy.evaluator_types.length) {
      push('evaluator_types must not contain duplicates');
    }
  }
  const rules = policy.rules;
  if (!rules || typeof rules !== 'object') push('rules is required');
  else {
    for (const key of ['three_second', 'blinded_preference', 'user_validation', 'thresholds']) {
      if (!rules[key]) push(`rules.${key} is required`);
    }
  }
  if (!Array.isArray(policy.non_claims) || policy.non_claims.length === 0) {
    push('non_claims must be a non-empty array');
  }
}

function validateKnowledgeDir(knowledgeDir) {
  const errors = [];
  const inputAbs = resolve(knowledgeDir);
  const rootAbs = inputAbs;
  const skillRoot = isAbsolute(knowledgeDir) && basename(rootAbs) === 'design-knowledge'
    ? dirname(rootAbs)
    : realpathSync(process.cwd());
  const knowledgeRef = basename(rootAbs) === 'design-knowledge'
    ? 'design-knowledge'
    : relative(skillRoot, rootAbs);
  if (!existsSync(rootAbs) || !statSync(rootAbs).isDirectory()) {
    return { ok: false, errors: [`design-knowledge dir not found: ${knowledgeDir}`], records: 0 };
  }

  const registryPath = join(rootAbs, 'registry.json');
  if (!existsSync(registryPath)) {
    return { ok: false, errors: [`missing registry: ${knowledgeDir}/registry.json`], records: 0 };
  }
  const registry = readJson(registryPath, errors, 'registry.json');
  for (const key of ['standards_ref', 'evaluation_policy_ref']) {
    const ref = registry?.[key];
    if (typeof ref !== 'string' || !ref) errors.push(`registry.${key} must be a path string`);
    else if (!existsSync(resolve(skillRoot, ref))) errors.push(`registry.${key} does not exist: ${ref}`);
  }
  const evaluationPolicyPath = join(rootAbs, 'evaluation-policy.json');
  if (!existsSync(evaluationPolicyPath)) {
    errors.push('missing evaluation-policy.json');
  } else {
    const policy = readJson(evaluationPolicyPath, errors, 'evaluation-policy.json');
    if (policy) validateEvaluationPolicy(policy, { errors });
  }
  const registered = new Set(registry?.spec_records || []);

  const recordsDir = join(rootAbs, 'spec-records');
  const onDisk = new Set();
  if (existsSync(recordsDir) && statSync(recordsDir).isDirectory()) {
    for (const file of readdirSync(recordsDir).filter((f) => f.endsWith('.json'))) {
      const rel = `${knowledgeRef.replace(/\/+$/, '')}/spec-records/${file}`;
      onDisk.add(rel);
      const rec = readJson(join(recordsDir, file), errors, `spec-records/${file}`);
      if (rec) validateRecord(rec, { recordPath: `spec-records/${file}`, skillRoot, errors });
    }
  }

  for (const ref of registry?.spec_records || []) {
    if (typeof ref !== 'string') { errors.push('registry.spec_records entries must be path strings'); continue; }
    if (!existsSync(resolve(skillRoot, ref))) errors.push(`registry references missing record: ${ref}`);
    if (!onDisk.has(ref)) errors.push(`registry record not under spec-records/ (or path mismatch): ${ref}`);
  }
  for (const ref of onDisk) {
    if (!registered.has(ref)) errors.push(`record present but not listed in registry: ${ref}`);
  }

  const casesDir = join(rootAbs, 'cases');
  const casesOnDisk = new Set();
  if (existsSync(casesDir) && statSync(casesDir).isDirectory()) {
    for (const file of readdirSync(casesDir).filter((f) => f.endsWith('.json'))) {
      const rel = `${knowledgeRef.replace(/\/+$/, '')}/cases/${file}`;
      casesOnDisk.add(rel);
      const record = readJson(join(casesDir, file), errors, `cases/${file}`);
      if (record) validateCaseRecord(record, { recordPath: `cases/${file}`, skillRoot, errors });
    }
  }
  const registeredCases = new Set(registry?.case_records || []);
  for (const ref of registry?.case_records || []) {
    if (typeof ref !== 'string') { errors.push('registry.case_records entries must be path strings'); continue; }
    if (!existsSync(resolve(skillRoot, ref))) errors.push(`registry references missing case: ${ref}`);
    if (!casesOnDisk.has(ref)) errors.push(`registry case not under cases/ (or path mismatch): ${ref}`);
  }
  for (const ref of casesOnDisk) {
    if (!registeredCases.has(ref)) errors.push(`case present but not listed in registry: ${ref}`);
  }

  const primitivesDir = join(rootAbs, 'primitives');
  const primitivesOnDisk = new Set();
  if (existsSync(primitivesDir) && statSync(primitivesDir).isDirectory()) {
    for (const file of readdirSync(primitivesDir).filter((f) => f.endsWith('.json'))) {
      const rel = `${knowledgeRef.replace(/\/+$/, '')}/primitives/${file}`;
      primitivesOnDisk.add(rel);
      const doc = readJson(join(primitivesDir, file), errors, `primitives/${file}`);
      if (doc) validatePrimitives(doc, { skillRoot, errors });
    }
  }
  const registeredPrimitives = new Set(registry?.primitives || []);
  for (const ref of registry?.primitives || []) {
    if (typeof ref !== 'string') { errors.push('registry.primitives entries must be path strings'); continue; }
    if (!existsSync(resolve(skillRoot, ref))) errors.push(`registry references missing primitives: ${ref}`);
    if (!primitivesOnDisk.has(ref)) errors.push(`registry primitives not under primitives/ (or path mismatch): ${ref}`);
  }
  for (const ref of primitivesOnDisk) {
    if (!registeredPrimitives.has(ref)) errors.push(`primitives present but not listed in registry: ${ref}`);
  }
  return {
    ok: errors.length === 0,
    errors,
    records: onDisk.size,
    cases: casesOnDisk.size,
    primitives: primitivesOnDisk.size
  };
}

// CLI
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const dir = process.argv[2] || 'design-knowledge';
  const result = validateKnowledgeDir(dir);
  if (result.ok) {
    console.log(`Design knowledge validation passed: ${dir} (${result.records} spec record(s), ${result.cases || 0} case(s), ${result.primitives || 0} primitive set(s))`);
    process.exit(0);
  }
  console.error(`Design spec validation failed (${result.errors.length}):`);
  for (const e of result.errors) console.error(`  - ${e}`);
  process.exit(1);
}

export {
  validateCaseRecord,
  validateEvaluationPolicy,
  validateKnowledgeDir,
  validateRecord,
  validatePrimitives
};
