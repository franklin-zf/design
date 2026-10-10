#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';
import { validateSourceExtraction } from './validate-source-extraction.mjs';

const sha256Pattern = /^[a-f0-9]{64}$/;
const scriptRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptRoot, '..');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function isInside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function normalize(value) {
  return decodeEntities(String(value).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value) {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function signaturesEqual(left, right) {
  return stable(left) === stable(right);
}

function resolveRegularFile(root, ref, label, errors) {
  if (typeof ref !== 'string' || !ref) {
    errors.push(`${label} must be a non-empty relative path`);
    return null;
  }
  if (isAbsolute(ref)) {
    errors.push(`${label} must stay inside the artifact directory`);
    return null;
  }
  const candidate = resolve(root, ref);
  if (!existsSync(candidate)) {
    errors.push(`${label} is not a readable regular file: ${ref}`);
    return null;
  }
  const real = realpathSync(candidate);
  if (!isInside(root, real) || !statSync(real).isFile()) {
    errors.push(`${label} must resolve to a regular file inside the artifact directory: ${ref}`);
    return null;
  }
  return real;
}

function readJson(path, label, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function elementTextByClaimId(html, id) {
  const escaped = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openTag = new RegExp(`<([A-Za-z][A-Za-z0-9:-]*)\\b(?=[^>]*\\bdata-claim-id=["']${escaped}["'])[^>]*>`, 'i');
  const open = openTag.exec(html);
  if (!open) return null;
  const tag = open[1].toLowerCase();
  const contentStart = open.index + open[0].length;
  const closeTag = `</${tag}>`;
  let cursor = contentStart;
  let depth = 1;
  while (cursor < html.length) {
    const tail = html.slice(cursor);
    const nextOpen = tail.search(new RegExp(`<${tag}\\b`, 'i'));
    const nextClose = tail.toLowerCase().indexOf(closeTag);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor += nextOpen + 1;
      continue;
    }
    depth -= 1;
    if (depth === 0) return normalize(html.slice(contentStart, cursor + nextClose));
    cursor += nextClose + closeTag.length;
  }
  return null;
}

function loadExtractionBindings(root, errors) {
  const extractionRef = resolve(root, 'source-extraction.json');
  if (!existsSync(extractionRef)) return null;

  const extractionResult = validateSourceExtraction(root);
  if (Array.isArray(extractionResult)) {
    errors.push(...extractionResult.map((error) => `source extraction ${error}`));
    return new Map();
  }

  const extraction = readJson(extractionRef, 'source-extraction.json', errors);
  if (!extraction) return new Map();
  const bindings = new Map();
  for (const record of extraction.records || []) {
    const extractedPath = resolveRegularFile(
      root,
      record.extracted_text.path,
      `record ${record.id} extracted text`,
      errors
    );
    if (!extractedPath) continue;
    const bytes = readFileSync(extractedPath);
    const binding = {
      mappings: (record.mappings || []).map((mapping) => {
        const { start_byte: start, end_byte: end } = mapping.extracted_span;
        return {
          locator: mapping.source_locator,
          text: bytes.subarray(start, end).toString('utf8')
        };
      })
    };
    bindings.set(record.extracted_text.path, {
      ...binding,
      sha256: record.extracted_text.sha256
    });
    if (record.original.kind === 'text') {
      bindings.set(record.original.path, {
        ...binding,
        sha256: record.original.sha256
      });
    }
  }
  return bindings;
}

export function validateContentChain(artifactDir) {
  const errors = [];
  if (!artifactDir || !existsSync(artifactDir)) return ['artifact directory does not exist'];
  const root = realpathSync(artifactDir);
  if (!statSync(root).isDirectory()) return ['artifact path must be a directory'];

  const ledgerPath = resolveRegularFile(root, 'content-ledger.json', 'content ledger', errors);
  const claimsPath = resolveRegularFile(root, 'surface-claims.json', 'surface claims', errors);
  if (!ledgerPath || !claimsPath) return errors;

  const ledger = readJson(ledgerPath, 'content-ledger.json', errors);
  const surfaceClaims = readJson(claimsPath, 'surface-claims.json', errors);
  const ledgerSchema = readJson(resolve(repositoryRoot, 'schemas/content-ledger.schema.json'), 'content ledger schema', errors);
  const claimsSchema = readJson(resolve(repositoryRoot, 'schemas/surface-claims.schema.json'), 'surface claims schema', errors);
  if (!ledger || !surfaceClaims || !ledgerSchema || !claimsSchema) return errors;

  const schemaErrors = [
    ...validateJsonInstance(ledgerSchema, ledger).map((error) => `content-ledger.json ${error}`),
    ...validateJsonInstance(claimsSchema, surfaceClaims).map((error) => `surface-claims.json ${error}`)
  ];
  if (schemaErrors.length) return [...errors, ...schemaErrors];
  if (surfaceClaims.ledger_ref !== 'content-ledger.json') {
    errors.push('surface-claims.json ledger_ref must be content-ledger.json');
  }
  const ledgerDigest = sha256(readFileSync(ledgerPath));
  if (surfaceClaims.ledger_sha256 !== ledgerDigest) {
    errors.push(`surface-claims.json ledger_sha256 mismatch: expected ${ledgerDigest}`);
  }
  const extractionBindings = loadExtractionBindings(root, errors);

  const entries = new Map();
  const protectedTokens = new Map();
  const derivedEntries = [];
  for (const [index, entry] of (ledger.entries || []).entries()) {
    if (!entry?.id || entries.has(entry.id)) {
      errors.push(`content ledger entry id must be unique at index ${index}`);
      continue;
    }
    entries.set(entry.id, entry);
    const sourcePath = resolveRegularFile(root, entry.source_ref, `entry ${entry.id} source_ref`, errors);
    if (sourcePath) {
      const bytes = readFileSync(sourcePath);
      const sourceText = bytes.toString('utf8');
      if (!sha256Pattern.test(String(entry.source_sha256 || '')) || sha256(bytes) !== entry.source_sha256) {
        errors.push(`entry ${entry.id} source_sha256 mismatch`);
      }
      if (!sourceText.includes(entry.source_quote)) {
        errors.push(`entry ${entry.id} source_quote not found in ${entry.source_ref}`);
      }
      if (extractionBindings) {
        const binding = extractionBindings.get(entry.source_ref);
        if (!binding) {
          errors.push(`entry ${entry.id} source_ref is not a declared extracted_text path`);
        } else {
          if (binding.sha256 !== entry.source_sha256) {
            errors.push(`entry ${entry.id} source_sha256 does not match the extraction record`);
          }
          const locator = entry.source_locator;
          if (locator.start > locator.end) {
            errors.push(`entry ${entry.id} source_locator start must be less than or equal to end`);
          } else {
            const coveringMapping = binding.mappings.find((mapping) => (
              mapping.locator.kind === locator.kind
              && mapping.locator.start <= locator.start
              && mapping.locator.end >= locator.end
              && mapping.text.includes(entry.source_quote)
            ));
            if (!coveringMapping) {
              errors.push(
                `entry ${entry.id} source_locator is not covered by a declared extraction mapping containing source_quote`
              );
            }
          }
        }
      }
    }
    if (entry.semantic_signature.evidence_status === 'derived_verified') derivedEntries.push(entry);
    const tokenIds = new Set();
    for (const [tokenIndex, token] of (entry.protected_tokens || []).entries()) {
      const ref = `${entry.id}#${token?.id || ''}`;
      if (!token?.id || tokenIds.has(token.id)) {
        errors.push(`entry ${entry.id} protected token id must be unique at index ${tokenIndex}`);
        continue;
      }
      tokenIds.add(token.id);
      protectedTokens.set(ref, token.text);
      if (!entry.source_quote?.includes(token.text)) {
        errors.push(`entry ${entry.id} protected token ${token.text} is not present in source_quote`);
      }
    }
  }

  if (derivedEntries.length) {
    if (!ledger.data_provenance_ref) {
      errors.push('content ledger data_provenance_ref is required for derived_verified entries');
    } else {
      const provenancePath = resolveRegularFile(root, ledger.data_provenance_ref, 'data_provenance_ref', errors);
      const provenance = provenancePath ? readJson(provenancePath, 'data provenance', errors) : null;
      const provenanceSchema = readJson(
        resolve(repositoryRoot, 'schemas/data-provenance.schema.json'),
        'data provenance schema',
        errors
      );
      if (provenance && provenanceSchema) {
        const provenanceErrors = validateJsonInstance(provenanceSchema, provenance);
        errors.push(...provenanceErrors.map((error) => `data provenance ${error}`));
        const derivationIds = new Set((provenance.derivations || []).map((item) => item.id));
        for (const entry of derivedEntries) {
          for (const ref of entry.derivation_refs || []) {
            if (!derivationIds.has(ref)) errors.push(`entry ${entry.id} references unknown derivation_ref ${ref}`);
          }
        }
      }
    }
  }

  const surfacePath = resolveRegularFile(root, surfaceClaims.surface?.path, 'surface path', errors);
  const html = surfacePath ? readFileSync(surfacePath, 'utf8') : '';
  const visibleIdList = [...html.matchAll(/\bdata-claim-id=["']([^"']+)["']/gi)].map((match) => match[1]);
  const visibleIds = new Set(visibleIdList);
  const claimIdList = (surfaceClaims.claims || []).map((claim) => claim.id).filter(Boolean);
  const claimIds = new Set(claimIdList);
  for (const id of visibleIds) {
    if (visibleIdList.filter((value) => value === id).length !== 1) {
      errors.push(`visible data-claim-id ${id} must occur exactly once`);
    }
    if (!claimIds.has(id)) errors.push(`visible data-claim-id ${id} has no surface claim`);
  }
  for (const id of claimIds) {
    if (claimIdList.filter((value) => value === id).length !== 1) {
      errors.push(`surface claim id ${id} must occur exactly once`);
    }
    if (!visibleIds.has(id)) errors.push(`surface claim ${id} has no visible data-claim-id`);
  }

  for (const claim of surfaceClaims.claims || []) {
    if (claim.visible_claim_id !== claim.id) {
      errors.push(`surface claim ${claim.id} visible_claim_id must exactly equal its id`);
    }
    const visibleText = elementTextByClaimId(html, claim.visible_claim_id);
    if (visibleText === null) continue;
    if (normalize(claim.displayed_text) !== visibleText) {
      errors.push(`claim ${claim.id} displayed_text must exactly match visible text after normalization`);
    }

    const requiredTokenRefs = new Set();
    for (const contentRef of claim.content_refs || []) {
      const entry = entries.get(contentRef);
      if (!entry) {
        errors.push(`claim ${claim.id} references unknown content_ref ${contentRef}`);
        continue;
      }
      if (!signaturesEqual(entry.semantic_signature, claim.semantic_signature)) {
        errors.push(
          `claim ${claim.id} semantic_signature must exactly equal referenced ledger entry ${entry.id}; `
          + 'artifact-local semantic authorization is forbidden'
        );
      }
      for (const token of entry.protected_tokens || []) requiredTokenRefs.add(`${entry.id}#${token.id}`);
    }

    const selectedTokenRefs = new Set(claim.selected_protected_token_refs || []);
    for (const ref of requiredTokenRefs) {
      if (!selectedTokenRefs.has(ref)) errors.push(`claim ${claim.id} is missing selected protected token ref ${ref}`);
    }
    for (const ref of selectedTokenRefs) {
      if (!requiredTokenRefs.has(ref)) {
        errors.push(`claim ${claim.id} selected protected token ref ${ref} is not owned by its content_refs`);
        continue;
      }
      const token = protectedTokens.get(ref);
      if (token && !visibleText.includes(token)) {
        errors.push(`claim ${claim.id} protected token ${token} is missing from visible text`);
      }
    }
  }

  return errors;
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  const artifactDir = process.argv[2];
  if (!artifactDir) {
    console.error('Usage: node scripts/validate-content-chain.mjs <artifact-dir>');
    process.exitCode = 2;
  } else {
    const errors = validateContentChain(artifactDir);
    if (errors.length) {
      console.error('Content chain validation failed:');
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
    } else {
      console.log('Content chain validation passed. Lexical and declared-signature checks only; natural-language semantics require human review.');
    }
  }
}
