import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  operationalRenderPolicy,
  v2Request
} from './fixtures/execution-request.mjs';

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

test('compiler emits one deterministic resolved plan digest and a candidate-only local delivery contract', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const first = compileExecutionPlan(v2Request(), { registry, compilerVersion: 'test-v2' });
  const second = compileExecutionPlan(v2Request(), { registry, compilerVersion: 'test-v2' });
  assert.deepEqual(first, second);
  assert.equal(first.schema_version, 'design-resolved-gate-plan/v3');
  assert.match(first.plan_id, /^[a-f0-9]{64}$/);
  assert.equal(first.plan_id, first.resolved_gate_plan_digest);
  assert.equal(first.skill_identity.schema_version, 'design-skill-identity/v1');
  assert.match(first.skill_identity.digest, /^[a-f0-9]{64}$/);
  assert.ok(first.skill_identity.entry_count > 0);
  assert.deepEqual(first.result_contract.execution_status, ['not_started', 'blocked_untrusted', 'complete', 'failed', 'terminated']);
  assert.deepEqual(first.result_contract.assurance_status, ['pending', 'passed', 'failed']);
  assert.deepEqual(first.result_contract.delivery_status, ['blocked', 'schematic_only', 'candidate_ready']);
  assert.deepEqual(first.result_contract.evidence_status, [
    'structure_passed',
    'evidence_traced',
    'visually_reviewed',
    'decision_ready',
    'user_validated'
  ]);
  assert.deepEqual(first.runner.cache, { mode: 'off' });
  assert.equal(first.runner.cache_capability, 'not_implemented');
  assert.equal(first.evidence_contract.trusted_candidate_ready_boundary, 'host_external_v1');
  assert.equal(first.evidence_contract.reviewer_binding_required_for_candidate_ready, true);
  assert.equal(first.evidence_contract.machine_attestation_required_for_candidate_ready, true);
  assert.equal(first.evidence_contract.reviewer_attestation_required_for_candidate_ready, true);
  assert.equal(JSON.stringify(first).includes('trusted_ready_boundary'), false);
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

test('compiled plans satisfy the v3 execution-plan schema', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const schema = JSON.parse(readFileSync(join(root, 'schemas/execution-plan.schema.json'), 'utf8'));
  const plan = compileExecutionPlan(v2Request(), { registry, compilerVersion: 'test-v2' });
  assert.deepEqual(validateJsonInstance(schema, plan), []);
  const legacyCacheShape = structuredClone(plan);
  legacyCacheShape.runner.cache = { enabled: true };
  assert.match(
    validateJsonInstance(schema, legacyCacheShape).join('\n'),
    /required property mode|additional property enabled/i
  );
});

test('resolved plan renders before evidence validation and declares the dependency', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const {
    loadDesignProfileAssets,
    resolveDesignProfile
  } = await import('../scripts/lib/design-profile.mjs');
  const assets = loadDesignProfileAssets(root);
  const input = v2Request({
    output_surface: {
      artifact_dir: 'artifact',
      artifact_type: 'dashboard',
      template_id: 'operational-product'
    },
    conditional_policies: {
      ...v2Request().conditional_policies,
      render: operationalRenderPolicy()
    }
  });
  const designProfile = resolveDesignProfile({
    schema_version: 'design-brief/v1',
    reader_job: 'operational-workflow',
    primary_relationship: 'system',
    secondary_relationships: [],
    content_density: 'dense',
    brand_context: 'none'
  }, 'dashboard', assets);
  const plan = compileExecutionPlan(input, {
    designProfile,
    registry,
    compilerVersion: 'test-v2'
  });
  const ids = plan.automatic_gates.map((gate) => gate.gate_id);
  assert.ok(ids.indexOf('render-smoke') < ids.indexOf('validate-evidence-contract'));
  assert.deepEqual(plan.automatic_gates.find((gate) => gate.gate_id === 'validate-evidence-contract').depends_on, ['render-smoke']);
  assert.ok(ids.includes('validate-requirement-verification'));
  assert.equal(plan.evidence_contract.requirement_verification_required, true);
  assert.equal(
    plan.evidence_contract.requirement_verification_ref,
    'requirement-verification.json'
  );
  assert.deepEqual(
    plan.evidence_contract.operational_h0_requirements.map((item) => item.id),
    ['VIS-ALIGN', 'VIS-LOCALE', 'VIS-ICON', 'VIS-COLOR']
  );
});

