#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const schema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/requirement-verification.schema.json'),
  'utf8'
));

export const operationalH0Requirements = [
  {
    id: 'VIS-ALIGN',
    type: 'visual',
    priority: 'P0',
    requirement: '页面、区块、组件和 icon/text 使用声明锚点。',
    acceptance_criteria: [
      '页面、区块、组件和 icon/text 使用声明锚点',
      '边缘偏差不超过 2px，图标中心偏差不超过 1px'
    ],
    surface_states: ['1440-default', '390-default', '320-default'],
    verification_method: 'mixed'
  },
  {
    id: 'VIS-LOCALE',
    type: 'content',
    priority: 'P0',
    requirement: '默认 zh-CN，非白名单英文为 0。',
    acceptance_criteria: [
      '默认 zh-CN',
      '除品牌、技术 ID、原始字段和批准缩写外，英文泄漏为 0'
    ],
    surface_states: ['1440-default', '390-default', '320-default'],
    verification_method: 'mixed'
  },
  {
    id: 'VIS-ICON',
    type: 'visual',
    priority: 'P0',
    requirement: '单一 icon family、中文名称和 visible fallback。',
    acceptance_criteria: [
      '单一 icon family',
      '图标使用中文可见名称、accessible name 和 visible fallback',
      '图标资产本地化且 provenance 与授权可追溯'
    ],
    surface_states: ['1440-default', '390-default', '320-default'],
    verification_method: 'mixed'
  },
  {
    id: 'VIS-COLOR',
    type: 'visual',
    priority: 'P0',
    requirement: 'accent 与 semantic 状态颜色分离。',
    acceptance_criteria: [
      '蓝色只承担 action、selection 和 focus',
      'positive、warning 和 danger 与 accent 分离'
    ],
    surface_states: ['1440-default', '1440-error', '390-error', '320-error'],
    verification_method: 'mixed'
  }
];

function inside(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalizeText(value) {
  return String(value).replace(/\s+/gu, ' ').trim();
}

function readArtifactFile(root, ref, label) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).includes('..')) {
    throw new Error(`${label} must be a safe artifact-relative path`);
  }
  const path = resolve(root, ref);
  if (!inside(root, path) || !existsSync(path) || lstatSync(path).isSymbolicLink()) {
    throw new Error(`${label} is missing, unsafe, or a symlink: ${ref}`);
  }
  const real = realpathSync(path);
  if (!inside(root, real) || !statSync(real).isFile()) {
    throw new Error(`${label} must resolve to a regular artifact file: ${ref}`);
  }
  return { path: real, bytes: readFileSync(real) };
}

function validateBoundFile(root, binding, label, errors) {
  try {
    const file = readArtifactFile(root, binding?.ref, label);
    if (sha256(file.bytes) !== binding?.sha256) {
      errors.push(`${label} SHA-256 mismatch: ${binding?.ref || 'unknown'}`);
    }
    return file;
  } catch (error) {
    errors.push(error.message);
    return null;
  }
}

function expectedCoverage(requirements) {
  const required = requirements.filter((item) => (
    item.priority === 'P0' || item.priority === 'P1'
  ));
  const withEvidence = required.filter((item) => item.evidence_refs?.length).length;
  const passed = required.filter((item) => item.status === 'passed').length;
  return {
    p0_p1_total: required.length,
    p0_p1_with_evidence: withEvidence,
    p0_p1_passed: passed,
    status: passed === required.length && withEvidence === required.length
      ? 'complete'
      : 'incomplete'
  };
}

