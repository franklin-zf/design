#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const modulePath = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(modulePath), '..');
export const currentCompilerVersion = 'design-risk-compiler/v2';
export const planSchemaVersion = 'design-resolved-gate-plan/v2';

export const automaticGateIds = new Set([
  'validate-aesthetic-contract', 'validate-asset-contract', 'validate-claim-map',
  'validate-data-provenance', 'validate-design-output', 'validate-design-system-package',
  'validate-evidence-contract', 'validate-layout-lock', 'validate-poster-anti-ai-slop',
  'validate-poster-contract', 'validate-summary-map', 'validate-visual-rhythm',
  'render-smoke', 'tweakable-smoke'
]);

const supportedArtifactTypes = new Set([
  'data-report', 'dashboard', 'chart-frame', 'html-deck', 'ppt-handoff', 'poster',
  'screenshot-evidence', 'tweakable-artifact', 'design-system', 'multi-artifact'
]);
const standardArtifactTypes = new Set([
  'data-report', 'dashboard', 'chart-frame', 'html-deck', 'ppt-handoff',
  'screenshot-evidence', 'design-system'
]);
const summaryMappedArtifactTypes = new Set([
  'data-report', 'dashboard', 'chart-frame', 'html-deck', 'ppt-handoff'
]);
const gateOrder = [
  'validate-data-provenance', 'render-smoke', 'validate-evidence-contract', 'validate-design-output',
  'validate-summary-map', 'validate-claim-map', 'validate-design-system-package',
  'validate-aesthetic-contract', 'validate-asset-contract', 'validate-layout-lock',
  'validate-visual-rhythm', 'validate-poster-contract', 'validate-poster-anti-ai-slop',
  'tweakable-smoke'
];
const gateIndex = new Map(gateOrder.map((id, index) => [id, index]));

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256Value(value) {
  return createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stableStringify(value)).digest('hex');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function safeRelative(value) {
  if (!isNonEmptyString(value) || isAbsolute(value)) return false;
  const normalized = normalize(value);
  return normalized !== '..' && !normalized.startsWith(`..${sep}`);
}

function pushMissing(missing, condition, path) {
  if (condition) missing.push(path);
}