test('dashboard plans require a current profile and canonical operational render spec', async () => {
  const {
    compileExecutionPlan
  } = await import('../scripts/compile-execution-plan.mjs');
  const {
    loadDesignProfileAssets,
    resolveDesignProfile
  } = await import('../scripts/lib/design-profile.mjs');
  const assets = loadDesignProfileAssets(root);
  const profile = resolveDesignProfile({
    schema_version: 'design-brief/v1',
    reader_job: 'operational-workflow',
    primary_relationship: 'system',
    secondary_relationships: [],
    content_density: 'dense',
    brand_context: 'none'
  }, 'dashboard', assets);
  const request = v2Request({
    output_surface: {
      artifact_dir: 'artifact',
      artifact_type: 'dashboard',
      template_id: 'operational-product'
    },
    conditional_policies: {
      ...v2Request().conditional_policies,
      render: operationalRenderPolicy()
    }
  });

  assert.throws(
    () => compileExecutionPlan(request, { registry }),
    /dashboard requires --design-profile/
  );
  const plan = compileExecutionPlan(request, {
    designProfile: profile,
    registry
  });
  assert.equal(plan.design_profile.surface.artifact_type, 'dashboard');
  assert.equal(
    plan.design_profile.resolved_rules.locale_policy.locale,
    'zh-CN'
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(plan.render_spec).filter(
      ([key]) => key !== 'spec_digest'
    )),
    operationalRenderPolicy()
  );

  const divergent = structuredClone(request);
  divergent.conditional_policies.render.states = divergent
    .conditional_policies.render.states.filter((state) => state.id !== 'dense');
  assert.throws(
    () => compileExecutionPlan(divergent, {
      designProfile: profile,
      registry
    }),
    /must exactly match the checked-in canonical render spec/
  );
});

test('product requirements require browser execution and PRD content/function review', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const base = v2Request();
  const request = v2Request({
    conditional_policies: {
      ...base.conditional_policies,
      requirements: {
        mode: 'provided',
        record_ref: 'requirement-verification.json'
      },
      render: {
        ...base.conditional_policies.render,
        states: [{
          ...base.conditional_policies.render.states[0],
          requirement_ids: ['REQ-001']
        }]
      }
    }
  });
  const plan = compileExecutionPlan(request, {
    registry,
    compilerVersion: 'test-v2'
  });
  assert.equal(
    plan.automatic_gates.filter(
      (gate) => gate.gate_id === 'validate-requirement-verification'
    ).length,
    1
  );
  assert.equal(
    plan.automatic_gates.filter(
      (gate) => gate.gate_id === 'render-smoke'
    ).length,
    1
  );
  assert.ok(plan.human_gates.some(
    (gate) => gate.gate_id === 'prd-browser-content-function-review'
  ));
  assert.equal(plan.evidence_contract.requirement_verification_required, true);
  assert.equal(
    plan.evidence_contract.requirement_verification_ref,
    'requirement-verification.json'
  );
  assert.equal(plan.evidence_contract.prd_browser_review_required, true);
  assert.deepEqual(
    plan.evidence_contract.prd_browser_review_scope,
    ['content', 'functional', 'interaction', 'responsive']
  );
});

test('required inspiration adds one binding gate and review contract', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const base = v2Request();
  const request = v2Request({
    conditional_policies: {
      ...base.conditional_policies,
      inspiration: {
        mode: 'required',
        record_ref: 'inspiration-binding.json',
        trigger_reason: 'Open visual direction requires verified reference methods'
      }
    }
  });
  const plan = compileExecutionPlan(request, {
    registry,
    compilerVersion: 'test-v2'
  });
  assert.equal(
    plan.automatic_gates.filter(
      (gate) => gate.gate_id === 'validate-inspiration-binding'
    ).length,
    1
  );
  assert.ok(plan.human_gates.some(
    (gate) => gate.gate_id === 'inspiration-method-review'
  ));
  assert.equal(plan.evidence_contract.inspiration_binding_required, true);
  assert.equal(
    plan.evidence_contract.inspiration_binding_ref,
    'inspiration-binding.json'
  );
  assert.equal(plan.evidence_contract.inspiration_status, 'required');
});


