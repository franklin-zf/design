import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  operationalRenderPolicy,
  v2Request
} from './fixtures/execution-request.mjs';

const packageRoot = resolve('.');
const registry = JSON.parse(readFileSync(join(packageRoot, 'assets/templates/registry.json'), 'utf8'));
const hash = (value) => createHash('sha256').update(value).digest('hex');

async function refreshPlanDigest(plan) {
  const { sha256Value } = await import('../scripts/compile-execution-plan.mjs');
  const payload = Object.fromEntries(
    Object.entries(plan).filter(
      ([key]) => key !== 'plan_id' && key !== 'resolved_gate_plan_digest'
    )
  );
  const digest = sha256Value(payload);
  plan.plan_id = digest;
  plan.resolved_gate_plan_digest = digest;
  return plan;
}

function fixture() {
  const workspace = mkdtempSync(join(tmpdir(), 'design-v2-workspace-'));
  const artifact = join(workspace, 'artifact');
  mkdirSync(artifact);
  writeFileSync(join(artifact, 'index.html'), '<main>fixture</main>');
  writeFileSync(join(artifact, 'package-lock.json'), 'lock');
  return { workspace, artifact };
}

async function planFor(workspace, derivedData = { mode: 'none' }) {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const input = v2Request({
    constraints: { ...v2Request().constraints, workspace_root: workspace },
    conditional_policies: { ...v2Request().conditional_policies, derived_data: derivedData }
  });
  return compileExecutionPlan(input, { registry });
}

async function dashboardPlanFor(workspace) {
  const {
    compileExecutionPlan
  } = await import('../scripts/compile-execution-plan.mjs');
  const {
    loadDesignProfileAssets,
    resolveDesignProfile
  } = await import('../scripts/lib/design-profile.mjs');
  const profile = resolveDesignProfile({
    schema_version: 'design-brief/v1',
    reader_job: 'operational-workflow',
    primary_relationship: 'system',
    secondary_relationships: [],
    content_density: 'dense',
    brand_context: 'none'
  }, 'dashboard', loadDesignProfileAssets(packageRoot));
  return compileExecutionPlan(v2Request({
    output_surface: {
      artifact_dir: 'artifact',
      artifact_type: 'dashboard',
      template_id: 'operational-product'
    },
    constraints: {
      ...v2Request().constraints,
      workspace_root: workspace
    },
    conditional_policies: {
      ...v2Request().conditional_policies,
      render: operationalRenderPolicy()
    }
  }), { designProfile: profile, registry });
}

function restrictedDerived(code, overrides = {}) {
  return {
    mode: 'derived', metric: 'conversion', unit: '%', denominator: 'eligible users',
    grain: 'day', period: '2026-Q2', missing_data_policy: 'exclude and disclose', freshness_policy: '24h',
    execution: {
      kind: 'restricted', interpreter: 'node', entrypoint: 'compute.mjs', code_sha256: hash(code),
      dependency_lock_ref: 'package-lock.json', dependency_lock_sha256: hash('lock'), argv: [], dynamic_shell: false, unknown_binary: false,
      needs_network: false, reads_environment_secrets: false, spawns_subprocesses: false,
      timeout_ms: 5000, max_output_bytes: 65536,
      resource_limiter_id: 'darwin-rlimit-v1', read_allowlist: ['input.json'], write_allowlist: ['derived/output.json'],
      ...overrides
    }
  };
}