export function validateExecutionRequest(raw) {
  const missing = [];
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { status: 'needs_clarification', missing_fields: ['request'], errors: ['request must be an object'] };
  }
  if (raw.schema_version !== 'design-execution-request/v2') {
    errors.push('schema_version must be design-execution-request/v2; legacy v1 requests are import-only and must be recompiled');
  }
  pushMissing(missing, !isNonEmptyString(raw.goal), 'goal');
  pushMissing(missing, !isNonEmptyString(raw.use_scenario), 'use_scenario');
  pushMissing(missing, !Array.isArray(raw.audience) || raw.audience.length === 0 || raw.audience.some((v) => !isNonEmptyString(v)), 'audience');
  pushMissing(missing, !raw.source_materials || typeof raw.source_materials !== 'object', 'source_materials');
  pushMissing(missing, !raw.output_surface || typeof raw.output_surface !== 'object', 'output_surface');
  pushMissing(missing, !raw.constraints || typeof raw.constraints !== 'object', 'constraints');
  pushMissing(missing, !raw.conditional_policies || typeof raw.conditional_policies !== 'object', 'conditional_policies');

  if (raw.source_materials?.mode === 'none') {
    pushMissing(missing, !isNonEmptyString(raw.source_materials.claim_scope), 'source_materials.claim_scope');
  } else if (raw.source_materials?.mode === 'provided') {
    pushMissing(missing, !Array.isArray(raw.source_materials.items) || raw.source_materials.items.length === 0, 'source_materials.items');
    for (const [index, item] of (raw.source_materials.items || []).entries()) {
      if (!isNonEmptyString(item?.id)) missing.push(`source_materials.items[${index}].id`);
      if (!safeRelative(item?.path)) errors.push(`source_materials.items[${index}].path must be a safe workspace-relative path`);
      if (!/^[a-f0-9]{64}$/.test(String(item?.sha256 || ''))) errors.push(`source_materials.items[${index}].sha256 must be lowercase SHA-256`);
    }
  } else if (raw.source_materials) {
    errors.push('source_materials.mode must be none or provided');
  }

  for (const field of ['artifact_dir', 'artifact_type', 'template_id']) {
    pushMissing(missing, !isNonEmptyString(raw.output_surface?.[field]), `output_surface.${field}`);
  }
  if (raw.output_surface?.artifact_dir && !safeRelative(raw.output_surface.artifact_dir)) {
    errors.push('output_surface.artifact_dir must be a safe workspace-relative path');
  }
  if (raw.output_surface?.artifact_type && !supportedArtifactTypes.has(raw.output_surface.artifact_type)) {
    errors.push(`unsupported artifact type: ${raw.output_surface.artifact_type}`);
  }
  pushMissing(missing, !isNonEmptyString(raw.constraints?.workspace_root), 'constraints.workspace_root');
  if (raw.constraints?.workspace_root && !isAbsolute(raw.constraints.workspace_root)) {
    errors.push('constraints.workspace_root must be an absolute path');
  }
  for (const field of ['sensitive_data', 'publication_target', 'multi_artifact', 'interactive', 'reversible', 'internal_only', 'direction_known']) {
    pushMissing(missing, typeof raw.constraints?.[field] !== 'boolean', `constraints.${field}`);
  }
  if (!Array.isArray(raw.constraints?.changed_paths)) missing.push('constraints.changed_paths');
  for (const [index, path] of (raw.constraints?.changed_paths || []).entries()) {
    if (!safeRelative(path)) errors.push(`constraints.changed_paths[${index}] must be a safe workspace-relative path`);
  }

  const derived = raw.conditional_policies?.derived_data;
  pushMissing(missing, !derived || typeof derived !== 'object', 'conditional_policies.derived_data');
  if (derived?.mode === 'derived') {
    for (const field of ['metric', 'unit', 'denominator', 'grain', 'period', 'missing_data_policy', 'freshness_policy']) {
      pushMissing(missing, !isNonEmptyString(derived[field]), `conditional_policies.derived_data.${field}`);
    }
    pushMissing(missing, !derived.execution || typeof derived.execution !== 'object', 'conditional_policies.derived_data.execution');
  } else if (derived && derived.mode !== 'none') {
    errors.push('conditional_policies.derived_data.mode must be none or derived');
  }
  const schematic = raw.conditional_policies?.schematic;
  pushMissing(missing, !schematic || typeof schematic.enabled !== 'boolean', 'conditional_policies.schematic.enabled');
  if (schematic?.enabled) pushMissing(missing, !isNonEmptyString(schematic.disclosure), 'conditional_policies.schematic.disclosure');
  const render = raw.conditional_policies?.render;
  pushMissing(missing, !render || !Array.isArray(render.viewports), 'conditional_policies.render.viewports');
  const widths = new Set((render?.viewports || []).map(Number));
  for (const required of [1440, 390, 320]) if (!widths.has(required)) errors.push(`conditional_policies.render.viewports must include ${required}`);
  pushMissing(missing, !Array.isArray(render?.segments) || render.segments.length === 0, 'conditional_policies.render.segments');
  pushMissing(missing, !Array.isArray(render?.states) || render.states.length === 0, 'conditional_policies.render.states');
  const segmentIds = new Set();
  for (const [index, segment] of (render?.segments || []).entries()) {
    if (!isNonEmptyString(segment?.id) || segmentIds.has(segment.id)) errors.push(`conditional_policies.render.segments[${index}] requires unique id`);
    else segmentIds.add(segment.id);
    if (!['selector', 'scroll_fraction'].includes(segment?.kind)) errors.push(`conditional_policies.render.segments[${index}].kind is invalid`);
    if (segment?.kind === 'selector' && !isNonEmptyString(segment.selector)) errors.push(`conditional_policies.render.segments[${index}].selector is required`);
    if (segment?.kind === 'scroll_fraction' && (typeof segment.fraction !== 'number' || segment.fraction < 0 || segment.fraction > 1)) errors.push(`conditional_policies.render.segments[${index}].fraction must be 0..1`);
  }
  const stateIds = new Set();
  for (const [index, state] of (render?.states || []).entries()) {
    if (!isNonEmptyString(state?.id) || stateIds.has(state.id)) errors.push(`conditional_policies.render.states[${index}] requires unique id`);
    else stateIds.add(state.id);
    if (!Array.isArray(state?.setup)) errors.push(`conditional_policies.render.states[${index}].setup must be an array`);
    if (!Array.isArray(state?.assertions) || !state.assertions.length) errors.push(`conditional_policies.render.states[${index}].assertions must be non-empty`);
  }
  if (!['deny_all', 'allowlist'].includes(render?.remote_policy?.mode) || !Array.isArray(render?.remote_policy?.allowed_origins)) {
    errors.push('conditional_policies.render.remote_policy must declare mode and allowed_origins');
  }
  pushMissing(missing, !isNonEmptyString(raw.conditional_policies?.accessibility?.standard), 'conditional_policies.accessibility.standard');
  pushMissing(missing, !isNonEmptyString(raw.conditional_policies?.privacy?.classification), 'conditional_policies.privacy.classification');
  if (!['auto', 'express', 'standard', 'assured'].includes(raw.requested_profile)) errors.push('requested_profile must be auto, express, standard, or assured');

  return {
    status: missing.length || errors.length ? 'needs_clarification' : 'accepted',
    missing_fields: [...new Set(missing)].sort(),
    errors: [...new Set(errors)].sort()
  };
}