test('REQ-003/005: execution plan binds design-profile/v2 visual treatment and rejects tampering', async () => {
  const { compileExecutionPlan, sha256Value } = await import('../scripts/compile-execution-plan.mjs');
  const {
    loadDesignProfileAssets,
    resolveDesignProfile
  } = await import('../scripts/lib/design-profile.mjs');
  const { validateExecutionPlanBinding } = await import('../scripts/lib/execution-plan-binding.mjs');
  const assets = loadDesignProfileAssets(root);
  const designProfile = resolveDesignProfile({
    schema_version: 'design-brief/v1',
    reader_job: 'executive-decision',
    primary_relationship: 'decision',
    secondary_relationships: [],
    content_density: 'normal',
    brand_context: 'none',
    visual_treatment: {
      profile_id: 'editorial-ink-panel',
      background_complexity: 'low'
    }
  }, 'poster', assets);
  const request = v2Request({
    output_surface: {
      artifact_dir: 'artifact',
      artifact_type: 'poster',
      template_id: 'poster-type-led'
    }
  });
  const plan = compileExecutionPlan(request, { designProfile, registry });
  assert.equal(plan.design_profile.schema_version, 'design-profile/v2');
  assert.equal(plan.design_profile.visual_treatment.profile_id, 'editorial-ink-panel');
  assert.deepEqual(validateExecutionPlanBinding(plan), []);

  const tampered = structuredClone(plan);
  tampered.design_profile.visual_treatment.decisions['material.mode'].value = 'translucent';
  const payload = Object.fromEntries(Object.entries(tampered).filter(
    ([key]) => key !== 'plan_id' && key !== 'resolved_gate_plan_digest'
  ));
  const digest = sha256Value(payload);
  tampered.plan_id = digest;
  tampered.resolved_gate_plan_digest = digest;
  assert.match(
    validateExecutionPlanBinding(tampered).join('\n'),
    /profile does not match the deterministic resolution/
  );
});


test('REQ-010/014: execution plan binds variation resolution and legacy v2 deterministically', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const {
    loadDesignProfileAssets,
    resolveDesignProfile
  } = await import('../scripts/lib/design-profile.mjs');
  const { validateExecutionPlanBinding } = await import('../scripts/lib/execution-plan-binding.mjs');
  const assets = loadDesignProfileAssets(root);
  const makeBrief = (visual_treatment) => ({
    schema_version: 'design-brief/v1',
    reader_job: 'executive-decision',
    primary_relationship: 'decision',
    secondary_relationships: [],
    content_density: 'normal',
    brand_context: 'none',
    visual_treatment
  });
  const request = v2Request({
    output_surface: {
      artifact_dir: 'artifact', artifact_type: 'poster', template_id: 'poster-type-led'
    }
  });
  const variedProfile = resolveDesignProfile(makeBrief({
    profile_id: 'editorial-ink-panel', variation_id: 'compact-reading'
  }), 'poster', assets);
  const variedPlan = compileExecutionPlan(request, { designProfile: variedProfile, registry });
  assert.equal(variedPlan.design_profile.visual_treatment.variation_id, 'compact-reading');
  assert.equal(
    variedPlan.design_profile.visual_treatment.decisions['typography.hierarchy'].value,
    'compact-serif-display-sans-body'
  );
  assert.deepEqual(validateExecutionPlanBinding(variedPlan), []);

  const legacyProfile = resolveDesignProfile(makeBrief({
    profile_id: 'editorial-ink-panel'
  }), 'poster', assets);
  const first = compileExecutionPlan(request, { designProfile: legacyProfile, registry });
  const second = compileExecutionPlan(request, { designProfile: legacyProfile, registry });
  assert.deepEqual(first, second);
  assert.equal(first.design_profile.visual_treatment.variation_id, null);
  assert.deepEqual(first.design_profile.visual_treatment.variation_patch, {});

  assert.throws(
    () => resolveDesignProfile(makeBrief({
      profile_id: 'editorial-ink-panel', variation_id: 'unknown'
    }), 'poster', assets),
    /variation_not_found/
  );
  const incompatibleAssets = structuredClone(assets);
  incompatibleAssets.visualRegistry.profiles[1].variations.push({
    id: 'material-switch',
    recipe_inputs: [{
      recipe_id: 'material.translucent-surface',
      inputs: { mode: { value: 'translucent', provenance: 'profile-explicit' } }
    }]
  });
  assert.throws(
    () => resolveDesignProfile(makeBrief({
      profile_id: 'editorial-ink-panel', variation_id: 'material-switch'
    }), 'poster', incompatibleAssets),
    /incompatible_recipe/
  );
});