test('untrusted policy is zero-spawn and blocks gates without manual override', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const code = 'process.exit(0);';
    writeFileSync(join(f.artifact, 'compute.mjs'), code);
    const plan = await planFor(f.workspace, restrictedDerived(code, { needs_network: true }));
    let processSpawns = 0;
    let gateSpawns = 0;
    const result = await runExecutionPlan(plan, {
      spawnImpl: async () => { processSpawns += 1; return { status: 'passed', exit_code: 0 }; },
      executeGate: async () => { gateSpawns += 1; return { status: 'passed' }; }
    });
    assert.equal(result.execution_status, 'blocked_untrusted');
    assert.equal(result.delivery_status, 'blocked');
    assert.equal(processSpawns, 0);
    assert.equal(gateSpawns, 0);
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('caller booleans or injected objects cannot attest a resource limiter', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const code = 'process.exit(0);';
    writeFileSync(join(f.artifact, 'compute.mjs'), code);
    const plan = await planFor(f.workspace, restrictedDerived(code));
    let policyCalls = 0;
    const result = await runExecutionPlan(plan, {
      sandboxAvailable: true,
      resourceLimitsAvailable: true,
      resourceLimiterAdapter: { id: 'darwin-rlimit-v1', wrap: () => [] },
      sandboxProbe: async () => true,
      spawnImpl: async () => {
        policyCalls += 1;
        return { status: 'passed', exit_code: 0 };
      },
      executeGate: async (gate) => ({ status: 'passed', exit_code: 0, evidence: gate.gate_id })
    });
    assert.equal(policyCalls, 0);
    assert.equal(result.execution_status, 'blocked_untrusted');
    assert.equal(result.delivery_status, 'blocked');
    assert.match(readFileSync(result.telemetry_path, 'utf8'), /registered-resource-limiter-unavailable/);
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('sandbox profile is default-deny with only declared read/write paths', async () => {
  const { sandboxProfile } = await import('../scripts/run-execution-plan.mjs');
  const profile = sandboxProfile({
    interpreter: '/runtime/node',
    readPaths: ['/runtime/artifact', '/System'],
    writePaths: ['/runtime/artifact/derived/output.json']
  });
  assert.match(profile, /\(deny default\)/);
  assert.doesNotMatch(profile, /\(allow default\)/);
  assert.match(profile, /file-read\*.*\/runtime\/artifact/);
  assert.match(profile, /file-write\*.*\/runtime\/artifact\/derived\/output\.json/);
  assert.doesNotMatch(profile, /file-write\*.*workspace/);
});

test('missing isolation, hash drift, and entrypoint symlinks fail closed with zero spawn', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  for (const scenario of ['missing-isolation', 'hash-drift', 'symlink']) {
    const f = fixture();
    try {
      const code = 'process.exit(0);';
      const target = join(f.artifact, 'target.mjs');
      writeFileSync(target, scenario === 'hash-drift' ? 'changed' : code);
      if (scenario === 'symlink') symlinkSync(target, join(f.artifact, 'compute.mjs'));
      else writeFileSync(join(f.artifact, 'compute.mjs'), scenario === 'hash-drift' ? 'changed' : code);
      const plan = await planFor(f.workspace, restrictedDerived(code));
      let spawns = 0;
      const result = await runExecutionPlan(plan, {
        sandboxAvailable: scenario !== 'missing-isolation',
        spawnImpl: async () => { spawns += 1; return { status: 'passed' }; },
        executeGate: async () => ({ status: 'passed' })
      });
      assert.equal(result.execution_status, 'blocked_untrusted', scenario);
      assert.equal(spawns, 0, scenario);
    } finally { rmSync(f.workspace, { recursive: true, force: true }); }
  }
});

test('runner rejects digest edits, workspace traversal, and writes outside workspace', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const plan = await planFor(f.workspace);
    const edited = structuredClone(plan);
    edited.profile = 'assured';
    await assert.rejects(() => runExecutionPlan(edited), /digest mismatch/i);

    const traversal = structuredClone(plan);
    traversal.artifact.artifact_dir = '../outside';
    await assert.rejects(() => runExecutionPlan(traversal), /digest mismatch|relative|traversal|must match pattern/i);

    await assert.rejects(
      () => runExecutionPlan(plan, { telemetryPath: join(tmpdir(), 'outside.ndjson'), executeGate: async () => ({ status: 'passed' }) }),
      /inside workspace_root/i
    );
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('cache is explicitly off and enabled plans fail before gate execution', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const plan = await planFor(f.workspace);
    let gateCalls = 0;
    const result = await runExecutionPlan(plan, {
      executeGate: async () => {
        gateCalls += 1;
        return { status: 'passed', exit_code: 0 };
      }
    });
    assert.equal(result.execution_status, 'complete');
    assert.equal(result.evidence_status, 'evidence_traced');
    assert.ok(gateCalls > 0);
    assert.equal(existsSync(join(f.artifact, 'design-evaluation.json')), false);
    const telemetry = readFileSync(result.telemetry_path, 'utf8');
    assert.match(telemetry, /"cache_capability":"not_implemented"/);
    assert.match(telemetry, /"cache_declared_mode":"off"/);
    assert.match(telemetry, /"cache_effective_mode":"off"/);
    assert.match(telemetry, /"cache_result":"not_applicable"/);
    assert.doesNotMatch(telemetry, /"cache_result":"(?:hit|miss)"/);

    const unsupported = structuredClone(plan);
    unsupported.runner.cache.mode = 'enabled';
    await refreshPlanDigest(unsupported);
    gateCalls = 0;
    await assert.rejects(
      () => runExecutionPlan(unsupported, {
        executeGate: async () => {
          gateCalls += 1;
          return { status: 'passed', exit_code: 0 };
        }
      }),
      /cache mode enabled is unsupported/i
    );
    assert.equal(gateCalls, 0);
    await assert.rejects(
      () => runExecutionPlan(plan, {
        cacheDir: join(f.workspace, 'cache'),
        executeGate: async () => ({ status: 'passed', exit_code: 0 })
      }),
      /cacheDir is unavailable while cache mode is off/i
    );
  } finally {
    rmSync(f.workspace, { recursive: true, force: true });
  }
});

