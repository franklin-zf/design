#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptRoot, '..');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function isInside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function resolveRegularFile(root, ref, label, errors) {
  if (typeof ref !== 'string' || !ref) {
    errors.push(`${label} must be a non-empty relative path`);
    return null;
  }
  if (isAbsolute(ref) || !isInside(root, resolve(root, ref))) {
    errors.push(`${label} must stay inside the artifact directory: ${ref}`);
    return null;
  }
  const candidate = resolve(root, ref);
  if (!existsSync(candidate)) {
    errors.push(`${label} is missing or not a regular file: ${ref}`);
    return null;
  }
  const real = realpathSync(candidate);
  if (!isInside(root, real) || !statSync(real).isFile()) {
    errors.push(`${label} must stay inside the artifact directory and resolve to a regular file: ${ref}`);
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

function decodeUtf8(bytes, label, errors) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    errors.push(`${label} is not valid UTF-8: ${error.message}`);
    return null;
  }
}

function splitUnits(text, separator) {
  const units = text.split(separator);
  if (units.length && units.at(-1).endsWith('\n')) {
    units[units.length - 1] = units.at(-1).slice(0, -1);
  }
  return units;
}

function selectedUnitText(text, locator, outputContract, label, errors) {
  const separator = locator.kind === 'page'
    ? outputContract.page_separator
    : outputContract.paragraph_separator;
  const units = splitUnits(text, separator);
  if (locator.start > locator.end) {
    errors.push(`${label} locator start must be less than or equal to end`);
    return null;
  }
  if (locator.end > units.length) {
    errors.push(`${label} locator is out of range for ${units.length} ${locator.kind} units`);
    return null;
  }
  return units.slice(locator.start - 1, locator.end).join(separator);
}

function validateCapabilityBinding(extraction, capability, capabilityBytes, errors) {
  if (sha256(capabilityBytes) !== extraction.capability.sha256) {
    errors.push('capability sha256 mismatch');
  }
  if (extraction.capability.capability_id !== capability.capability_id) {
    errors.push('capability_id does not match the capability file');
  }
  if (extraction.capability.tool_name !== capability.tool.name) {
    errors.push('tool name does not match the capability file');
  }
  if (extraction.capability.tool_version !== capability.tool.version) {
    errors.push('tool version does not match the capability file');
  }
}

function validateMapping(mapping, context, errors) {
  const { capability, extractedBytes, extractedText, originalText, recordId } = context;
  const label = `record ${recordId} mapping ${mapping.id}`;
  const locatorKinds = new Set(capability.output_contract.locator_kinds);
  if (!locatorKinds.has(mapping.source_locator.kind)) {
    errors.push(`${label} locator kind is not supported by the capability`);
    return;
  }

  const { start_byte: start, end_byte: end } = mapping.extracted_span;
  if (start >= end || end > extractedBytes.length) {
    errors.push(`${label} extracted span is out of range`);
    return;
  }
  const spanBytes = extractedBytes.subarray(start, end);
  const spanText = decodeUtf8(spanBytes, `${label} extracted span`, errors);
  if (spanText === null) return;
  if (sha256(spanBytes) !== mapping.text_sha256) {
    errors.push(`${label} text_sha256 mismatch`);
  }

  const locatedExtractedText = selectedUnitText(
    extractedText,
    mapping.source_locator,
    capability.output_contract,
    label,
    errors
  );
  if (locatedExtractedText !== null && spanText !== locatedExtractedText) {
    errors.push(`${label} locator does not match the declared extracted bytes`);
  }

  if (originalText !== null) {
    const locatedOriginalText = selectedUnitText(
      originalText,
      mapping.source_locator,
      capability.output_contract,
      `${label} original`,
      errors
    );
    if (locatedOriginalText !== null && spanText !== locatedOriginalText) {
      errors.push(`${label} locator does not match the original text`);
    }
  }
}