test('REQ-016/019 content routing: blocked and conflict results cannot be bound into execution plans', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const {
    loadDesignProfileAssets,
    resolveDesignProfile
  } = await import('../scripts/lib/design-profile.mjs');
  const assets = loadDesignProfileAssets(root);
  const base = {
    schema_version: 'design-brief/v1',
    reader_job: 'choose',
    primary_relationship: 'decision',
    secondary_relationships: [],
    content_density: 'normal',
    brand_context: 'none'
  };
  const request = v2Request({
    output_surface: {
      artifact_dir: 'artifact', artifact_type: 'ppt-handoff', template_id: 'swiss-evidence-deck'
    }
  });
  assert.throws(
    () => resolveDesignProfile({
      ...base,
      content_signals: {
        content_role: 'decision', semantic_order: ['recommendation'],
        required_facts: ['decision_owner'],
        density_bounds: { min_items: 1, max_items: 4 }, evidence_role: 'supporting',
        primary_action: { intent: 'decide', required: true }, do_not_rewrite: ['recommendation'],
        preserved_invariants: ['facts'], truth_status: 'verified',
        delivery: { source_medium: 'interactive-web', target_medium: 'ppt', reduced_motion: false }
      }
    }, 'ppt-handoff', assets),
    (error) => error.code === 'content_constraints_incomplete'
  );
  assert.throws(
    () => resolveDesignProfile({
      ...base,
      primary_preset_override: 'consumer-brand',
      override_reason: 'Explicit campaign direction.',
      content_signals: {
        content_role: 'decision', required_fields: ['recommendation'],
        required_facts: ['decision_owner'],
        semantic_order: ['recommendation'], density_bounds: { min_items: 1, max_items: 4 },
        evidence_role: 'supporting', primary_action: { intent: 'decide', required: true },
        do_not_rewrite: ['recommendation'],
        preserved_invariants: ['facts', 'hierarchy', 'reading_order', 'state_meaning', 'action_intent'],
        truth_status: 'verified',
        delivery: { source_medium: 'interactive-web', target_medium: 'ppt', reduced_motion: false }
      }
    }, 'ppt-handoff', assets),
    (error) => error.code === 'intent_conflict'
  );
  assert.throws(
    () => compileExecutionPlan(request, { registry }),
    /requires --design-profile/
  );
});

