#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';
import { findProductionCommentary } from './lib/production-copy.mjs';

const handoffPath = process.argv[2];
if (!handoffPath) {
  console.error('Usage: node scripts/validate-content-handoff.mjs <content-handoff.json>');
  process.exit(2);
}

const errors = [];
const resolvedHandoff = resolve(handoffPath);
const handoffRoot = existsSync(dirname(resolvedHandoff))
  ? realpathSync(dirname(resolvedHandoff))
  : dirname(resolvedHandoff);
const scriptRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptRoot, '..');

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

function isInside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function resolveRegularFile(root, ref, label) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)) {
    errors.push(`${label} must be a non-empty relative path`);
    return null;
  }
  const candidate = resolve(root, ref);
  if (!existsSync(candidate)) {
    errors.push(`${label} is not a readable regular file: ${ref}`);
    return null;
  }
  const real = realpathSync(candidate);
  if (!isInside(root, real) || !statSync(real).isFile()) {
    errors.push(`${label} must resolve to a regular file inside the handoff directory: ${ref}`);
    return null;
  }
  return real;
}

function tokenRefsFor(entry) {
  return new Map((entry.protected_tokens || []).map((token) => [`${entry.id}#${token.id}`, token.text]));
}

function numberTokens(value) {
  return [...String(value).matchAll(
    /(^|[^A-Za-z0-9_])([-+]?\d+(?:,\d{3})*(?:\.\d+)?(?:%|[kKmMbBhH])?)(?=$|[^A-Za-z0-9_])/g
  )].map((match) => match[2]);
}

const handoff = existsSync(resolvedHandoff)
  ? readJson(resolvedHandoff, 'content-handoff.json')
  : null;
const handoffSchema = readJson(
  resolve(repositoryRoot, 'schemas/content-handoff.schema.json'),
  'content-handoff schema'
);
if (!handoff) errors.push('content-handoff.json is missing.');
if (handoff && handoffSchema) errors.push(...validateJsonInstance(handoffSchema, handoff));

if (handoff) {
  const manifestPath = resolve(handoffRoot, 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = readJson(manifestPath, 'manifest.json');
    if (manifest && manifest.artifact_type !== handoff.artifact_type) {
      errors.push(
        `content handoff artifact_type must match manifest.json: handoff=${handoff.artifact_type}, manifest=${manifest.artifact_type}.`
      );
    }
  }
}

let ledger = null;
let entries = new Map();
let semanticUnits = new Map();
if (handoff) {
  const ledgerPath = resolveRegularFile(handoffRoot, handoff.ledger_ref, 'ledger_ref');
  if (ledgerPath) {
    const ledgerBytes = readFileSync(ledgerPath);
    const actualLedgerHash = sha256(ledgerBytes);
    if (actualLedgerHash !== handoff.ledger_sha256) {
      errors.push(`ledger_sha256 mismatch: expected ${handoff.ledger_sha256}, got ${actualLedgerHash}.`);
    }
    ledger = readJson(ledgerPath, 'content-ledger.json');
  }
}

if (ledger) {
  const ledgerSchema = readJson(resolve(repositoryRoot, 'schemas/content-ledger.schema.json'), 'content ledger schema');
  if (ledgerSchema) errors.push(...validateJsonInstance(ledgerSchema, ledger).map((error) => `content ledger ${error}`));
  for (const entry of ledger.entries || []) entries.set(entry.id, entry);
  for (const unit of ledger.semantic_context?.semantic_units || []) semanticUnits.set(unit.id, unit);
  if (!ledger.semantic_context) errors.push('content ledger requires semantic_context for a poster content handoff.');
}