function normalizeRequest(raw) {
  const request = structuredClone(raw);
  request.goal = request.goal.trim();
  request.use_scenario = request.use_scenario.trim();
  request.audience = [...new Set(request.audience.map((v) => v.trim()))].sort();
  request.output_surface.artifact_dir = normalize(request.output_surface.artifact_dir).split('\\').join('/');
  request.constraints.changed_paths = [...new Set(request.constraints.changed_paths.map((v) => normalize(v).split('\\').join('/')))].sort();
  if (request.source_materials.mode === 'provided') {
    request.source_materials.items = [...request.source_materials.items].sort((a, b) => a.id.localeCompare(b.id));
  }
  request.conditional_policies.render.viewports = [...new Set(request.conditional_policies.render.viewports.map(Number))].sort((a, b) => b - a);
  request.conditional_policies.render.segments = [...request.conditional_policies.render.segments].sort((a, b) => a.id.localeCompare(b.id));
  request.conditional_policies.render.states = [...request.conditional_policies.render.states].sort((a, b) => a.id.localeCompare(b.id));
  request.conditional_policies.render.remote_policy.allowed_origins = [...new Set(request.conditional_policies.render.remote_policy.allowed_origins)].sort();
  if (request.conditional_policies.derived_data.mode === 'derived') {
    const execution = request.conditional_policies.derived_data.execution;
    execution.read_allowlist = [...new Set(execution.read_allowlist || [])].sort();
    execution.write_allowlist = [...new Set(execution.write_allowlist || [])].sort();
  }
  return request;
}

function classifyExecution(request, options) {
  const derived = request.conditional_policies.derived_data;
  if (derived.mode === 'none') {
    return { code_class: 'trusted', decision: 'auto_standard_sandbox', spawn_allowed: false, sandbox_profile: 'standard-readonly-skill', reason_codes: ['no-derived-code'] };
  }
  const execution = derived.execution || {};
  const unsafe = [];
  if (execution.kind === 'untrusted') unsafe.push('declared-untrusted');
  if (execution.dynamic_shell) unsafe.push('dynamic-shell');
  if (execution.unknown_binary) unsafe.push('unknown-binary');
  if (execution.needs_network) unsafe.push('network-required');
  if (execution.reads_environment_secrets) unsafe.push('environment-secrets');
  if (execution.spawns_subprocesses) unsafe.push('nested-subprocess');
  if (!safeRelative(execution.entrypoint)) unsafe.push('unsafe-entrypoint');
  if (!/^[a-f0-9]{64}$/.test(String(execution.code_sha256 || ''))) unsafe.push('missing-code-hash');
  if (!safeRelative(execution.dependency_lock_ref)) unsafe.push('unsafe-dependency-lock');
  if (!/^[a-f0-9]{64}$/.test(String(execution.dependency_lock_sha256 || ''))) unsafe.push('missing-dependency-lock-hash');
  if (!['node'].includes(execution.interpreter)) unsafe.push('unknown-interpreter');
  if (!Array.isArray(execution.argv) || execution.argv.length > 16 || execution.argv.some((v) => typeof v !== 'string' || v.length > 4096)) unsafe.push('invalid-argv');
  if (!Number.isInteger(execution.timeout_ms) || execution.timeout_ms < 1 || execution.timeout_ms > 30000) unsafe.push('invalid-timeout-limit');
  if (!Number.isInteger(execution.max_output_bytes) || execution.max_output_bytes < 1 || execution.max_output_bytes > 1048576) unsafe.push('invalid-output-limit');
  if (!isNonEmptyString(execution.resource_limiter_id)) unsafe.push('missing-resource-limiter-id');
  for (const field of ['read_allowlist', 'write_allowlist']) {
    if (!Array.isArray(execution[field]) || execution[field].some((path) => !safeRelative(path))) unsafe.push(`invalid-${field.replace('_', '-')}`);
  }
  if (unsafe.length) {
    return { code_class: 'untrusted', decision: 'zero_spawn', spawn_allowed: false, sandbox_profile: 'none', reason_codes: [...new Set(unsafe)].sort() };
  }
  const registry = options.trustedCodeRegistry || [];
  const trusted = registry.find((entry) => entry.id === execution.registry_id
    && entry.entrypoint === execution.entrypoint
    && entry.code_sha256 === execution.code_sha256
    && entry.dependency_lock_ref === execution.dependency_lock_ref
    && entry.dependency_lock_sha256 === execution.dependency_lock_sha256);
  if (execution.kind === 'trusted' && trusted) {
    return { code_class: 'trusted', decision: 'auto_standard_sandbox', spawn_allowed: true, sandbox_profile: 'standard-readonly-skill', reason_codes: ['registry-and-hashes-match'] };
  }
  if (execution.kind === 'trusted' && !trusted) {
    return { code_class: 'untrusted', decision: 'zero_spawn', spawn_allowed: false, sandbox_profile: 'none', reason_codes: ['trusted-registry-mismatch'] };
  }
  return { code_class: 'restricted', decision: 'auto_disposable_sandbox', spawn_allowed: true, sandbox_profile: 'disposable-no-network-no-secrets', reason_codes: ['safe-local-code-not-trusted'] };
}