test('REQ-017/018 content routing catalogue digest, trace, degradation, and replay are execution-plan bound', async () => {
  const { compileExecutionPlan, sha256Value } = await import('../scripts/compile-execution-plan.mjs');
  const {
    loadDesignProfileAssets,
    resolveDesignProfile
  } = await import('../scripts/lib/design-profile.mjs');
  const { validateExecutionPlanBinding } = await import('../scripts/lib/execution-plan-binding.mjs');
  const assets = loadDesignProfileAssets(root);
  const content_signals = {
    content_role: 'decision', required_fields: ['recommendation', 'evidence'],
    required_facts: ['decision_owner', 'decision_basis'],
    semantic_order: ['recommendation', 'evidence'], density_bounds: { min_items: 1, max_items: 6 },
    evidence_role: 'supporting', primary_action: { intent: 'approve', required: true },
    do_not_rewrite: ['recommendation', 'evidence'],
    preserved_invariants: ['facts', 'hierarchy', 'reading_order', 'state_meaning', 'action_intent'],
    truth_status: 'verified',
    delivery: { source_medium: 'interactive-web', target_medium: 'ppt', reduced_motion: false }
  };
  const brief = {
    schema_version: 'design-brief/v1', reader_job: 'choose', primary_relationship: 'decision',
    secondary_relationships: [], content_density: 'normal', brand_context: 'none', content_signals
  };
  const request = v2Request({
    output_surface: {
      artifact_dir: 'artifact', artifact_type: 'ppt-handoff', template_id: 'swiss-evidence-deck'
    }
  });
  const firstProfile = resolveDesignProfile(brief, 'ppt-handoff', assets);
  const secondProfile = resolveDesignProfile(brief, 'ppt-handoff', assets);
  assert.deepEqual(firstProfile, secondProfile);
  assert.equal(firstProfile.content_routing.status, 'recommended');
  assert.equal(firstProfile.content_routing.semantic_degradation.status, 'degraded_to_static');
  assert.ok(firstProfile.content_routing.matched_rule_ids.length >= 2);
  assert.ok(firstProfile.content_routing.trace.length > 0);
  const first = compileExecutionPlan(request, { designProfile: firstProfile, registry });
  const second = compileExecutionPlan(request, { designProfile: secondProfile, registry });
  assert.deepEqual(first, second);
  assert.deepEqual(first.design_profile.content_routing, firstProfile.content_routing);
  assert.deepEqual(validateExecutionPlanBinding(first), []);

  const tampered = structuredClone(first);
  tampered.design_profile.content_routing.trace.push('tampered-route');
  const payload = Object.fromEntries(Object.entries(tampered).filter(
    ([key]) => key !== 'plan_id' && key !== 'resolved_gate_plan_digest'
  ));
  const digest = sha256Value(payload);
  tampered.plan_id = digest;
  tampered.resolved_gate_plan_digest = digest;
  assert.match(
    validateExecutionPlanBinding(tampered).join('\n'),
    /profile does not match the deterministic resolution/
  );
});


test('MAJ-001 secondary_preset_override conflict produces no resolved profile or execution-plan binding', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const { loadDesignProfileAssets, resolveDesignProfile } = await import('../scripts/lib/design-profile.mjs');
  const assets = loadDesignProfileAssets(root);
  const conflictingBrief = {
    schema_version: 'design-brief/v1',
    reader_job: 'choose',
    primary_relationship: 'decision',
    secondary_relationships: [],
    content_density: 'normal',
    brand_context: 'none',
    secondary_preset_override: 'editorial-research',
    override_reason: 'No precedence was declared.',
    content_signals: {
      content_role: 'decision', required_fields: ['recommendation'],
      required_facts: ['decision_owner'], semantic_order: ['recommendation'],
      density_bounds: { min_items: 1, max_items: 4 }, evidence_role: 'supporting',
      primary_action: { intent: 'decide', required: true }, do_not_rewrite: ['recommendation'],
      preserved_invariants: ['facts', 'hierarchy', 'reading_order', 'state_meaning', 'action_intent'],
      truth_status: 'verified',
      delivery: { source_medium: 'interactive-web', target_medium: 'ppt', reduced_motion: false }
    }
  };
  let profile;
  assert.throws(
    () => { profile = resolveDesignProfile(conflictingBrief, 'ppt-handoff', assets); },
    (error) => error.code === 'intent_conflict'
      && error.routing?.selected_profile_id === null
  );
  assert.equal(profile, undefined);
  assert.throws(
    () => compileExecutionPlan(v2Request({
      output_surface: {
        artifact_dir: 'artifact', artifact_type: 'ppt-handoff', template_id: 'swiss-evidence-deck'
      }
    }), { designProfile: profile, registry }),
    /requires --design-profile/
  );
});
