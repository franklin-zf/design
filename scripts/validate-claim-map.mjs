#!/usr/bin/env node
import { createHash } from 'node:crypto';
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
let provenance = null;
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
const provenancePath = join(dir, 'data-provenance.json');
if (existsSync(provenancePath)) {
  try {
    provenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
  } catch (error) {
    errors.push(`Invalid data-provenance.json: ${error.message}`);
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
  const derivations = new Map((provenance?.derivations || []).map((item) => [item.id, item]));

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
      const bytes = readFileSync(real);
      const source = {
        path: real,
        text: bytes.toString('utf8'),
        normalized: normalize(bytes.toString('utf8')),
        sha256: createHash('sha256').update(bytes).digest('hex')
      };
      sourceCache.set(sourceRef, source);
      return source;
    }
    sourceCache.set(sourceRef, null);
    return null;
  }

  function validateSourceSha256(hashMap, sourceRefs, label) {
    if (hashMap === undefined) return;
    if (!hashMap || typeof hashMap !== 'object' || Array.isArray(hashMap)) {
      errors.push(`${label} must be an object mapping source_ref to SHA-256.`);
      return;
    }
    for (const [sourceRef, expected] of Object.entries(hashMap)) {
      if (!sha256Pattern.test(String(expected || ''))) {
        errors.push(`${label}.${sourceRef} must be a lowercase SHA-256 value.`);
        continue;
      }
      if (!sourceRefs.includes(sourceRef)) {
        errors.push(`${label}.${sourceRef} is not referenced by this claim map.`);
        continue;
      }
      const source = resolveSource(sourceRef);
      if (source && source.sha256 !== expected) {
        errors.push(`${label}.${sourceRef} hash mismatch: expected ${expected}, got ${source.sha256}.`);
      }
    }
    for (const sourceRef of sourceRefs) {
      if (!Object.hasOwn(hashMap, sourceRef)) errors.push(`${label} is missing ${sourceRef}.`);
    }
  }

  function normalize(value) {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function numberTokens(value) {
    return [...String(value).matchAll(/(^|[^A-Za-z0-9_])([-+]?\d+(?:,\d{3})*(?:\.\d+)?(?:%|[kKmMbBhH])?)(?=$|[^A-Za-z0-9_])/g)].map((match) => match[2]);
  }

  function resolveJsonPointer(value, pointer) {
    if (typeof pointer !== 'string' || !pointer.startsWith('/')) return undefined;
    let current = value;
    for (const rawPart of pointer.slice(1).split('/')) {
      const part = rawPart.replace(/~1/g, '/').replace(/~0/g, '~');
      if (current === null || typeof current !== 'object' || !(part in current)) return undefined;
      current = current[part];
    }
    return current;
  }

  const allClaimSourceRefs = [...new Set((claimMap.claims || []).flatMap((claim) => (
    Array.isArray(claim.source_refs) ? claim.source_refs : []
  )))];
  const sha256Pattern = /^[a-f0-9]{64}$/;
  validateSourceSha256(claimMap.source_sha256, allClaimSourceRefs, 'claim-map.source_sha256');

  for (const [idx, claim] of (claimMap.claims || []).entries()) {
    const claimSourceRefs = Array.isArray(claim.source_refs) ? claim.source_refs : [];
    validateSourceSha256(claim.source_sha256, claimSourceRefs, `claims[${idx}].source_sha256`);
    for (const field of ['id', 'text', 'status', 'source_refs']) {
      if (!(field in claim)) errors.push(`claims[${idx}] missing ${field}.`);
    }
    if (!['verified', 'assumption', 'unverified'].includes(claim.status)) {
      errors.push(`claims[${idx}] has invalid status: ${claim.status}`);
    }
    if (claim.claim_class && !['source_fact', 'computed_metric', 'inference', 'recommendation'].includes(claim.claim_class)) {
      errors.push(`claims[${idx}] has invalid claim_class: ${claim.claim_class}`);
    }
    if (manifest.data_provenance_ref && !claim.claim_class) {
      errors.push(`claims[${idx}] must declare claim_class when data_provenance_ref is present.`);
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
    if (claim.claim_class === 'computed_metric') {
      const derivationRefs = Array.isArray(claim.derivation_refs) ? claim.derivation_refs : [];
      if (!derivationRefs.length) errors.push(`computed claim "${claim.id}" requires derivation_refs.`);
      const derivedValues = Array.isArray(claim.derived_values) ? claim.derived_values : [];
      if (!derivedValues.length) errors.push(`computed claim "${claim.id}" requires derived_values.`);
      const derivedNumbers = new Set();
      for (const [derivedIndex, derivedValue] of derivedValues.entries()) {
        if (!derivationRefs.includes(derivedValue.derivation_ref)) {
          errors.push(`computed claim "${claim.id}" derived_values[${derivedIndex}] derivation_ref must appear in derivation_refs.`);
          continue;
        }
        const derivation = derivations.get(derivedValue.derivation_ref);
        if (!derivation) {
          errors.push(`computed claim "${claim.id}" references unknown derivation_ref: ${derivedValue.derivation_ref}`);
          continue;
        }
        const output = resolveSource(derivation.output_ref);
        if (!output) {
          errors.push(`computed claim "${claim.id}" derivation output is not readable: ${derivation.output_ref}`);
          continue;
        }
        let parsedOutput;
        try {
          parsedOutput = JSON.parse(output.text);
        } catch (error) {
          errors.push(`computed claim "${claim.id}" derivation output is not JSON: ${error.message}`);
          continue;
        }
        const pointedValue = resolveJsonPointer(parsedOutput, derivedValue.json_pointer);
        if (pointedValue === undefined) {
          errors.push(`computed claim "${claim.id}" JSON Pointer does not resolve: ${derivedValue.json_pointer}`);
        } else if (String(pointedValue) !== derivedValue.token) {
          errors.push(`computed claim "${claim.id}" JSON Pointer ${derivedValue.json_pointer} does not match token "${derivedValue.token}".`);
        } else {
          derivedNumbers.add(derivedValue.token);
        }
      }
      for (const token of numberTokens(claim.text)) {
        if (!derivedNumbers.has(token)) {
          errors.push(`computed claim "${claim.id}" number "${token}" is not present in its derived output.`);
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