export function validateSourceExtraction(artifactDir) {
  const errors = [];
  if (!artifactDir || !existsSync(artifactDir)) return ['artifact directory does not exist'];
  const root = realpathSync(artifactDir);
  if (!statSync(root).isDirectory()) return ['artifact path must be a directory'];

  const extractionPath = resolveRegularFile(root, 'source-extraction.json', 'source extraction', errors);
  if (!extractionPath) return errors;
  const extraction = readJson(extractionPath, 'source-extraction.json', errors);
  const extractionSchema = readJson(
    resolve(repositoryRoot, 'schemas/source-extraction.schema.json'),
    'source extraction schema',
    errors
  );
  if (!extraction || !extractionSchema) return errors;
  const extractionSchemaErrors = validateJsonInstance(extractionSchema, extraction);
  if (extractionSchemaErrors.length) {
    return [...errors, ...extractionSchemaErrors.map((error) => `source-extraction.json ${error}`)];
  }

  const capabilityPath = resolveRegularFile(root, extraction.capability.ref, 'capability', errors);
  if (!capabilityPath) return errors;
  const capabilityBytes = readFileSync(capabilityPath);
  const capability = readJson(capabilityPath, 'extraction capability', errors);
  const capabilitySchema = readJson(
    resolve(repositoryRoot, 'schemas/source-extraction-capability.schema.json'),
    'source extraction capability schema',
    errors
  );
  if (!capability || !capabilitySchema) return errors;
  const capabilitySchemaErrors = validateJsonInstance(capabilitySchema, capability);
  if (capabilitySchemaErrors.length) {
    return [...errors, ...capabilitySchemaErrors.map((error) => `extraction capability ${error}`)];
  }
  validateCapabilityBinding(extraction, capability, capabilityBytes, errors);

  const supportedSources = new Set(capability.supported_sources.map(
    (source) => `${source.kind}\u0000${source.media_type}`
  ));
  const recordIds = new Set();
  let mappingCount = 0;
  for (const [recordIndex, record] of extraction.records.entries()) {
    if (recordIds.has(record.id)) {
      errors.push(`record id must be unique: ${record.id}`);
      continue;
    }
    recordIds.add(record.id);
    const recordLabel = `record ${record.id || recordIndex}`;
    if (!supportedSources.has(`${record.original.kind}\u0000${record.original.media_type}`)) {
      errors.push(`${recordLabel} original kind and media_type are not supported by the capability`);
    }
    if (record.extracted_text.media_type !== capability.output_contract.media_type) {
      errors.push(`${recordLabel} extracted text media_type does not match the capability`);
    }
    if (record.extracted_text.encoding !== capability.output_contract.encoding) {
      errors.push(`${recordLabel} extracted text encoding does not match the capability`);
    }

    const originalPath = resolveRegularFile(root, record.original.path, `${recordLabel} original`, errors);
    const extractedPath = resolveRegularFile(root, record.extracted_text.path, `${recordLabel} extracted text`, errors);
    if (!originalPath || !extractedPath) continue;
    if (originalPath === extractedPath) {
      errors.push(`${recordLabel} original and extracted text must be different files`);
      continue;
    }

    const originalBytes = readFileSync(originalPath);
    const extractedBytes = readFileSync(extractedPath);
    if (sha256(originalBytes) !== record.original.sha256) {
      errors.push(`${recordLabel} original sha256 mismatch`);
    }
    if (sha256(extractedBytes) !== record.extracted_text.sha256) {
      errors.push(`${recordLabel} extracted text sha256 mismatch`);
    }
    const extractedText = decodeUtf8(extractedBytes, `${recordLabel} extracted text`, errors);
    const originalText = record.original.kind === 'text'
      ? decodeUtf8(originalBytes, `${recordLabel} original text`, errors)
      : null;
    if (extractedText === null || (record.original.kind === 'text' && originalText === null)) continue;

    const mappingIds = new Set();
    for (const mapping of record.mappings) {
      mappingCount += 1;
      if (mappingIds.has(mapping.id)) {
        errors.push(`${recordLabel} mapping id must be unique: ${mapping.id}`);
        continue;
      }
      mappingIds.add(mapping.id);
      validateMapping(mapping, {
        capability,
        extractedBytes,
        extractedText,
        originalText,
        recordId: record.id
      }, errors);
    }
  }

  if (errors.length) return errors;
  return {
    recordCount: extraction.records.length,
    mappingCount
  };
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const artifactDir = process.argv[2];
  if (!artifactDir) {
    console.error('Usage: node scripts/validate-source-extraction.mjs <artifact-dir>');
    process.exit(2);
  }
  const result = validateSourceExtraction(artifactDir);
  if (Array.isArray(result)) {
    console.error('Source extraction validation failed:');
    for (const error of result) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `Source extraction validation passed: ${artifactDir} (${result.recordCount} records and ${result.mappingCount} locator mappings)`
  );
}