test('telemetry rejects symlinked parents and creates no outside file', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'design-v2-outside-'));
  try {
    const link = join(realpathSync(f.workspace), 'telemetry-link');
    symlinkSync(outside, link);
    const plan = await planFor(f.workspace);
    const outsideFile = join(outside, 'escaped.ndjson');
    await assert.rejects(
      () => runExecutionPlan(plan, {
        telemetryPath: join(link, 'escaped.ndjson'),
        executeGate: async () => ({ status: 'passed', exit_code: 0 })
      }),
      /symbolic-link path component/i
    );
    assert.equal(existsSync(outsideFile), false);
  } finally {
    rmSync(f.workspace, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('any symlink anywhere in the artifact tree blocks derived execution before spawn', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const code = 'process.exit(0);';
    writeFileSync(join(f.artifact, 'compute.mjs'), code);
    writeFileSync(join(f.artifact, 'input.json'), '{}');
    symlinkSync('input.json', join(f.artifact, 'unrelated-link.json'));
    const plan = await planFor(f.workspace, restrictedDerived(code));
    let spawns = 0;
    const result = await runExecutionPlan(plan, {
      spawnImpl: async () => { spawns += 1; return { status: 'passed' }; },
      executeGate: async () => ({ status: 'passed' })
    });
    assert.equal(result.execution_status, 'blocked_untrusted');
    assert.equal(spawns, 0);
    assert.match(readFileSync(result.telemetry_path, 'utf8'), /artifact-tree-symlink/);
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('artifact-tree symlinks also block no-derived plans before gates', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    symlinkSync('index.html', join(f.artifact, 'linked-index.html'));
    const plan = await planFor(f.workspace);
    let gateCalls = 0;
    await assert.rejects(
      () => runExecutionPlan(plan, {
        executeGate: async () => {
          gateCalls += 1;
          return { status: 'passed' };
        }
      }),
      /artifact digest rejects symbolic link.*linked-index\.html/i
    );
    assert.equal(gateCalls, 0);
  } finally {
    rmSync(f.workspace, { recursive: true, force: true });
  }
});

test('process executor escalates TERM to group KILL and confirms completion', async () => {
  const { spawnProcess } = await import('../scripts/run-execution-plan.mjs');
  const started = Date.now();
  const result = await spawnProcess(process.execPath, [
    '-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"
  ], { timeoutMs: 50, killGraceMs: 50, maxOutputBytes: 1024 });
  assert.equal(result.status, 'failed');
  assert.equal(result.termination_reason, 'timeout');
  assert.equal(result.completion_confirmed, true);
  assert.ok(Date.now() - started < 2000);
});

test('process executor terminates a process group when streamed output exceeds its byte cap', async () => {
  const { spawnProcess } = await import('../scripts/run-execution-plan.mjs');
  const result = await spawnProcess(process.execPath, [
    '-e', "process.on('SIGTERM', () => {}); setInterval(() => process.stdout.write('x'.repeat(4096)), 1)"
  ], { timeoutMs: 2000, killGraceMs: 50, maxOutputBytes: 1024 });
  assert.equal(result.status, 'failed');
  assert.equal(result.termination_reason, 'max-output-bytes-exceeded');
  assert.equal(result.completion_confirmed, true);
  assert.ok(Buffer.byteLength(result.stdout) <= 1024);
});

test('render-smoke gate invocation emits exact structured profile arguments and evidence path', async () => {
  const { gateInvocation } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const artifactDigest = 'a'.repeat(64);
    const planDigest = 'b'.repeat(64);
    const specPath = join(f.artifact, '.design', 'render-spec.json');
    const invocation = gateInvocation({ gate_id: 'render-smoke' }, f.artifact, artifactDigest, planDigest, specPath);
    assert.deepEqual(invocation.args.slice(1), [
      join(f.artifact, 'index.html'),
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout',
      `--spec=${specPath}`,
      `--profile-out=${join(f.artifact, 'render-profile.json')}`,
      `--artifact-digest=${artifactDigest}`,
      `--plan-digest=${planDigest}`
    ]);
    assert.equal(invocation.evidence, join(f.artifact, 'render-profile.json'));
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('evidence gate receives only explicit external trust inputs', async () => {
  const { gateInvocation } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const invocation = gateInvocation(
      { gate_id: 'validate-evidence-contract' },
      f.artifact,
      'a'.repeat(64),
      'b'.repeat(64),
      join(f.artifact, '.design', 'render-spec.json'),
      null,
      {
        machineAttestationPath: join(f.workspace, 'machine.json'),
        reviewerRegistryPath: join(f.workspace, 'reviewers.json'),
        reviewerAttestationPath: join(f.workspace, 'review.json')
      }
    );
    assert.deepEqual(invocation.args.slice(2), [
      `--machine-attestation=${join(f.workspace, 'machine.json')}`,
      `--reviewer-registry=${join(f.workspace, 'reviewers.json')}`,
      `--reviewer-attestation=${join(f.workspace, 'review.json')}`
    ]);
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('requirement gate receives the request-bound record ref', async () => {
  const { gateInvocation } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const invocation = gateInvocation(
      { gate_id: 'validate-requirement-verification' },
      f.artifact,
      'a'.repeat(64),
      'b'.repeat(64),
      join(f.artifact, '.design', 'render-spec.json'),
      null,
      { requirementVerificationRef: 'requirement-verification.json' }
    );
    assert.deepEqual(invocation.args.slice(2), [
      '--record=requirement-verification.json'
    ]);
    assert.equal(invocation.evidence, 'requirement-verification.json');
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('browser evidence gates share runner-owned plan and render bindings', async () => {
  const { gateInvocation } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const artifactDigest = 'a'.repeat(64);
    const planDigest = 'b'.repeat(64);
    const renderSpecPath = join(f.artifact, '.design', 'render-spec.json');
    const executionPlanPath = join(f.artifact, '.design', 'execution-plan.json');
    const render = gateInvocation(
      { gate_id: 'render-smoke' },
      f.artifact,
      artifactDigest,
      planDigest,
      renderSpecPath,
      null,
      { browserEvidenceRequired: true }
    );
    assert.ok(render.args.includes(
      `--browser-evidence-out=${join(f.artifact, 'browser-test-evidence.json')}`
    ));

    const validate = gateInvocation(
      { gate_id: 'validate-browser-test-evidence' },
      f.artifact,
      artifactDigest,
      planDigest,
      renderSpecPath,
      null,
      { executionPlanPath }
    );
    assert.deepEqual(validate.args.slice(2), [
      '--evidence=browser-test-evidence.json',
      `--execution-plan=${executionPlanPath}`,
      `--render-spec=${renderSpecPath}`
    ]);
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('inspiration gate receives binding and execution plan refs', async () => {
  const { gateInvocation } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const executionPlanPath = join(f.artifact, '.design', 'execution-plan.json');
    const invocation = gateInvocation(
      { gate_id: 'validate-inspiration-binding' },
      f.artifact,
      'a'.repeat(64),
      'b'.repeat(64),
      join(f.artifact, '.design', 'render-spec.json'),
      null,
      {
        executionPlanPath,
        inspirationBindingRef: 'inspiration-binding.json'
      }
    );
    assert.deepEqual(invocation.args.slice(2), [
      '--binding=inspiration-binding.json',
      `--execution-plan=${executionPlanPath}`
    ]);
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('runner binds generated browser evidence into requirement sidecars', async () => {
  const {
    bindBrowserEvidenceToRequirements
  } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    writeFileSync(
      join(f.artifact, 'browser-test-evidence.json'),
      '{"schema_version":"design-browser-test-evidence/v1"}\n'
    );
    writeFileSync(
      join(f.artifact, 'requirement-verification.json'),
      `${JSON.stringify({
        requirements: [{
          id: 'REQ-001',
          evidence_refs: [{
            ref: 'pending.json',
            sha256: '0'.repeat(64),
            kind: 'browser-test'
          }]
        }]
      })}\n`
    );
    bindBrowserEvidenceToRequirements(
      f.artifact,
      'requirement-verification.json'
    );
    const record = JSON.parse(readFileSync(
      join(f.artifact, 'requirement-verification.json'),
      'utf8'
    ));
    const binding = record.requirements[0].evidence_refs[0];
    assert.equal(binding.ref, 'browser-test-evidence.json');
    assert.equal(
      binding.sha256,
      hash(readFileSync(join(f.artifact, 'browser-test-evidence.json')))
    );
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('artifact gates receive the runner-owned execution plan sidecar', async () => {
  const { gateInvocation } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const executionPlanPath = join(f.artifact, '.design', 'execution-plan.json');
    for (const gateId of [
      'validate-design-output',
      'validate-layout-lock',
      'validate-poster-contract'
    ]) {
      const invocation = gateInvocation(
        { gate_id: gateId },
        f.artifact,
        'a'.repeat(64),
        'b'.repeat(64),
        join(f.artifact, '.design', 'render-spec.json'),
        null,
        { executionPlanPath }
      );
      assert.deepEqual(invocation.args.slice(2), [
        `--execution-plan=${executionPlanPath}`
      ]);
    }
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('dependency scheduler never starts evidence validation before render-smoke completes', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const plan = await dashboardPlanFor(f.workspace);
    let renderComplete = false;
    const calls = [];
    const result = await runExecutionPlan(plan, {
      workers: 2,
      executeGate: async (gate) => {
        calls.push(gate.gate_id);
        if (gate.gate_id === 'render-smoke') {
          await new Promise((resolve) => setTimeout(resolve, 20));
          renderComplete = true;
        }
        if (gate.gate_id === 'validate-evidence-contract') assert.equal(renderComplete, true);
        return { status: 'passed', exit_code: 0, evidence: gate.gate_id };
      }
    });
    assert.equal(result.execution_status, 'complete');
    assert.ok(calls.indexOf('render-smoke') < calls.indexOf('validate-evidence-contract'));
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('runner emits an external digest-bound machine attestation after render passes', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const plan = await dashboardPlanFor(f.workspace);
    const result = await runExecutionPlan(plan, {
      artifactAuthorId: 'author-1',
      executeGate: async (gate) => {
        if (gate.gate_id === 'render-smoke') {
          writeFileSync(join(f.artifact, 'render-profile.json'), '{"render":"measured"}\n');
        }
        return { status: 'passed', exit_code: 0, evidence: gate.gate_id };
      }
    });
    assert.equal(result.execution_status, 'complete');
    const trustDir = join(f.workspace, '.design-trust', plan.plan_id);
    const machinePath = join(trustDir, 'machine-attestation.json');
    const eventPath = join(trustDir, 'render-execution-events.ndjson');
    assert.equal(existsSync(machinePath), true);
    assert.equal(existsSync(eventPath), true);
    const machine = JSON.parse(readFileSync(machinePath, 'utf8'));
    assert.equal(machine.producer, 'design-runner');
    assert.equal(machine.artifact_author_id, 'author-1');
    assert.equal(machine.artifact_digest, result.artifact_digest);
    assert.equal(machine.execution_event.sha256, hash(readFileSync(eventPath)));
    assert.equal(machine.render_profile.sha256, hash(readFileSync(join(f.artifact, 'render-profile.json'))));
    const events = readFileSync(eventPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.ok(events.some((event) => event.event === 'gate_finished'
      && event.gate_id === 'render-smoke'
      && event.status === 'passed'
      && event.artifact_digest === result.artifact_digest));
    assert.equal(events.some((event) => event.gate_id === 'validate-evidence-contract'), false);
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});

test('runner consumes a host-supplied prior machine attestation without overwriting it', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const plan = await dashboardPlanFor(f.workspace);
    const priorPath = join(f.workspace, 'prior-machine-attestation.json');
    const priorBytes = '{"producer":"design-runner","sentinel":"prior-run"}\n';
    writeFileSync(priorPath, priorBytes);
    await runExecutionPlan(plan, {
      artifactAuthorId: 'author-1',
      machineAttestationPath: priorPath,
      executeGate: async (gate) => {
        if (gate.gate_id === 'render-smoke') {
          writeFileSync(join(f.artifact, 'render-profile.json'), '{"render":"measured"}\n');
        }
        return { status: 'passed', exit_code: 0, evidence: gate.gate_id };
      }
    });
    assert.equal(readFileSync(priorPath, 'utf8'), priorBytes);
    assert.equal(
      existsSync(join(f.workspace, '.design-trust', plan.plan_id, 'machine-attestation.json')),
      false
    );
  } finally { rmSync(f.workspace, { recursive: true, force: true }); }
});