if (handoff && ledger) {
  for (const phrase of findProductionCommentary(handoff.one_sentence_message)) {
    errors.push(`one_sentence_message contains production commentary: ${phrase}`);
  }
  const sourceRefs = new Set((ledger.entries || []).map((entry) => entry.source_ref));
  const contentUnitIds = new Set();
  const represented = new Set();
  const handoffUnits = handoff.content_units || [];
  const computedDerivationRefs = new Set();
  for (const unit of handoffUnits) {
    if (contentUnitIds.has(unit.id)) errors.push(`content unit id must be unique: ${unit.id}`);
    contentUnitIds.add(unit.id);
    const semanticUnit = semanticUnits.get(unit.semantic_unit_id);
    const entry = semanticUnit ? entries.get(semanticUnit.canonical_entry_id) : null;
    if (!semanticUnit) {
      errors.push(`content unit ${unit.id} references unknown semantic unit: ${unit.semantic_unit_id}`);
      continue;
    }
    if (!entry) {
      errors.push(`semantic unit ${semanticUnit.id} references an unknown canonical entry.`);
      continue;
    }
    // Only a literal, source-bound quote may retain these phrases unchanged.
    const isLiteralQuote = unit.content_mode === 'source_verbatim'
      && typeof unit.display_text === 'string'
      && typeof entry.source_quote === 'string'
      && entry.source_quote.includes(unit.display_text);
    if (!isLiteralQuote) {
      for (const phrase of findProductionCommentary(unit.display_text)) {
        errors.push(`content unit ${unit.id} contains production commentary: ${phrase}`);
      }
    }
    represented.add(semanticUnit.id);
    if (!unit.source_refs.includes(entry.source_ref)) {
      errors.push(`content unit ${unit.id} must include canonical source_ref ${entry.source_ref}.`);
    }
    for (const sourceRef of unit.source_refs) {
      if (!sourceRefs.has(sourceRef)) errors.push(`content unit ${unit.id} references unknown source_ref: ${sourceRef}`);
      else if (!resolveRegularFile(handoffRoot, sourceRef, `content unit ${unit.id} source_ref`)) continue;
    }
    const tokenRefs = tokenRefsFor(entry);
    const requiredTokenRefs = new Set(tokenRefs.keys());
    const selectedTokenRefs = new Set(unit.protected_token_refs || []);
    if (unit.must_keep !== Boolean(semanticUnit.must_keep)) {
      errors.push(`content unit ${unit.id} must_keep must match semantic unit ${semanticUnit.id}.`);
    }
    if (semanticUnit.must_keep && unit.content_mode !== 'computed') {
      for (const tokenRef of requiredTokenRefs) {
        if (!selectedTokenRefs.has(tokenRef)) {
          errors.push(`content unit ${unit.id} is missing protected token ref ${tokenRef}.`);
        }
      }
    }
    for (const tokenRef of selectedTokenRefs) {
      if (!tokenRefs.has(tokenRef)) {
        errors.push(`content unit ${unit.id} selects a token outside its canonical entry: ${tokenRef}.`);
        continue;
      }
      if (unit.content_mode !== 'computed' && !unit.display_text.includes(tokenRefs.get(tokenRef))) {
        errors.push(`content unit ${unit.id} drops protected token ${tokenRefs.get(tokenRef)} from display_text.`);
      }
    }
    if (semanticUnit.kind === 'question' && unit.content_mode !== 'open_question') {
      errors.push(`question semantic unit ${semanticUnit.id} must use content_mode=open_question.`);
    }
    if (unit.content_mode === 'computed' && (!unit.derivation_refs || !unit.derivation_refs.length)) {
      errors.push(`computed content unit ${unit.id} requires derivation_refs.`);
    }
    if (unit.content_mode === 'computed') {
      for (const derivationRef of unit.derivation_refs || []) computedDerivationRefs.add(derivationRef);
      if (entry.semantic_signature.evidence_status !== 'derived_verified') {
        errors.push(`computed content unit ${unit.id} requires derived_verified canonical evidence.`);
      }
      for (const derivationRef of unit.derivation_refs || []) {
        if (!(entry.derivation_refs || []).includes(derivationRef)) {
          errors.push(`computed content unit ${unit.id} references an unbound derivation: ${derivationRef}.`);
        }
      }
    } else {
      const sourceNumbers = new Set(numberTokens(entry.source_quote));
      for (const token of numberTokens(unit.display_text)) {
        if (!sourceNumbers.has(token)) {
          errors.push(`content unit ${unit.id} introduces numeric token not present in source_quote: ${token}`);
        }
      }
    }
  }

  if (computedDerivationRefs.size) {
    if (!ledger.data_provenance_ref) {
      errors.push('computed content requires ledger.data_provenance_ref.');
    } else {
      const provenancePath = resolveRegularFile(handoffRoot, ledger.data_provenance_ref, 'data_provenance_ref');
      const provenance = provenancePath ? readJson(provenancePath, 'data provenance') : null;
      const provenanceSchema = readJson(
        resolve(repositoryRoot, 'schemas/data-provenance.schema.json'),
        'data provenance schema'
      );
      if (provenance && provenanceSchema) {
        errors.push(...validateJsonInstance(provenanceSchema, provenance).map((error) => `data provenance ${error}`));
        const derivationIds = new Set((provenance.derivations || []).map((item) => item.id));
        for (const derivationRef of computedDerivationRefs) {
          if (!derivationIds.has(derivationRef)) {
            errors.push(`computed content references unknown provenance derivation: ${derivationRef}.`);
          }
        }
      }
    }
  }

  const ledgerMustKeep = new Set(ledger.semantic_context.coverage?.must_keep_ids || []);
  const omitted = new Map((handoff.explicit_omissions || []).map((item) => [item.unit_id, item]));
  const declaredMustKeep = new Set(handoff.must_keep_unit_ids || []);
  for (const id of ledgerMustKeep) {
    if (!semanticUnits.has(id)) errors.push(`ledger must_keep references unknown semantic unit: ${id}`);
    if (!represented.has(id) && !omitted.has(id)) {
      errors.push(`handoff must represent or explicitly omit must_keep unit: ${id}`);
    }
    if (!omitted.has(id) && !declaredMustKeep.has(id)) {
      errors.push(`handoff must_keep_unit_ids is missing: ${id}`);
    }
  }
  for (const id of declaredMustKeep) {
    if (!semanticUnits.has(id)) errors.push(`handoff must_keep_unit_ids references unknown semantic unit: ${id}`);
  }
  for (const omission of handoff.explicit_omissions || []) {
    if (!semanticUnits.has(omission.unit_id)) errors.push(`handoff omission references unknown semantic unit: ${omission.unit_id}`);
  }
  if (handoff.review?.status === 'content_reviewed') {
    if (handoff.explicit_omissions?.some((item) => ['material', 'unknown'].includes(item.impact))) {
      errors.push('content_reviewed handoff cannot contain material or unknown omissions.');
    }
    if ([...ledgerMustKeep].some((id) => !represented.has(id))) {
      errors.push('content_reviewed handoff requires every must_keep unit to be represented.');
    }
  }
}

if (errors.length) {
  console.error('Content handoff validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content handoff validation passed: ${resolvedHandoff}`);
