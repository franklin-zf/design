import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { v2Request } from './fixtures/execution-request.mjs';

const packageRoot = resolve('.');
const registry = JSON.parse(readFileSync(join(packageRoot, 'assets/templates/registry.json'), 'utf8'));
const hash = (value) => createHash('sha256').update(value).digest('hex');

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

test('cache and telemetry reject symlinked parents and create no outside file', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  for (const target of ['cache', 'telemetry']) {
    const f = fixture();
    const outside = mkdtempSync(join(tmpdir(), 'design-v2-outside-'));
    try {
      const link = join(realpathSync(f.workspace), `${target}-link`);
      symlinkSync(outside, link);
      const plan = await planFor(f.workspace);
      const outsideFile = join(outside, target === 'cache' ? 'nested' : 'escaped.ndjson');
      await assert.rejects(
        () => runExecutionPlan(plan, {
          ...(target === 'cache' ? { cacheDir: join(link, 'nested') } : { telemetryPath: join(link, 'escaped.ndjson') }),
          executeGate: async () => ({ status: 'passed', exit_code: 0 })
        }),
        /symbolic-link path component/i
      );
      assert.equal(existsSync(outsideFile), false);
    } finally {
      rmSync(f.workspace, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
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

test('dependency scheduler never starts evidence validation before render-smoke completes', async () => {
  const { compileExecutionPlan } = await import('../scripts/compile-execution-plan.mjs');
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const f = fixture();
  try {
    const input = v2Request({
      output_surface: { artifact_dir: 'artifact', artifact_type: 'dashboard', template_id: 'operational-dashboard' },
      constraints: { ...v2Request().constraints, workspace_root: f.workspace }
    });
    const plan = compileExecutionPlan(input, { registry });
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
