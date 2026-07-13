#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-data-provenance.mjs <artifact-dir>');
  process.exit(2);
}
const executeTrusted = process.argv.includes('--execute-trusted');

const errors = [];
const provenancePath = join(dir, 'data-provenance.json');
const sha256Pattern = /^[a-f0-9]{64}$/;
const artifactRoot = existsSync(dir) ? realpathSync(dir) : null;

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function isInside(root, file) {
  const rel = relative(root, file);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function resolveArtifactFile(pathRef, label) {
  if (!artifactRoot) {
    errors.push('Artifact directory does not exist.');
    return null;
  }
  if (typeof pathRef !== 'string' || !pathRef) {
    errors.push(`${label} must be a non-empty relative path.`);
    return null;
  }
  if (isAbsolute(pathRef)) {
    errors.push(`${label} must be relative to the artifact root: ${pathRef}`);
    return null;
  }
  if (pathRef.includes('\\') || pathRef.split('/').some((part) => !part || part === '.' || part === '..')) {
    errors.push(`${label} must use a normalized POSIX-style relative path: ${pathRef}`);
    return null;
  }

  const candidate = resolve(artifactRoot, pathRef);
  if (!isInside(artifactRoot, candidate)) {
    errors.push(`${label} escapes the artifact root: ${pathRef}`);
    return null;
  }
  if (!existsSync(candidate)) {
    errors.push(`${label} is not readable: ${pathRef}`);
    return null;
  }

  const real = realpathSync(candidate);
  if (!isInside(artifactRoot, real)) {
    errors.push(`${label} resolves outside the artifact root: ${pathRef}`);
    return null;
  }
  if (lstatSync(candidate).isSymbolicLink()) {
    errors.push(`${label} must not be a symbolic link: ${pathRef}`);
    return null;
  }
  if (!statSync(real).isFile()) {
    errors.push(`${label} must resolve to a regular file: ${pathRef}`);
    return null;
  }
  return real;
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function verifyExecutionHash(root, pathRef, expected, label, phase) {
  const candidate = resolve(root, pathRef || '');
  if (!pathRef || !isInside(root, candidate)) {
    errors.push(`${label} is invalid after ${phase}: ${pathRef || '(missing)'}`);
    return;
  }
  if (!existsSync(candidate)) {
    errors.push(`${label} is missing after ${phase}: ${pathRef}`);
    return;
  }

  try {
    const real = realpathSync(candidate);
    if (!isInside(root, real)) {
      errors.push(`${label} resolves outside the artifact root after ${phase}: ${pathRef}`);
      return;
    }
    if (lstatSync(candidate).isSymbolicLink() || !statSync(real).isFile()) {
      errors.push(`${label} must remain a regular non-symlink file after ${phase}: ${pathRef}`);
      return;
    }
    const actual = hashFile(real);
    if (actual !== expected) {
      errors.push(`${label} hash mismatch after ${phase}: expected ${expected}, got ${actual}.`);
    }
  } catch (error) {
    errors.push(`${label} could not be verified after ${phase}: ${error.message}`);
  }
}

function verifyAllExecutionHashes(root, provenance, phase) {
  for (const source of provenance.sources || []) {
    verifyExecutionHash(root, source.path, source.sha256, `source ${source.id}`, phase);
  }
  for (const derivation of provenance.derivations || []) {
    verifyExecutionHash(root, derivation.output_ref, derivation.output_sha256, `output ${derivation.id}`, phase);
    verifyExecutionHash(root, derivation.code_ref, derivation.code_sha256, `code ${derivation.id}`, phase);
    for (const test of derivation.tests || []) {
      verifyExecutionHash(root, test.test_ref, test.test_sha256, `test ${test.test_ref}`, phase);
    }
  }
}

function validateHash(expected, file, label) {
  if (!sha256Pattern.test(String(expected || ''))) {
    errors.push(`${label} must be a lowercase SHA-256 value.`);
    return;
  }
  if (!file) return;
  const actual = hashFile(file);
  if (actual !== expected) {
    errors.push(`${label} hash mismatch: expected ${expected}, got ${actual}.`);
  }
}

function validateCommand(command, label) {
  if (!Array.isArray(command) || !command.length || command.some((part) => typeof part !== 'string' || !part)) {
    errors.push(`${label} must be a non-empty argv array.`);
  }
}

function assertRolePath(pathRef, prefix, label) {
  if (typeof pathRef === 'string' && !pathRef.startsWith(`${prefix}/`)) {
    errors.push(`${label} must be inside ${prefix}/: ${pathRef}`);
  }
}

function runCommand(command, cwd, label) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    shell: false,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 1048576,
    env: { ...process.env, TZ: 'UTC', LC_ALL: 'C', LANG: 'C' }
  });
  if (result.error) {
    errors.push(`${label} failed to start: ${result.error.message}`);
    return null;
  }
  if (result.signal) {
    errors.push(`${label} terminated by signal: ${result.signal}`);
    return null;
  }
  if (result.status !== 0) {
    errors.push(`${label} exited with ${result.status}: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.status;
}

if (!existsSync(provenancePath)) errors.push('Missing data-provenance.json.');
const provenance = existsSync(provenancePath) ? readJson(provenancePath, 'data-provenance.json') : null;

if (provenance) {
  if (provenance.schema_version !== 'design-data-provenance/v1') {
    errors.push('data-provenance.schema_version must be design-data-provenance/v1.');
  }
  if (!Array.isArray(provenance.sources) || !provenance.sources.length) {
    errors.push('data-provenance.sources must be a non-empty array.');
  }
  if (!Array.isArray(provenance.derivations) || !provenance.derivations.length) {
    errors.push('data-provenance.derivations must be a non-empty array.');
  }

  const sourceIds = new Set();
  const derivationIds = new Set();
  const sourceFiles = [];

  for (const [index, source] of (provenance.sources || []).entries()) {
    const label = `sources[${index}]`;
    if (!source?.id) errors.push(`${label} missing id.`);
    if (sourceIds.has(source?.id)) errors.push(`Duplicate source id: ${source.id}`);
    if (source?.id) sourceIds.add(source.id);
    const file = resolveArtifactFile(source?.path, `${label}.path`);
    assertRolePath(source?.path, 'source', `${label}.path`);
    validateHash(source?.sha256, file, `${label}.sha256`);
    if (file) sourceFiles.push({ id: source.id, file, stat: statSync(file) });
  }

  for (const [index, derivation] of (provenance.derivations || []).entries()) {
    const label = `derivations[${index}]`;
    if (!derivation?.id) errors.push(`${label} missing id.`);
    if (derivationIds.has(derivation?.id)) errors.push(`Duplicate derivation id: ${derivation.id}`);
    if (derivation?.id) derivationIds.add(derivation.id);

    if (!Array.isArray(derivation?.source_ids) || !derivation.source_ids.length) {
      errors.push(`${label}.source_ids must be a non-empty array.`);
    }
    for (const sourceId of derivation?.source_ids || []) {
      if (!sourceIds.has(sourceId)) errors.push(`${label} references unknown source id: ${sourceId}`);
    }
    if (typeof derivation?.formula !== 'string' || !derivation.formula.trim()) {
      errors.push(`${label}.formula must be non-empty.`);
    }
    for (const field of ['unit', 'denominator', 'time_window']) {
      if (typeof derivation?.[field] !== 'string' || !derivation[field].trim()) {
        errors.push(`${label}.${field} must be non-empty.`);
      }
    }
    if (!Array.isArray(derivation?.filters)) errors.push(`${label}.filters must be an array.`);
    validateCommand(derivation?.command, `${label}.command`);
    if (Array.isArray(derivation?.command) && derivation?.code_ref && !derivation.command.includes(derivation.code_ref)) {
      errors.push(`${label}.command must reference code_ref ${derivation.code_ref}.`);
    }
    if (derivation?.expected_exit_code !== 0 || derivation?.observed_exit_code !== 0) {
      errors.push(`${label} expected_exit_code and observed_exit_code must be 0.`);
    }

    const outputFile = resolveArtifactFile(derivation?.output_ref, `${label}.output_ref`);
    const codeFile = resolveArtifactFile(derivation?.code_ref, `${label}.code_ref`);
    assertRolePath(derivation?.output_ref, 'derived', `${label}.output_ref`);
    assertRolePath(derivation?.code_ref, 'calculations', `${label}.code_ref`);
    validateHash(derivation?.output_sha256, outputFile, `${label}.output_sha256`);
    validateHash(derivation?.code_sha256, codeFile, `${label}.code_sha256`);

    if (outputFile) {
      const outputStat = statSync(outputFile);
      for (const source of sourceFiles) {
        if (outputFile === source.file || (outputStat.dev === source.stat.dev && outputStat.ino === source.stat.ino)) {
          errors.push(`${label}.output_ref aliases raw source ${source.id}.`);
        }
      }
    }

    if (!Array.isArray(derivation?.tests) || !derivation.tests.length) {
      errors.push(`${label}.tests must be a non-empty array.`);
    }
    for (const [testIndex, test] of (derivation?.tests || []).entries()) {
      const testLabel = `${label}.tests[${testIndex}]`;
      const testFile = resolveArtifactFile(test?.test_ref, `${testLabel}.test_ref`);
      assertRolePath(test?.test_ref, 'calculations', `${testLabel}.test_ref`);
      validateHash(test?.test_sha256, testFile, `${testLabel}.test_sha256`);
      validateCommand(test?.command, `${testLabel}.command`);
      if (Array.isArray(test?.command) && test?.test_ref && !test.command.includes(test.test_ref)) {
        errors.push(`${testLabel}.command must reference test_ref ${test.test_ref}.`);
      }
      if (test?.expected_exit_code !== 0) {
        errors.push(`${testLabel}.expected_exit_code must be 0.`);
      }
      if (test?.observed_exit_code !== 0) {
        errors.push(`${testLabel}.observed_exit_code must be 0.`);
      }
    }
  }

  if (executeTrusted && errors.length === 0) {
    const tempParent = mkdtempSync(join(tmpdir(), 'design-provenance-'));
    const tempArtifact = join(tempParent, basename(artifactRoot));
    try {
      cpSync(artifactRoot, tempArtifact, { recursive: true });
      const executionRoot = realpathSync(tempArtifact);
      for (const derivation of provenance.derivations || []) {
        runCommand(derivation.command, executionRoot, `calculation command ${derivation.id}`);
        verifyAllExecutionHashes(executionRoot, provenance, `calculation ${derivation.id}`);
        for (const test of derivation.tests || []) {
          runCommand(test.command, executionRoot, `test command ${test.test_ref}`);
          verifyAllExecutionHashes(executionRoot, provenance, `test ${test.test_ref}`);
        }
      }
    } finally {
      rmSync(tempParent, { recursive: true, force: true });
    }
  }
}

if (errors.length) {
  console.error('Data provenance validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Data provenance validation passed: ${dir}`);
