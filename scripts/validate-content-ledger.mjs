#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { validateJsonInstance } from './lib/json-schema.mjs';

const ledgerPath = process.argv[2];
if (!ledgerPath) {
  console.error('Usage: node scripts/validate-content-ledger.mjs <content-ledger.json>');
  process.exit(2);
}

const errors = [];
const resolvedLedger = resolve(ledgerPath);
const ledgerRoot = dirname(resolvedLedger);
const schemaPath = resolve(process.cwd(), 'schemas/content-ledger.schema.json');

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

function resolveInside(root, path) {
  if (typeof path !== 'string' || !path || isAbsolute(path)) return null;
  const candidate = resolve(root, path);
  if (!existsSync(candidate)) return null;
  const realRoot = realpathSync(root);
  const real = realpathSync(candidate);
  const rel = relative(realRoot, real);
  if (rel.startsWith('..') || isAbsolute(rel) || !statSync(real).isFile()) return null;
  return real;
}

function addUniqueId(collection, id, label) {
  if (collection.has(id)) errors.push(`duplicate ${label} id: ${id}`);
  if (collection instanceof Map) collection.set(id, true);
  else collection.add(id);
}

function validateCanonicalEntries(ledger, sourceByRef) {
  const entries = new Map();
  for (const entry of ledger.entries || []) {
    if (entries.has(entry.id)) {
      errors.push(`duplicate content ledger entry id: ${entry.id}`);
      continue;
    }
    entries.set(entry.id, entry);

    const sourcePath = resolveInside(ledgerRoot, entry.source_ref);
    if (!sourcePath) {
      errors.push(`entry ${entry.id} source_ref is not a readable local file: ${entry.source_ref}`);
      continue;
    }
    const bytes = readFileSync(sourcePath);
    const sourceText = bytes.toString('utf8');
    const actualHash = sha256(bytes);
    if (actualHash !== entry.source_sha256) {
      errors.push(`entry ${entry.id} source hash mismatch: expected ${entry.source_sha256}, got ${actualHash}.`);
    }
    if (!sourceText.includes(entry.source_quote)) {
      errors.push(`entry ${entry.id} source_quote is not present in ${entry.source_ref}.`);
    }
    if (entry.source_locator.start > entry.source_locator.end) {
      errors.push(`entry ${entry.id} source_locator.start must be <= source_locator.end.`);
    }
    const sourceLineCount = sourceText.split(/\r?\n/).length;
    if (entry.source_locator.end > sourceLineCount) {
      errors.push(`entry ${entry.id} source_locator.end exceeds source line count.`);
    }
    for (const token of entry.protected_tokens || []) {
      if (!entry.source_quote.includes(token.text)) {
        errors.push(`entry ${entry.id} protected token is absent from source_quote: ${token.text}`);
      }
    }
    sourceByRef.set(entry.source_ref, { path: sourcePath, text: sourceText, hash: actualHash });
  }
  return entries;
}

function validateSourceSnapshot(context, sourceByRef) {
  const source = context.source_snapshot;
  const sourcePath = resolveInside(ledgerRoot, source.source_ref);
  if (!sourcePath) {
    errors.push(`semantic_context.source_snapshot.source_ref is not a readable local file: ${source.source_ref}`);
    return;
  }
  const bytes = readFileSync(sourcePath);
  const actualHash = sha256(bytes);
  if (actualHash !== source.sha256) {
    errors.push(`source snapshot hash mismatch: expected ${source.sha256}, got ${actualHash}.`);
  }
  sourceByRef.set(source.source_ref, {
    path: sourcePath,
    text: bytes.toString('utf8'),
    hash: actualHash
  });
}