function classifyProfile(request, policy) {
  const c = request.constraints;
  const assured = policy.code_class !== 'trusted' || c.sensitive_data || c.publication_target || c.multi_artifact
    || c.interactive || !c.reversible || !c.internal_only || !c.direction_known || request.requested_profile === 'assured';
  if (assured) return 'assured';
  if (request.source_materials.mode === 'provided' || standardArtifactTypes.has(request.output_surface.artifact_type)
    || request.requested_profile === 'standard') return 'standard';
  return 'express';
}

function gateStage(id) {
  if (id === 'validate-data-provenance') return 'isolated_execution';
  if (id === 'render-smoke' || id === 'tweakable-smoke') return 'browser';
  return 'static';
}

function automaticGate(id) {
  const stage = gateStage(id);
  return { gate_id: id, stage, depends_on: [], cacheable: stage === 'static', timeout_ms: stage === 'browser' ? 120000 : 30000, adapter_args: [] };
}

export function compileExecutionPlan(rawRequest, options = {}) {
  const validation = validateExecutionRequest(rawRequest);
  if (validation.status !== 'accepted') {
    return { schema_version: 'design-request-validation-result/v2', status: 'needs_clarification', ...validation };
  }
  const request = normalizeRequest(rawRequest);
  const registry = options.registry;
  if (!registry || !Array.isArray(registry.templates)) throw new Error('template registry is required');
  const template = registry.templates.find((item) => item.id === request.output_surface.template_id);
  if (!template) throw new Error(`unknown template: ${request.output_surface.template_id}`);
  if (!template.artifact_types?.includes(request.output_surface.artifact_type)) throw new Error('template does not support requested artifact type');
  const registered = (template.validation_gate_ids || template.validation_gates || []).map((gate) => String(gate).split(' ')[0]);
  for (const id of registered) if (!automaticGateIds.has(id) && id !== 'manual-reviewer-pass') throw new Error(`unknown gate in registry: ${id}`);
  const supplemental = ['validate-evidence-contract'];
  if (request.source_materials.mode === 'provided' && summaryMappedArtifactTypes.has(request.output_surface.artifact_type)) supplemental.push('validate-summary-map', 'validate-claim-map');
  if (request.conditional_policies.derived_data.mode === 'derived') supplemental.push('validate-data-provenance');
  const gateIds = [...new Set([...registered.filter((id) => id !== 'manual-reviewer-pass'), ...supplemental])]
    .sort((a, b) => (gateIndex.get(a) ?? 999) - (gateIndex.get(b) ?? 999));
  const executionPolicy = classifyExecution(request, options);
  const profile = classifyProfile(request, executionPolicy);
  const automaticGates = gateIds.map(automaticGate);
  const evidenceGate = automaticGates.find((gate) => gate.gate_id === 'validate-evidence-contract');
  if (evidenceGate && gateIds.includes('render-smoke')) evidenceGate.depends_on = ['render-smoke'];
  const humanGates = [
    { gate_id: 'real-surface-visual-review', purpose: 'quality_review', cacheable: false },
    ...(request.source_materials.mode === 'provided' ? [{ gate_id: 'semantic-claims-review', purpose: 'quality_review', cacheable: false }] : []),
    ...(profile === 'assured' ? [{ gate_id: 'independent-high-assurance-review', purpose: 'release_review', cacheable: false }] : []),
    ...(request.constraints.publication_target ? [{ gate_id: 'publication-approval', purpose: 'release_review', cacheable: false }] : [])
  ];
  const stages = ['isolated_execution', 'browser', 'static'].map((stageId) => ({ stage_id: stageId, gate_ids: automaticGates.filter((g) => g.stage === stageId).map((g) => g.gate_id) }));
  stages.push({ stage_id: 'human_review', gate_ids: humanGates.map((g) => g.gate_id) });
  const compilerVersion = options.compilerVersion || currentCompilerVersion;
  const renderSpecPayload = {
    schema_version: 'design-render-spec/v2',
    viewports: request.conditional_policies.render.viewports,
    segments: request.conditional_policies.render.segments,
    states: request.conditional_policies.render.states,
    remote_policy: request.conditional_policies.render.remote_policy
  };
  const renderSpec = { ...renderSpecPayload, spec_digest: sha256Value(renderSpecPayload) };
  const payload = {
    schema_version: planSchemaVersion,
    compiler_version: compilerVersion,
    normalized_request: request,
    artifact: { ...request.output_surface, workspace_root: request.constraints.workspace_root },
    profile,
    execution_policy: executionPolicy,
    render_spec: renderSpec,
    automatic_gates: automaticGates,
    human_gates: humanGates,
    stages,
    result_contract: {
      execution_status: ['not_started', 'blocked_untrusted', 'complete', 'failed', 'terminated'],
      assurance_status: ['pending', 'passed', 'failed'],
      delivery_status: ['blocked', 'schematic_only', 'ready']
    },
    evidence_contract: {
      source_hashes_required: request.source_materials.mode === 'provided',
      bidirectional_claim_map_required: request.source_materials.mode === 'provided',
      numeric_semantics_required: request.conditional_policies.derived_data.mode === 'derived',
      reviewer_binding_required_for_ready: true,
      schematic_disclosure_required: request.conditional_policies.schematic.enabled,
      render_profile: request.conditional_policies.render,
      accessibility_standard: request.conditional_policies.accessibility.standard,
      privacy_classification: request.conditional_policies.privacy.classification
    },
    runner: { max_concurrency: 2, cache: { enabled: true }, telemetry_format: 'ndjson' },
    shadow_mode: Boolean(options.shadowMode)
  };
  const digest = sha256Value(payload);
  return { schema_version: payload.schema_version, plan_id: digest, resolved_gate_plan_digest: digest, ...Object.fromEntries(Object.entries(payload).slice(1)) };
}

function parseCli(argv) {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const outArg = argv.find((arg) => arg.startsWith('--out='));
  if (positional.length !== 1) throw new Error('Usage: node scripts/compile-execution-plan.mjs <request.json> [--out=<path>] [--shadow]');
  return { requestPath: positional[0], outPath: outArg?.slice(6), shadowMode: argv.includes('--shadow') };
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const cli = parseCli(process.argv.slice(2));
    const request = JSON.parse(readFileSync(resolve(cli.requestPath), 'utf8'));
    const registry = JSON.parse(readFileSync(resolve(packageRoot, 'assets/templates/registry.json'), 'utf8'));
    const outputValue = compileExecutionPlan(request, { registry, shadowMode: cli.shadowMode });
    const output = `${JSON.stringify(outputValue, null, 2)}\n`;
    if (cli.outPath) writeFileSync(resolve(cli.outPath), output);
    else process.stdout.write(output);
    if (outputValue.status === 'needs_clarification') process.exitCode = 3;
  } catch (error) {
    console.error(`Execution plan compilation failed: ${error.message}`);
    process.exitCode = 2;
  }
}
