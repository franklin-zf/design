#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-summary-map.mjs <artifact-dir>');
  process.exit(2);
}

const manifestPath = join(dir, 'manifest.json');
const summaryMapPath = join(dir, 'summary-map.json');
const htmlPath = join(dir, 'index.html');
const errors = [];
const artifactRoot = existsSync(dir) ? realpathSync(dir) : null;
const skillRoot = realpathSync(process.cwd());
const summaryMapRequiredTypes = new Set(['data-report', 'dashboard', 'chart-frame', 'html-deck', 'ppt-handoff']);
const forbiddenTerms = [
  'leverage',
  'unlock',
  'robust',
  'holistic',
  'synergy',
  'paradigm',
  'momentum',
  'best-in-class',
  '赋能',
  '抓手',
  '闭环',
  '高阶',
  '范式',
  '飞轮'
];

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function normalize(value) {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(value) {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
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

function elementTextBySummaryId(htmlText, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openTagRe = new RegExp(`<([A-Za-z][A-Za-z0-9:-]*)\\b(?=[^>]*\\bdata-summary-id=["']${escapedId}["'])[^>]*>`, 'i');
  const open = openTagRe.exec(htmlText);
  if (!open) return null;
  const tag = open[1].toLowerCase();
  const start = open.index + open[0].length;
  const closeTag = `</${tag}>`;
  let cursor = start;
  let depth = 1;
  while (cursor < htmlText.length) {
    const nextOpen = htmlText.slice(cursor).search(new RegExp(`<${tag}\\b`, 'i'));
    const nextClose = htmlText.slice(cursor).toLowerCase().indexOf(closeTag);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor += nextOpen + 1;
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      const raw = htmlText.slice(start, cursor + nextClose);
      return normalize(decodeEntities(raw));
    }
    cursor += nextClose + closeTag.length;
  }
  return null;
}

function isInside(root, file) {
  const rel = relative(root, file);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function resolveSource(sourceRef) {
  const candidates = [
    artifactRoot ? resolve(artifactRoot, sourceRef) : null,
    resolve(skillRoot, sourceRef)
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const real = realpathSync(candidate);
    if (!isInside(skillRoot, real) && !(artifactRoot && isInside(artifactRoot, real))) continue;
    if (!statSync(real).isFile()) continue;
    const text = readFileSync(real, 'utf8');
    return { path: real, text, normalized: normalize(text) };
  }
  return null;
}

let manifest = null;
let summaryMap = null;
let provenance = null;
let html = '';

if (!existsSync(manifestPath)) errors.push('Missing manifest.json.');
else manifest = readJson(manifestPath, 'manifest.json');

if (existsSync(htmlPath)) html = readFileSync(htmlPath, 'utf8');
else errors.push('Missing index.html.');

const provenancePath = join(dir, 'data-provenance.json');
if (existsSync(provenancePath)) provenance = readJson(provenancePath, 'data-provenance.json');

if (!existsSync(summaryMapPath)) {
  if (!manifest || (summaryMapRequiredTypes.has(manifest.artifact_type) && manifest.schematic !== true)) {
    errors.push('Missing summary-map.json.');
  }
} else {
  summaryMap = readJson(summaryMapPath, 'summary-map.json');
}

if (manifest && summaryMap) {
  if (summaryMap.schema_version !== 'design-summary-map/v1') errors.push('summary-map.schema_version must be design-summary-map/v1.');
  if (!summaryMap.plain_language || typeof summaryMap.plain_language !== 'object') {
    errors.push('summary-map.plain_language is required.');
  } else if (summaryMap.plain_language.status !== 'manual_reviewed') {
    errors.push('summary-map.plain_language.status must be manual_reviewed.');
  }
  if (!Array.isArray(summaryMap.summaries) || !summaryMap.summaries.length) {
    errors.push('summary-map.summaries must be a non-empty array.');
  }

  const knownSources = new Set([
    ...(manifest.source_materials || []),
    ...(manifest.data_sources || []).map((source) => source.id).filter(Boolean)
  ]);
  const htmlSummaryIds = new Set([...html.matchAll(/\bdata-summary-id=["']([^"']+)["']/gi)].map((match) => match[1]));
  const mappedIds = new Set((summaryMap.summaries || []).map((summary) => summary.id));
  const derivations = new Map((provenance?.derivations || []).map((item) => [item.id, item]));

  if (summaryMapRequiredTypes.has(manifest.artifact_type) && manifest.schematic !== true && !htmlSummaryIds.size) {
    errors.push(`${manifest.artifact_type} artifacts must tag visible summaries with data-summary-id.`);
  }
  for (const id of htmlSummaryIds) {
    if (!mappedIds.has(id)) errors.push(`HTML data-summary-id "${id}" has no matching summary-map entry.`);
  }

  for (const [idx, summary] of (summaryMap.summaries || []).entries()) {
    for (const field of ['id', 'summary_text', 'status', 'source_refs', 'source_quotes', 'preserved_numbers']) {
      if (!(field in summary)) errors.push(`summaries[${idx}] missing ${field}.`);
    }
    if (!htmlSummaryIds.has(summary.id)) errors.push(`summary-map entry "${summary.id}" is not present as an HTML data-summary-id.`);
    const visibleSummaryText = elementTextBySummaryId(html, summary.id);
    if (!visibleSummaryText) {
      errors.push(`summary-map entry "${summary.id}" visible HTML text could not be extracted.`);
    } else if (visibleSummaryText !== normalize(summary.summary_text)) {
      errors.push(`summary-map entry "${summary.id}" summary_text must match visible HTML text exactly after normalization.`);
    }
    if (!['verified', 'manual_reviewed', 'unverified'].includes(summary.status)) {
      errors.push(`summaries[${idx}] has invalid status: ${summary.status}`);
    }
    const valueOrigin = summary.value_origin || 'source_verbatim';
    if (manifest.data_provenance_ref && !summary.value_origin) {
      errors.push(`summaries[${idx}] must declare value_origin when data_provenance_ref is present.`);
    }
    if (!['source_verbatim', 'code_derived', 'no_numeric_value'].includes(valueOrigin)) {
      errors.push(`summaries[${idx}] has invalid value_origin: ${valueOrigin}`);
    }
    const summarySourceRefs = Array.isArray(summary.source_refs) ? summary.source_refs : [];
    if (!summarySourceRefs.length) errors.push(`summaries[${idx}] must bind at least one source_ref.`);
    for (const sourceRef of summarySourceRefs) {
      if (!knownSources.has(sourceRef)) errors.push(`summaries[${idx}] references unknown source_ref: ${sourceRef}`);
    }
    if (!Array.isArray(summary.source_quotes) || !summary.source_quotes.length) {
      errors.push(`summaries[${idx}] must include non-empty source_quotes.`);
      continue;
    }

    const quoteText = [];
    for (const [quoteIdx, quote] of summary.source_quotes.entries()) {
      if (!quote || typeof quote !== 'object') {
        errors.push(`summaries[${idx}].source_quotes[${quoteIdx}] must be an object.`);
        continue;
      }
      if (!quote.source_ref || !quote.quote) {
        errors.push(`summaries[${idx}].source_quotes[${quoteIdx}] must include source_ref and quote.`);
        continue;
      }
      if (!summarySourceRefs.includes(quote.source_ref)) {
        errors.push(`summaries[${idx}].source_quotes[${quoteIdx}] source_ref must also appear in summary.source_refs.`);
      }
      if (!knownSources.has(quote.source_ref)) {
        errors.push(`summaries[${idx}].source_quotes[${quoteIdx}] references unknown source_ref: ${quote.source_ref}`);
        continue;
      }
      const source = resolveSource(quote.source_ref);
      if (!source) {
        errors.push(`summaries[${idx}].source_quotes[${quoteIdx}] source_ref is not a readable local file: ${quote.source_ref}`);
        continue;
      }
      const normalizedQuote = normalize(quote.quote);
      if (!normalizedQuote) {
        errors.push(`summaries[${idx}].source_quotes[${quoteIdx}] quote must not be blank.`);
      } else if (!source.normalized.includes(normalizedQuote)) {
        errors.push(`summaries[${idx}].source_quotes[${quoteIdx}] quote not found in ${quote.source_ref}: ${quote.quote}`);
      }
      quoteText.push(quote.quote);
    }

    let numberEvidence = quoteText.join(' ');
    if (valueOrigin === 'code_derived') {
      const derivationRefs = Array.isArray(summary.derivation_refs) ? summary.derivation_refs : [];
      if (!derivationRefs.length) errors.push(`summary "${summary.id}" code_derived values require derivation_refs.`);
      const derivedValues = Array.isArray(summary.derived_values) ? summary.derived_values : [];
      if (!derivedValues.length) errors.push(`summary "${summary.id}" code_derived values require derived_values.`);
      const verifiedTokens = [];
      for (const [derivedIndex, derivedValue] of derivedValues.entries()) {
        if (!derivationRefs.includes(derivedValue.derivation_ref)) {
          errors.push(`summary "${summary.id}" derived_values[${derivedIndex}] derivation_ref must appear in derivation_refs.`);
          continue;
        }
        const derivation = derivations.get(derivedValue.derivation_ref);
        if (!derivation) {
          errors.push(`summary "${summary.id}" references unknown derivation_ref: ${derivedValue.derivation_ref}`);
          continue;
        }
        const output = resolveSource(derivation.output_ref);
        if (!output) {
          errors.push(`summary "${summary.id}" derivation output is not readable: ${derivation.output_ref}`);
          continue;
        }
        let parsedOutput;
        try {
          parsedOutput = JSON.parse(output.text);
        } catch (error) {
          errors.push(`summary "${summary.id}" derivation output is not JSON: ${error.message}`);
          continue;
        }
        const pointedValue = resolveJsonPointer(parsedOutput, derivedValue.json_pointer);
        if (pointedValue === undefined) {
          errors.push(`summary "${summary.id}" JSON Pointer does not resolve: ${derivedValue.json_pointer}`);
        } else if (String(pointedValue) !== derivedValue.token) {
          errors.push(`summary "${summary.id}" JSON Pointer ${derivedValue.json_pointer} does not match token "${derivedValue.token}".`);
        } else {
          verifiedTokens.push(derivedValue.token);
        }
      }
      numberEvidence = verifiedTokens.join(' ');
    }

    const sourceNumbers = new Set(numberTokens(numberEvidence));
    const visibleNumbers = numberTokens(visibleSummaryText || summary.summary_text);
    const preservedNumbers = Array.isArray(summary.preserved_numbers) ? summary.preserved_numbers : [];
    if (valueOrigin === 'no_numeric_value' && visibleNumbers.length) {
      errors.push(`summary "${summary.id}" declares no_numeric_value but contains visible numbers.`);
    }
    for (const token of visibleNumbers) {
      if (!sourceNumbers.has(token)) {
        const evidenceLabel = valueOrigin === 'code_derived' ? 'derived output' : 'source_quotes';
        errors.push(`summary "${summary.id}" number "${token}" is not present verbatim in its ${evidenceLabel}.`);
      }
      if (!preservedNumbers.includes(token)) {
        errors.push(`summary "${summary.id}" number "${token}" must appear in preserved_numbers.`);
      }
    }
    for (const token of preservedNumbers) {
      const evidenceLabel = valueOrigin === 'code_derived' ? 'derived output' : 'source_quotes';
      if (!sourceNumbers.has(token)) errors.push(`summary "${summary.id}" preserved number "${token}" is not present in ${evidenceLabel}.`);
      if (!visibleNumbers.includes(token)) errors.push(`summary "${summary.id}" preserved number "${token}" is not present in visible summary text.`);
    }

    const lowered = String(visibleSummaryText || summary.summary_text).toLowerCase();
    for (const term of forbiddenTerms) {
      const termLower = term.toLowerCase();
      if (lowered.includes(termLower)) {
        errors.push(`summary "${summary.id}" contains forbidden plain-language term: ${term}`);
      }
    }
  }
}

if (errors.length) {
  console.error('Summary map validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Summary map validation passed: ${dir}`);
