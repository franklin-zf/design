import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { v2Request } from './fixtures/execution-request.mjs';

const root = resolve('.');
const registry = JSON.parse(readFileSync(join(root, 'assets/templates/registry.json'), 'utf8'));

function restrictedExecution(overrides = {}) {
  return {
    mode: 'derived', metric: 'conversion', unit: '%', denominator: 'eligible users',
    grain: 'day', period: '2026-Q2', missing_data_policy: 'exclude and disclose',
    freshness_policy: 'refresh within 24h',
    execution: {
      kind: 'restricted', interpreter: 'node', entrypoint: 'compute.mjs',
      code_sha256: 'a'.repeat(64), dependency_lock_ref: 'package-lock.json', dependency_lock_sha256: 'b'.repeat(64), argv: [],
      dynamic_shell: false, unknown_binary: false, needs_network: false,
      reads_environment_secrets: false, spawns_subprocesses: false, timeout_ms: 5000, max_output_bytes: 65536,
      resource_limiter_id: 'darwin-rlimit-v1', read_allowlist: ['source/input.json'], write_allowlist: ['derived/output.json'],
      ...overrides
    }
  };
}

test('Input Contract is a hard gate and clarification results have no plan identity', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  for (const field of ['goal', 'use_scenario', 'audience', 'source_materials', 'output_surface', 'constraints', 'conditional_policies']) {
    const input = v2Request();
    delete input[field];
    const result = compileExecutionPlan(input, { registry });
    assert.equal(result.status, 'needs_clarification', field);
    assert.equal(Object.hasOwn(result, 'plan_id'), false, field);
    assert.ok(result.missing_fields.some((item) => item === field || item.startsWith(`${field}.`)), field);
  }
  const legacy = v2Request({ schema_version: 'design-execution-request/v1' });
  const result = compileExecutionPlan(legacy, { registry });
  assert.equal(result.status, 'needs_clarification');
  assert.match(result.errors.join(' '), /legacy v1.*import-only.*recompiled/i);
});

test('compiler emits one deterministic resolved plan digest and a three-state result contract', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const first = compileExecutionPlan(v2Request(), { registry, compilerVersion: 'test-v2' });
  const second = compileExecutionPlan(v2Request(), { registry, compilerVersion: 'test-v2' });
  assert.deepEqual(first, second);
  assert.match(first.plan_id, /^[a-f0-9]{64}$/);
  assert.equal(first.plan_id, first.resolved_gate_plan_digest);
  assert.deepEqual(first.result_contract.execution_status, ['not_started', 'blocked_untrusted', 'complete', 'failed', 'terminated']);
  assert.deepEqual(first.result_contract.assurance_status, ['pending', 'passed', 'failed']);
  assert.deepEqual(first.result_contract.delivery_status, ['blocked', 'schematic_only', 'ready']);
  assert.equal(JSON.stringify(first).includes('signature'), false);
  assert.equal(JSON.stringify(first).includes('authorize-untrusted'), false);
});

test('policy classification is signature-free, fail-closed, and registry/hash based', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const withDerived = (derived) => v2Request({
    conditional_policies: { ...v2Request().conditional_policies, derived_data: derived }
  });
  const restricted = compileExecutionPlan(withDerived(restrictedExecution()), { registry });
  assert.deepEqual(
    [restricted.execution_policy.code_class, restricted.execution_policy.decision, restricted.execution_policy.spawn_allowed],
    ['restricted', 'auto_disposable_sandbox', true]
  );
  for (const unsafe of [
    { dynamic_shell: true }, { unknown_binary: true }, { needs_network: true },
    { reads_environment_secrets: true }, { spawns_subprocesses: true },
    { interpreter: 'bash' }, { entrypoint: '../compute.mjs' }, { code_sha256: 'drift' }
    , { timeout_ms: 60001 }, { max_output_bytes: 0 }, { argv: Array(17).fill('x') },
    { read_allowlist: ['../secret'] }, { write_allowlist: ['/tmp/output'] }, { resource_limiter_id: '' }
  ]) {
    const plan = compileExecutionPlan(withDerived(restrictedExecution(unsafe)), { registry });
    assert.equal(plan.execution_policy.code_class, 'untrusted');
    assert.equal(plan.execution_policy.decision, 'zero_spawn');
    assert.equal(plan.execution_policy.spawn_allowed, false);
  }
  const trustedDerived = restrictedExecution({ kind: 'trusted', registry_id: 'calc-v1' });
  const mismatch = compileExecutionPlan(withDerived(trustedDerived), { registry });
  assert.equal(mismatch.execution_policy.decision, 'zero_spawn');
  const trustedCodeRegistry = [{
    id: 'calc-v1', entrypoint: 'compute.mjs', code_sha256: 'a'.repeat(64),
    dependency_lock_ref: 'package-lock.json', dependency_lock_sha256: 'b'.repeat(64)
  }];
  const trusted = compileExecutionPlan(withDerived(trustedDerived), { registry, trustedCodeRegistry });
  assert.equal(trusted.execution_policy.code_class, 'trusted');
  assert.equal(trusted.execution_policy.decision, 'auto_standard_sandbox');
});

test('compiled plans satisfy the v2 execution-plan schema', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const schema = JSON.parse(readFileSync(join(root, 'schemas/execution-plan.schema.json'), 'utf8'));
  const plan = compileExecutionPlan(v2Request(), { registry, compilerVersion: 'test-v2' });
  assert.deepEqual(validateJsonInstance(schema, plan), []);
});

test('resolved plan renders before evidence validation and declares the dependency', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const input = v2Request({
    output_surface: { artifact_dir: 'artifact', artifact_type: 'dashboard', template_id: 'operational-dashboard' }
  });
  const plan = compileExecutionPlan(input, { registry, compilerVersion: 'test-v2' });
  const ids = plan.automatic_gates.map((gate) => gate.gate_id);
  assert.ok(ids.indexOf('render-smoke') < ids.indexOf('validate-evidence-contract'));
  assert.deepEqual(plan.automatic_gates.find((gate) => gate.gate_id === 'validate-evidence-contract').depends_on, ['render-smoke']);
});