function validateSemanticContext(ledger, entries, sourceByRef) {
  const context = ledger.semantic_context;
  if (!context) return;

  validateSourceSnapshot(context, sourceByRef);

  const units = new Map();
  for (const unit of context.semantic_units || []) {
    if (units.has(unit.id)) errors.push(`duplicate semantic unit id: ${unit.id}`);
    units.set(unit.id, unit);
    const entry = entries.get(unit.canonical_entry_id);
    if (!entry) {
      errors.push(`semantic unit ${unit.id} references unknown canonical entry: ${unit.canonical_entry_id}`);
      continue;
    }
    const source = sourceByRef.get(entry.source_ref);
    if (source && !source.text.includes(entry.source_quote)) {
      errors.push(`semantic unit ${unit.id} canonical quote is not present in its source.`);
    }
    const tokenIds = new Set((entry.protected_tokens || []).map((token) => token.id));
    for (const tokenId of unit.protected_token_ids || []) {
      if (!tokenIds.has(tokenId)) {
        errors.push(`semantic unit ${unit.id} references unknown protected token: ${tokenId}`);
      }
    }
    for (const tokenId of unit.protected_token_ids || []) {
      const token = (entry.protected_tokens || []).find((item) => item.id === tokenId);
      if (unit.must_keep && token && !unit.summary_text.includes(token.text)) {
        errors.push(`semantic unit ${unit.id} must_keep summary drops protected token: ${token.text}`);
      }
    }
    if (unit.kind === 'target' && !['target', 'future'].includes(entry.semantic_signature.temporal_status)) {
      errors.push(`semantic unit ${unit.id} target must use a future or target canonical signature.`);
    }
    if (unit.kind === 'plan' && entry.semantic_signature.modality !== 'plan') {
      errors.push(`semantic unit ${unit.id} plan must use modality=plan.`);
    }
    if (unit.kind === 'question' && entry.semantic_signature.modality !== 'question') {
      errors.push(`semantic unit ${unit.id} question must use modality=question.`);
    }
    if (unit.kind === 'question' && entry.semantic_signature.evidence_status !== 'unverified') {
      errors.push(`semantic unit ${unit.id} question must use evidence_status=unverified.`);
    }
    if (unit.evidence_status === 'unknown' && entry.semantic_signature.evidence_status !== 'unverified') {
      errors.push(`semantic unit ${unit.id} unknown evidence cannot use a verified canonical signature.`);
    }
    if (unit.evidence_status === 'computed' && entry.semantic_signature.evidence_status !== 'derived_verified') {
      errors.push(`semantic unit ${unit.id} computed evidence requires derived_verified canonical evidence.`);
    }
  }

  const relationships = new Map();
  for (const relation of context.relationships || []) {
    addUniqueId(relationships, relation.id, 'relationship');
    if (!units.has(relation.from)) errors.push(`relationship ${relation.id} has unknown from: ${relation.from}`);
    if (!units.has(relation.to)) errors.push(`relationship ${relation.id} has unknown to: ${relation.to}`);
    if (relation.type === 'causes' && !['explicit', 'computed'].includes(relation.evidence_status)) {
      errors.push(`causes relationship ${relation.id} must be explicit or computed.`);
    }
    for (const sourceRef of relation.source_refs || []) {
      if (!sourceByRef.has(sourceRef) && !resolveInside(ledgerRoot, sourceRef)) {
        errors.push(`relationship ${relation.id} references an unreadable source: ${sourceRef}`);
      }
    }
  }
  for (const unit of context.semantic_units || []) {
    for (const relationshipId of unit.relationship_ids || []) {
      if (!relationships.has(relationshipId)) {
        errors.push(`semantic unit ${unit.id} references unknown relationship: ${relationshipId}`);
      }
    }
  }

  const coverage = context.coverage || {};
  const mustKeep = new Set(coverage.must_keep_ids || []);
  const represented = new Set(coverage.represented_ids || []);
  const omissions = new Map((coverage.explicit_omissions || []).map((item) => [item.id, item]));
  for (const id of mustKeep) {
    const unit = units.get(id);
    if (!unit) errors.push(`coverage.must_keep_ids references unknown unit: ${id}`);
    else if (!unit.must_keep) errors.push(`coverage.must_keep_ids unit is not marked must_keep: ${id}`);
    if (!represented.has(id) && !omissions.has(id)) {
      errors.push(`must_keep unit ${id} is neither represented nor explicitly omitted.`);
    }
  }
  for (const id of represented) {
    if (!units.has(id)) errors.push(`coverage.represented_ids references unknown unit: ${id}`);
  }
  for (const id of omissions.keys()) {
    if (!units.has(id)) errors.push(`coverage.explicit_omissions references unknown unit: ${id}`);
  }
  for (const id of coverage.unresolved_ids || []) {
    if (!units.has(id)) errors.push(`coverage.unresolved_ids references unknown unit: ${id}`);
  }
  if (coverage.status === 'complete') {
    for (const unit of context.semantic_units || []) {
      if (unit.must_keep && !represented.has(unit.id) && !omissions.has(unit.id)) {
        errors.push(`complete coverage is missing must_keep unit: ${unit.id}`);
      }
    }
    if ((coverage.unresolved_ids || []).length) errors.push('complete coverage cannot contain unresolved_ids.');
    if ((context.conflicts || []).some((conflict) => conflict.status === 'unresolved')) {
      errors.push('complete coverage cannot contain unresolved conflicts.');
    }
  }
  if (context.review?.status === 'content_reviewed' && coverage.status !== 'complete') {
    errors.push('content_reviewed ledger requires complete coverage.');
  }
}

const ledger = existsSync(resolvedLedger) ? readJson(resolvedLedger, 'content-ledger.json') : null;
const schema = existsSync(schemaPath) ? readJson(schemaPath, 'content-ledger.schema.json') : null;

if (!ledger) errors.push('content-ledger.json is missing.');
if (!schema) errors.push('content-ledger.schema.json is missing.');
if (ledger && schema) errors.push(...validateJsonInstance(schema, ledger));

if (ledger && !errors.some((error) => error.includes('invalid JSON'))) {
  const sourceByRef = new Map();
  const entries = validateCanonicalEntries(ledger, sourceByRef);
  validateSemanticContext(ledger, entries, sourceByRef);
}

if (errors.length) {
  console.error('Content ledger validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const contextStatus = ledger.semantic_context ? ` semantic_context=${ledger.semantic_context.review.status}` : '';
console.log(`Content ledger validation passed: ${resolvedLedger}${contextStatus}`);
