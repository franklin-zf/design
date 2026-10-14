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
import { computeArtifactDigest } from './lib/artifact-digest.mjs';
import { validateExecutionPlanBinding } from './lib/execution-plan-binding.mjs';
import { validateJsonInstance } from './lib/json-schema.mjs';
import {
  validateBrowserTestEvidence
} from './validate-browser-test-evidence.mjs';
import {
  operationalH0Requirements
} from './lib/operational-h0.mjs';
import { validateColorContract } from './validate-color-system.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const schema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/requirement-verification.schema.json'),
  'utf8'
));
const renderSpecSchema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/render-spec.schema.json'),
  'utf8'
));
const h0Ids = new Set(['VIS-ALIGN', 'VIS-LOCALE', 'VIS-ICON', 'VIS-COLOR']);
export { operationalH0Requirements };

function inside(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${stable(value[key])}`
    ).join(',')}}`;
  }
  return JSON.stringify(value);
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

function parseBoundJson(root, binding, label, errors) {
  const file = validateBoundFile(root, binding, label, errors);
  if (!file) return null;
  try {
    return {
      ...file,
      value: JSON.parse(file.bytes.toString('utf8'))
    };
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function withoutRenderBindings(spec) {
  return Object.fromEntries(Object.entries(spec || {}).filter(
    ([key]) => ![
      'artifact_digest',
      'resolved_plan_digest',
      'spec_digest'
    ].includes(key)
  ));
}

function statePairs(surfaceStates) {
  return (surfaceStates || []).map((value) => {
    const [width, ...stateParts] = String(value).split('-');
    return { width: Number(width), state: stateParts.join('-') };
  });
}

function renderState(profile, width, stateId) {
  return (profile?.profiles || [])
    .find((item) => item.width === width)
    ?.states?.find((state) => state.id === stateId);
}

function validateEvidenceKinds(requirement, errors) {
  const expectedKind = requirement.id === 'VIS-COLOR'
    ? 'screenshot'
    : 'browser-test';
  const kinds = new Set((requirement.evidence_refs || []).map((item) => item.kind));
  if (kinds.size !== 1 || !kinds.has(expectedKind)) {
    errors.push(
      `requirement ${requirement.id} evidence kind must be ${expectedKind}`
    );
  }
}

function validateScreenshotBindings(
  root,
  requirement,
  renderProfile,
  errors
) {
  const bindings = requirement.evidence_binding?.screenshots || [];
  const tupleIds = bindings.map((binding) => (
    `${binding.viewport}-${binding.state}-${binding.ref}`
  ));
  if (new Set(tupleIds).size !== tupleIds.length) {
    errors.push(`requirement ${requirement.id} screenshot bindings must be unique`);
  }
  for (const binding of bindings) {
    validateBoundFile(
      root,
      binding,
      `requirement ${requirement.id} screenshot ${binding.ref}`,
      errors
    );
    const state = renderState(renderProfile, binding.viewport, binding.state);
    const matches = (state?.segments || []).filter((segment) => (
      segment.screenshot_ref === binding.ref
      && segment.screenshot_sha256 === binding.sha256
    ));
    if (matches.length !== 1) {
      errors.push(
        `requirement ${requirement.id} screenshot ${binding.viewport}-`
        + `${binding.state} must match exactly one render-profile segment`
      );
    }
  }
  const expected = operationalH0Requirements.find(
    (item) => item.id === requirement.id
  );
  for (const pair of statePairs(expected?.surface_states)) {
    if (!bindings.some((binding) => (
      binding.viewport === pair.width && binding.state === pair.state
    ))) {
      errors.push(
        `requirement ${requirement.id} evidence binding is missing `
        + `${pair.width}-${pair.state}`
      );
    }
  }
}

function validateH0Assertions(requirement, plan, renderProfile, errors) {
  const expected = operationalH0Requirements.find(
    (item) => item.id === requirement.id
  );
  const pairs = statePairs(expected?.surface_states);
  for (const pair of pairs) {
    const state = renderState(renderProfile, pair.width, pair.state);
    if (!state) {
      errors.push(
        `requirement ${requirement.id} render profile is missing `
        + `${pair.width}-${pair.state}`
      );
      continue;
    }
    if (requirement.id === 'VIS-ALIGN') {
      const assertions = (state.assertions || []).filter(
        (assertion) => assertion.kind === 'relation'
      );
      if (assertions.length !== 4) {
        errors.push(
          `requirement VIS-ALIGN ${pair.width}-${pair.state} `
          + 'requires four relation assertions'
        );
      }
      for (const assertion of assertions) {
        const maximum = assertion.selector === '[data-icon]' ? 1 : 2;
        if (assertion.passed !== true
            || assertion.tolerance_px > maximum
            || assertion.actual?.delta_px_max > maximum) {
          errors.push(
            `requirement VIS-ALIGN ${pair.width}-${pair.state} `
            + `exceeds ${maximum}px tolerance`
          );
        }
      }
    }
    if (requirement.id === 'VIS-LOCALE') {
      const assertions = (state.assertions || []).filter(
        (assertion) => assertion.kind === 'locale'
      );
      const locale = plan.design_profile?.resolved_rules?.locale_policy;
      if (assertions.length !== 1
          || assertions[0].passed !== true
          || assertions[0].actual?.locale !== locale?.locale
          || assertions[0].actual?.violations?.length
            > locale?.visible_text_violation_limit
          || assertions[0].actual?.violations?.length
            > locale?.accessible_name_violation_limit) {
        errors.push(
          `requirement VIS-LOCALE ${pair.width}-${pair.state} `
          + 'must pass the resolved zh-CN locale policy'
        );
      }
    }
    if (requirement.id === 'VIS-ICON') {
      const assertions = (state.assertions || []).filter(
        (assertion) => assertion.kind === 'icon'
      );
      const actual = assertions[0]?.actual;
      if (assertions.length !== 1
          || assertions[0].passed !== true
          || actual?.violations?.length
          || actual?.families?.length !== 1
          || actual?.center_delta_px_max > 1
          || !/^[a-f0-9]{64}$/u.test(String(actual?.asset_sha256 || ''))
          || !actual?.provenance_id
          || (actual?.measurements || []).some((item) => (
            !['inline-local-symbol', 'local-sprite'].includes(item.resource_mode)
            || !item.accessible_name
          ))) {
        errors.push(
          `requirement VIS-ICON ${pair.width}-${pair.state} `
          + 'must pass local icon provenance, names, fallback, and centering'
        );
      }
    }
  }
  if (requirement.id === 'VIS-COLOR') {
    const theme = plan.design_profile?.resolved_theme || {};
    const colors = Object.fromEntries(Object.entries(theme).filter(
      ([, value]) => typeof value === 'string' && /^#[a-f0-9]{6}$/iu.test(value)
    ));
    const colorErrors = validateColorContract(
      theme.color_contract,
      colors,
      { label: 'operational dashboard color contract' }
    );
    errors.push(...colorErrors.map((error) => `requirement VIS-COLOR ${error}`));
  }
}

function validateOperationalEvidenceChain(
  root,
  manifest,
  requirements,
  artifactRefs,
  errors
) {
  const h0Requirements = requirements.filter((item) => h0Ids.has(item.id));
  if (h0Requirements.length !== h0Ids.size) return;
  const firstBinding = h0Requirements[0].evidence_binding;
  for (const requirement of h0Requirements) {
    validateEvidenceKinds(requirement, errors);
    for (const key of ['artifact', 'plan', 'render_spec', 'render_profile']) {
      if (stable(requirement.evidence_binding?.[key])
          !== stable(firstBinding?.[key])) {
        errors.push(`operational H0 ${key} bindings must be byte-identical`);
      }
    }
  }

  const artifact = validateBoundFile(
    root,
    firstBinding?.artifact,
    'operational H0 artifact binding',
    errors
  );
  const artifactRef = artifactRefs.find(
    (item) => item.ref === firstBinding?.artifact?.ref
  );
  if (!artifactRef
      || stable(artifactRef) !== stable(firstBinding?.artifact)) {
    errors.push('operational H0 artifact binding must equal artifact_refs');
  }
  const planFile = parseBoundJson(
    root,
    firstBinding?.plan,
    'operational H0 execution plan',
    errors
  );
  const renderSpecFile = parseBoundJson(
    root,
    firstBinding?.render_spec,
    'operational H0 render spec',
    errors
  );
  const renderProfileFile = parseBoundJson(
    root,
    firstBinding?.render_profile,
    'operational H0 render profile',
    errors
  );
  if (!artifact || !planFile || !renderSpecFile || !renderProfileFile) return;

  const plan = planFile.value;
  const renderSpec = renderSpecFile.value;
  const renderProfile = renderProfileFile.value;
  errors.push(...validateExecutionPlanBinding(plan, {
    artifactType: manifest?.artifact_type,
    templateId: manifest?.template_id
  }).map((error) => `operational H0 execution plan ${error}`));
  const plannedRoot = resolve(
    plan.artifact?.workspace_root || '',
    plan.artifact?.artifact_dir || ''
  );
  if (!existsSync(plannedRoot) || realpathSync(plannedRoot) !== root) {
    errors.push('operational H0 execution plan artifact root mismatch');
  }
  errors.push(...validateJsonInstance(renderSpecSchema, renderSpec).map(
    (error) => `operational H0 render spec ${error}`
  ));
  const renderPayload = withoutRenderBindings(renderSpec);
  if (renderSpec.spec_digest !== sha256(Buffer.from(stable(renderPayload)))) {
    errors.push('operational H0 render spec digest mismatch');
  }
  if (stable(plan.render_spec) !== stable({
    ...renderPayload,
    spec_digest: renderSpec.spec_digest
  })) {
    errors.push('operational H0 render spec does not match the bound plan');
  }
  let artifactDigest = null;
  try {
    artifactDigest = computeArtifactDigest(root);
  } catch (error) {
    errors.push(`operational H0 artifact digest failed: ${error.message}`);
  }
  if (renderSpec.artifact_digest !== artifactDigest
      || renderProfile.artifact_digest !== artifactDigest) {
    errors.push('operational H0 artifact digest chain mismatch');
  }
  if (renderSpec.resolved_plan_digest !== plan.resolved_gate_plan_digest
      || renderProfile.resolved_plan_digest !== plan.resolved_gate_plan_digest) {
    errors.push('operational H0 resolved plan digest chain mismatch');
  }
  if (renderProfile.schema_version !== 'design-render-profile/v2'
      || renderProfile.render_spec_digest !== renderSpec.spec_digest) {
    errors.push('operational H0 render profile/spec digest chain mismatch');
  }
  for (const requirement of h0Requirements) {
    validateScreenshotBindings(root, requirement, renderProfile, errors);
    validateH0Assertions(requirement, plan, renderProfile, errors);
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

const browserReviewedRequirementTypes = new Set([
  'content',
  'functional',
  'interaction',
  'responsive'
]);

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
  const browserRequirementIds = [];
  const browserEvidenceRefs = new Set();
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
    validateOperationalEvidenceChain(
      root,
      manifest,
      requirements,
      artifactRefs,
      errors
    );
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
    if (['P0', 'P1'].includes(requirement.priority)
        && browserReviewedRequirementTypes.has(requirement.type)
        && !String(requirement.id || '').startsWith('VIS-')) {
      if (!['browser-test', 'mixed'].includes(requirement.verification_method)) {
        errors.push(
          `${prefix} ${requirement.priority} ${requirement.type} `
          + 'must use browser-test or mixed verification'
        );
      }
      if (!evidenceRefs.some((binding) => binding.kind === 'browser-test')) {
        errors.push(
          `${prefix} ${requirement.priority} ${requirement.type} `
          + 'must include browser-test evidence'
        );
      } else {
        browserRequirementIds.push(requirement.id);
        for (const binding of evidenceRefs.filter(
          (item) => item.kind === 'browser-test'
        )) {
          browserEvidenceRefs.add(binding.ref);
        }
      }
    }
  }

  if (browserRequirementIds.length) {
    if (browserEvidenceRefs.size !== 1) {
      errors.push(
        'P0/P1 browser requirements must share one browser-test evidence record'
      );
    } else {
      const [evidenceRef] = browserEvidenceRefs;
      errors.push(...validateBrowserTestEvidence(root, {
        evidenceRef,
        expectedRequirementIds: browserRequirementIds
      }).map((error) => `browser evidence ${error}`));
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