export function validateRequirementVerification(directory, options = {}) {
  const errors = [];
  if (!existsSync(directory)) return ['artifact directory does not exist'];
  const root = realpathSync(directory);
  let manifest = null;
  try {
    manifest = JSON.parse(
      readArtifactFile(root, 'manifest.json', 'artifact manifest')
        .bytes.toString('utf8')
    );
  } catch (error) {
    errors.push(error.message);
  }
  let record;
  try {
    const recordFile = readArtifactFile(
      root,
      options.recordRef || 'requirement-verification.json',
      'requirement verification'
    );
    record = JSON.parse(recordFile.bytes.toString('utf8'));
  } catch (error) {
    return [error.message];
  }

  errors.push(...validateJsonInstance(schema, record).map(
    (error) => `requirement-verification ${error}`
  ));
  if (!record || typeof record !== 'object') return [...new Set(errors)].sort();

  const artifactRefs = record.artifact_refs || [];
  const artifactIds = artifactRefs.map((item) => item.ref);
  if (new Set(artifactIds).size !== artifactIds.length) {
    errors.push('artifact_refs must use unique ref values');
  }
  for (const requiredRef of ['index.html', 'manifest.json']) {
    if (!artifactIds.includes(requiredRef)) {
      errors.push(`artifact_refs must bind ${requiredRef}`);
    }
  }
  for (const binding of artifactRefs) {
    validateBoundFile(root, binding, `artifact ref ${binding?.ref || 'unknown'}`, errors);
  }

  const sourceRefs = record.source_refs || [];
  const sourceIds = sourceRefs.map((item) => item.ref);
  if (new Set(sourceIds).size !== sourceIds.length) {
    errors.push('source_refs must use unique ref values');
  }
  const sourceFiles = new Map();
  for (const binding of sourceRefs) {
    const file = validateBoundFile(
      root,
      binding,
      `source ref ${binding?.ref || 'unknown'}`,
      errors
    );
    if (file) sourceFiles.set(binding.ref, file);
  }

  const requirements = record.requirements || [];
  const requirementIds = requirements.map((item) => item.id);
  if (new Set(requirementIds).size !== requirementIds.length) {
    errors.push('requirement ids must be unique');
  }
  const operational = manifest?.style_preset === 'operational-dashboard'
    || ['operational-dashboard', 'operational-product'].includes(
      manifest?.template_id
    );
  if (operational) {
    for (const expected of operationalH0Requirements) {
      const matches = requirements.filter((item) => item.id === expected.id);
      if (matches.length !== 1) {
        errors.push(
          `operational requirement verification requires exactly one `
          + `${expected.id} requirement`
        );
        continue;
      }
      const actual = matches[0];
      for (const field of ['type', 'priority', 'verification_method']) {
        if (actual[field] !== expected[field]) {
          errors.push(
            `requirement ${expected.id} ${field} must equal `
            + JSON.stringify(expected[field])
          );
        }
      }
      for (const criterion of expected.acceptance_criteria) {
        if (!actual.acceptance_criteria?.includes(criterion)) {
          errors.push(
            `requirement ${expected.id} is missing acceptance criterion: `
            + criterion
          );
        }
      }
      for (const state of expected.surface_states) {
        if (!actual.surface_states?.includes(state)) {
          errors.push(
            `requirement ${expected.id} is missing surface state: ${state}`
          );
        }
      }
    }
  }
  for (const requirement of requirements) {
    const prefix = `requirement ${requirement.id || 'unknown'}`;
    const source = sourceFiles.get(requirement.source_ref);
    if (!sourceIds.includes(requirement.source_ref)) {
      errors.push(`${prefix} source_ref must reference source_refs`);
    } else if (source) {
      const sourceText = normalizeText(source.bytes.toString('utf8'));
      const quote = normalizeText(requirement.source_quote);
      if (!quote || !sourceText.includes(quote)) {
        errors.push(`${prefix} source_quote was not found in ${requirement.source_ref}`);
      }
    }

    const evidenceRefs = requirement.evidence_refs || [];
    const evidenceIds = evidenceRefs.map((item) => item.ref);
    if (new Set(evidenceIds).size !== evidenceIds.length) {
      errors.push(`${prefix} evidence_refs must use unique ref values`);
    }
    for (const binding of evidenceRefs) {
      validateBoundFile(
        root,
        binding,
        `${prefix} evidence ${binding?.ref || 'unknown'}`,
        errors
      );
    }
    for (const ref of requirement.implementation_refs || []) {
      try {
        readArtifactFile(root, ref, `${prefix} implementation ref`);
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (requirement.status === 'passed' && !evidenceRefs.length) {
      errors.push(`${prefix} passed requires evidence`);
    }
    if (requirement.status === 'passed' && !requirement.reviewer?.trim()) {
      errors.push(`${prefix} passed requires reviewer`);
    }
    if (['P0', 'P1'].includes(requirement.priority)
        && requirement.status !== 'passed') {
      errors.push(`${prefix} ${requirement.priority} must be passed`);
    }
    if (['P0', 'P1'].includes(requirement.priority) && !evidenceRefs.length) {
      errors.push(`${prefix} ${requirement.priority} must have evidence`);
    }
  }

  const expected = expectedCoverage(requirements);
  for (const [field, value] of Object.entries(expected)) {
    if (record.coverage?.[field] !== value) {
      errors.push(
        `coverage.${field} must equal recomputed value ${JSON.stringify(value)}`
      );
    }
  }
  if (expected.status !== 'complete') {
    errors.push('P0/P1 requirement coverage is incomplete');
  }
  return [...new Set(errors)].sort();
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const directory = process.argv[2];
  const recordArgument = process.argv.find((argument) => (
    argument.startsWith('--record=')
  ));
  if (!directory) {
    console.error(
      'Usage: node scripts/validate-requirement-verification.mjs '
      + '<artifact-dir> [--record=<ref>]'
    );
    process.exit(2);
  }
  const errors = validateRequirementVerification(directory, {
    recordRef: recordArgument?.slice('--record='.length)
  });
  if (errors.length) {
    console.error('Requirement verification validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Requirement verification validation passed: ${directory}`);
}
