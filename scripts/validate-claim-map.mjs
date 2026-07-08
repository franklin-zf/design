#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-claim-map.mjs <artifact-dir>');
  process.exit(2);
}

const manifestPath = join(dir, 'manifest.json');
const claimMapPath = join(dir, 'claim-map.json');
const errors = [];
const artifactRoot = existsSync(dir) ? realpathSync(dir) : null;
const skillRoot = realpathSync(process.cwd());

if (!existsSync(manifestPath)) errors.push('Missing manifest.json.');
if (!existsSync(claimMapPath)) errors.push('Missing claim-map.json.');

let manifest = null;
let claimMap = null;
if (existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    errors.push(`Invalid manifest.json: ${error.message}`);
  }
}
if (existsSync(claimMapPath)) {
  try {
    claimMap = JSON.parse(readFileSync(claimMapPath, 'utf8'));
  } catch (error) {
    errors.push(`Invalid claim-map.json: ${error.message}`);
  }
}

if (manifest && claimMap) {
  if (claimMap.schema_version !== 'design-claim-map/v1') errors.push('claim-map.schema_version must be design-claim-map/v1.');
  if (!Array.isArray(claimMap.claims) || !claimMap.claims.length) errors.push('claim-map.claims must be a non-empty array.');

  const knownSources = new Set([
    ...(manifest.source_materials || []),
    ...(manifest.data_sources || []).map((source) => source.id).filter(Boolean)
  ]);
  const unverifiedItems = new Set(manifest.unverified_items || []);
  const sourceCache = new Map();

  function isInside(root, file) {
    const rel = relative(root, file);
    return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
  }

  function resolveSource(sourceRef) {
    if (sourceCache.has(sourceRef)) return sourceCache.get(sourceRef);
    const candidates = [
      artifactRoot ? resolve(artifactRoot, sourceRef) : null,
      resolve(skillRoot, sourceRef)
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (!existsSync(candidate)) continue;
      const real = realpathSync(candidate);
      if (!isInside(skillRoot, real) && !(artifactRoot && isInside(artifactRoot, real))) continue;
      if (!statSync(real).isFile()) continue;
      const source = {
        path: real,
        text: readFileSync(real, 'utf8'),
        normalized: normalize(readFileSync(real, 'utf8'))
      };
      sourceCache.set(sourceRef, source);
      return source;
    }
    sourceCache.set(sourceRef, null);
    return null;
  }

  function normalize(value) {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  for (const [idx, claim] of (claimMap.claims || []).entries()) {
    const claimSourceRefs = Array.isArray(claim.source_refs) ? claim.source_refs : [];
    for (const field of ['id', 'text', 'status', 'source_refs']) {
      if (!(field in claim)) errors.push(`claims[${idx}] missing ${field}.`);
    }
    if (!['verified', 'assumption', 'unverified'].includes(claim.status)) {
      errors.push(`claims[${idx}] has invalid status: ${claim.status}`);
    }
    if (!Array.isArray(claim.source_refs) || !claim.source_refs.length) {
      errors.push(`claims[${idx}] must bind at least one source_ref.`);
    } else {
      for (const sourceRef of claim.source_refs) {
        if (!knownSources.has(sourceRef)) {
          errors.push(`claims[${idx}] references unknown source_ref: ${sourceRef}`);
        }
      }
    }
    if (claim.status === 'unverified' && !unverifiedItems.has(claim.id)) {
      errors.push(`unverified claim "${claim.id}" must appear in manifest.unverified_items.`);
    }
    if (claim.status === 'verified') {
      if (!Array.isArray(claim.evidence_quotes) || !claim.evidence_quotes.length) {
        errors.push(`verified claim "${claim.id}" must include non-empty evidence_quotes.`);
      }
      for (const [quoteIdx, quote] of (claim.evidence_quotes || []).entries()) {
        if (!quote || typeof quote !== 'object') {
          errors.push(`claims[${idx}].evidence_quotes[${quoteIdx}] must be an object.`);
          continue;
        }
        if (!quote.source_ref || !quote.quote) {
          errors.push(`claims[${idx}].evidence_quotes[${quoteIdx}] must include source_ref and quote.`);
          continue;
        }
        if (!claimSourceRefs.includes(quote.source_ref)) {
          errors.push(`claims[${idx}].evidence_quotes[${quoteIdx}] source_ref must also appear in claim.source_refs.`);
        }
        if (!knownSources.has(quote.source_ref)) {
          errors.push(`claims[${idx}].evidence_quotes[${quoteIdx}] references unknown source_ref: ${quote.source_ref}`);
          continue;
        }
        const source = resolveSource(quote.source_ref);
        if (!source) {
          errors.push(`claims[${idx}].evidence_quotes[${quoteIdx}] source_ref is not a readable local file: ${quote.source_ref}`);
          continue;
        }
        const normalizedQuote = normalize(quote.quote);
        if (!normalizedQuote) {
          errors.push(`claims[${idx}].evidence_quotes[${quoteIdx}] quote must not be blank.`);
        } else if (!source.normalized.includes(normalizedQuote)) {
          errors.push(`claims[${idx}].evidence_quotes[${quoteIdx}] quote not found in ${quote.source_ref}: ${quote.quote}`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error('Claim map validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Claim map validation passed: ${dir}`);
