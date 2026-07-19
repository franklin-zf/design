#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync,
  openSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync, writeSync
} from 'node:fs';
import { constants as fsConstants } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { automaticGateIds, planSchemaVersion, sha256Value } from './compile-execution-plan.mjs';
import { computeArtifactDigest } from './validate-evidence-contract.mjs';
import { validateJsonInstance } from './lib/json-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = realpathSync(resolve(dirname(modulePath), '..'));
const planSchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/execution-plan.schema.json'), 'utf8'));
const eventSchema = 'design-execution-event/v2';
const maxWorkers = 4;

const gateAdapters = new Map([
  ['validate-aesthetic-contract', { script: 'validate-aesthetic-contract.mjs', target: 'artifact' }],
  ['validate-asset-contract', { script: 'validate-asset-contract.mjs', target: 'artifact' }],
  ['validate-claim-map', { script: 'validate-claim-map.mjs', target: 'artifact' }],
  ['validate-data-provenance', { script: 'validate-data-provenance.mjs', target: 'artifact' }],
  ['validate-design-output', { script: 'validate-design-output.mjs', target: 'artifact' }],
  ['validate-design-system-package', { script: 'validate-design-system-package.mjs', target: 'skill' }],
  ['validate-evidence-contract', { script: 'validate-evidence-contract.mjs', target: 'artifact' }],
  ['validate-layout-lock', { script: 'validate-layout-lock.mjs', target: 'artifact' }],
  ['validate-poster-anti-ai-slop', { script: 'validate-poster-anti-ai-slop.mjs', target: 'artifact' }],
  ['validate-poster-contract', { script: 'validate-poster-contract.mjs', target: 'artifact' }],
  ['validate-summary-map', { script: 'validate-summary-map.mjs', target: 'artifact' }],
  ['validate-visual-rhythm', { script: 'validate-visual-rhythm.mjs', target: 'artifact' }],
  ['render-smoke', { script: 'render-smoke.mjs', target: 'index' }],
  ['tweakable-smoke', { script: 'tweakable-smoke.mjs', target: 'index' }]
]);

function isInside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function safeRelative(path) {
  if (typeof path !== 'string' || !path.trim() || isAbsolute(path)) return false;
  const normalized = normalize(path);
  return normalized !== '..' && !normalized.startsWith(`..${sep}`);
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function validateCanonicalPlan(plan) {
  const errors = validateJsonInstance(planSchema, plan);
  if (errors.length) throw new Error(`invalid resolved gate plan: ${errors.join('; ')}`);
  if (plan.schema_version !== planSchemaVersion) throw new Error('legacy plan is import-only; recompile a v2 request');
  if (plan.plan_id !== plan.resolved_gate_plan_digest) throw new Error('plan_id and resolved_gate_plan_digest must match');
  const payload = Object.fromEntries(Object.entries(plan).filter(([key]) => key !== 'plan_id' && key !== 'resolved_gate_plan_digest'));
  if (sha256Value(payload) !== plan.resolved_gate_plan_digest) throw new Error('resolved gate plan digest mismatch; recompile before running');
  if (plan.execution_policy.code_class === 'untrusted' && plan.execution_policy.decision !== 'zero_spawn') {
    throw new Error('untrusted plans must use zero_spawn');
  }
  if (plan.execution_policy.decision === 'zero_spawn' && plan.execution_policy.spawn_allowed) {
    throw new Error('zero_spawn cannot set spawn_allowed');
  }
  for (const gate of plan.automatic_gates) {
    if (Object.hasOwn(gate, 'command') || gate.adapter_args.length) throw new Error(`plan-provided command/args are forbidden for ${gate.gate_id}`);
    if (!automaticGateIds.has(gate.gate_id) || !gateAdapters.has(gate.gate_id)) throw new Error(`unknown automatic gate: ${gate.gate_id}`);
  }
}

function resolveWorkspace(plan) {
  const workspaceValue = plan.artifact.workspace_root;
  if (!isAbsolute(workspaceValue) || !existsSync(workspaceValue)) throw new Error('workspace_root must be an existing absolute directory');
  const workspaceRoot = realpathSync(workspaceValue);
  if (!statSync(workspaceRoot).isDirectory()) throw new Error('workspace_root must be a directory');
  if (!safeRelative(plan.artifact.artifact_dir)) throw new Error('artifact_dir must be workspace-relative without traversal');
  const candidate = resolve(workspaceRoot, plan.artifact.artifact_dir);
  if (!isInside(workspaceRoot, candidate)) throw new Error('artifact_dir escapes workspace_root');
  if (!existsSync(candidate)) throw new Error(`artifact directory does not exist: ${candidate}`);
  if (lstatSync(candidate).isSymbolicLink()) throw new Error('artifact_dir must not be a symbolic link');
  const artifactRoot = realpathSync(candidate);
  if (!isInside(workspaceRoot, artifactRoot)) throw new Error('artifact_dir resolves outside workspace_root');
  if (isInside(skillRoot, artifactRoot)) throw new Error('runtime artifact_dir cannot be inside the read-only skill root');
  return { workspaceRoot, artifactRoot };
}

function prepareWritablePath(path, workspaceRoot, label, kind) {
  const resolvedPath = resolve(path);
  if (!isInside(workspaceRoot, resolvedPath)) throw new Error(`${label} must be inside workspace_root`);
  if (isInside(skillRoot, resolvedPath)) throw new Error(`${label} cannot be inside the read-only skill root`);
  const rel = relative(workspaceRoot, resolvedPath);
  const parts = rel.split(sep).filter(Boolean);
  const parentParts = kind === 'file' ? parts.slice(0, -1) : parts;
  let current = workspaceRoot;
  for (const part of parentParts) {
    current = join(current, part);
    if (existsSync(current)) {
      if (lstatSync(current).isSymbolicLink()) throw new Error(`${label} contains a symbolic-link path component`);
      if (!statSync(current).isDirectory()) throw new Error(`${label} parent component is not a directory`);
      if (!isInside(workspaceRoot, realpathSync(current))) throw new Error(`${label} real parent escapes workspace_root`);
    } else {
      mkdirSync(current, { mode: 0o700 });
      if (lstatSync(current).isSymbolicLink() || !isInside(workspaceRoot, realpathSync(current))) {
        throw new Error(`${label} parent creation did not remain in workspace_root`);
      }
    }
  }
  if (kind === 'file' && existsSync(resolvedPath)) {
    if (lstatSync(resolvedPath).isSymbolicLink()) throw new Error(`${label} cannot be a symbolic link`);
    if (!isInside(workspaceRoot, realpathSync(resolvedPath))) throw new Error(`${label} real path escapes workspace_root`);
  }
  return resolvedPath;
}

function secureWriteFile(path, content) {
  const descriptor = openSync(path, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_TRUNC | fsConstants.O_NOFOLLOW, 0o600);
  try { writeSync(descriptor, content); }
  finally { closeSync(descriptor); }
}

export function sandboxProfile({ interpreter, readPaths, writePaths }) {
  const escape = (value) => value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  const readRules = [interpreter, ...readPaths].map((path) => `(allow file-read* (subpath "${escape(path)}"))`).join('\n');
  const writeRules = writePaths.map((path) => `(allow file-write* (subpath "${escape(path)}"))`).join('\n');
  return `(version 1)\n(deny default)\n(allow process-exec (literal "${escape(interpreter)}"))\n(allow process-info*)\n(allow sysctl-read)\n${readRules}\n${writeRules}\n`;
}

function sanitizedEnvironment() {
  return { PATH: '/usr/bin:/bin:/usr/sbin:/sbin', TZ: 'UTC', LC_ALL: 'C', LANG: 'C', HOME: '/nonexistent' };
}

export function spawnProcess(executable, args, options = {}) {
  return new Promise((finish) => {
    const detached = options.detached ?? process.platform !== 'win32';
    const child = spawn(executable, args, {
      cwd: options.cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'],
      env: options.env || sanitizedEnvironment(), detached
    });
    let stdout = '';
    let stderr = '';
    const maxOutputBytes = options.maxOutputBytes || 1048576;
    const killGraceMs = options.killGraceMs ?? 250;
    let outputBytes = 0;
    let terminationReason = null;
    let killTimer = null;
    let confirmationTimer = null;
    let settled = false;

    function signal(signalName) {
      try {
        if (detached && child.pid) process.kill(-child.pid, signalName);
        else child.kill(signalName);
      } catch (error) {
        if (error.code !== 'ESRCH') stderr += `\n${signalName} failed: ${error.message}`;
      }
    }

    function complete(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(killTimer);
      clearTimeout(confirmationTimer);
      finish(value);
    }

    function terminate(reason) {
      if (terminationReason) return;
      terminationReason = reason;
      signal('SIGTERM');
      killTimer = setTimeout(() => {
        signal('SIGKILL');
        confirmationTimer = setTimeout(() => complete({
          status: 'failed', exit_code: null, stdout, stderr,
          termination_reason: terminationReason,
          completion_confirmed: false
        }), Math.max(250, killGraceMs));
      }, killGraceMs);
    }

    function collect(channel, chunk) {
      const bytes = Buffer.from(chunk);
      const remaining = Math.max(0, maxOutputBytes - outputBytes);
      if (remaining) {
        const text = bytes.subarray(0, remaining).toString();
        if (channel === 'stdout') stdout += text;
        else stderr += text;
      }
      outputBytes += bytes.length;
      if (outputBytes > maxOutputBytes) terminate('max-output-bytes-exceeded');
    }

    child.stdout.on('data', (chunk) => collect('stdout', chunk));
    child.stderr.on('data', (chunk) => collect('stderr', chunk));
    const timeoutTimer = setTimeout(() => terminate('timeout'), options.timeoutMs || 30000);
    child.once('error', (error) => complete({
      status: 'failed', exit_code: null, stdout, stderr: error.message,
      termination_reason: terminationReason || 'spawn-error', completion_confirmed: true
    }));
    child.once('close', (code) => {
      complete({
        status: code === 0 && !terminationReason ? 'passed' : 'failed', exit_code: code,
        stdout, stderr, termination_reason: terminationReason,
        completion_confirmed: true
      });
    });
  });
}

export async function executePolicy(plan, context, options = {}) {
  const policy = plan.execution_policy;
  if (policy.decision === 'zero_spawn' || policy.code_class === 'untrusted') {
    return { execution_status: 'blocked_untrusted', spawned: 0, evidence: policy.reason_codes.join(',') };
  }
  const derived = plan.normalized_request.conditional_policies.derived_data;
  if (derived.mode === 'none' || !policy.spawn_allowed) return { execution_status: 'complete', spawned: 0, evidence: 'no derived command requested' };
  const execution = derived.execution;
  const treeSymlinks = [];
  function scanTree(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (lstatSync(path).isSymbolicLink()) treeSymlinks.push(relative(context.artifactRoot, path));
      else if (entry.isDirectory()) scanTree(path);
    }
  }
  scanTree(context.artifactRoot);
  if (treeSymlinks.length) return { execution_status: 'blocked_untrusted', spawned: 0, evidence: `artifact-tree-symlink:${treeSymlinks.sort().join(',')}` };
  if (!safeRelative(execution.entrypoint)) return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'unsafe-entrypoint' };
  const sourceEntrypoint = resolve(context.artifactRoot, execution.entrypoint);
  if (!isInside(context.artifactRoot, sourceEntrypoint) || !existsSync(sourceEntrypoint) || lstatSync(sourceEntrypoint).isSymbolicLink()) {
    return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'entrypoint-path-or-symlink-invalid' };
  }
  if (hashFile(sourceEntrypoint) !== execution.code_sha256) return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'code-hash-drift' };
  if (!safeRelative(execution.dependency_lock_ref)) return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'dependency-lock-path-invalid' };
  const lockPath = resolve(context.artifactRoot, execution.dependency_lock_ref);
  if (!isInside(context.artifactRoot, lockPath) || !existsSync(lockPath) || lstatSync(lockPath).isSymbolicLink() || hashFile(lockPath) !== execution.dependency_lock_sha256) {
    return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'dependency-lock-hash-drift' };
  }
  const sandboxBinary = options.sandboxBinary ?? '/usr/bin/sandbox-exec';
  const sandboxExists = options.sandboxAvailable ?? existsSync(sandboxBinary);
  if (!sandboxExists) return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'host-isolation-unavailable' };
  const limiterId = execution.resource_limiter_id;
  const limiterRegistry = new Map();
  const limiter = limiterRegistry.get(limiterId);
  if (!limiter) return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'registered-resource-limiter-unavailable' };

  let runtimeRoot = context.artifactRoot;
  let disposableRoot = null;
  if (policy.code_class === 'restricted') {
    disposableRoot = mkdtempSync(join(tmpdir(), 'design-restricted-'));
    runtimeRoot = join(disposableRoot, 'artifact');
    cpSync(context.artifactRoot, runtimeRoot, { recursive: true, dereference: false });
  }
  const entrypoint = resolve(runtimeRoot, execution.entrypoint);
  const executable = options.nodeBinary || process.execPath;
  const readPaths = [runtimeRoot, '/System', '/usr/lib', '/Library/Apple', ...execution.read_allowlist.map((path) => resolve(runtimeRoot, path))];
  const writePaths = execution.write_allowlist.map((path) => resolve(runtimeRoot, path));
  const profile = sandboxProfile({ interpreter: executable, readPaths, writePaths });
  const probe = options.sandboxProbe || (async () => {
    const result = await spawnProcess(sandboxBinary, ['-p', profile, executable, '-e', ''], {
      cwd: runtimeRoot, env: sanitizedEnvironment(), timeoutMs: 5000
    });
    return result.status === 'passed';
  });
  if (!await probe()) {
    if (disposableRoot) rmSync(disposableRoot, { recursive: true, force: true });
    return { execution_status: 'blocked_untrusted', spawned: 0, evidence: 'host-isolation-preflight-failed' };
  }
  const args = limiter.wrap({ sandboxBinary, profile, executable, entrypoint, argv: execution.argv || [], execution });
  const invoke = options.spawnImpl || spawnProcess;
  try {
    const result = await invoke(sandboxBinary, args, {
      cwd: runtimeRoot, env: sanitizedEnvironment(), timeoutMs: execution.timeout_ms,
      maxOutputBytes: execution.max_output_bytes
    });
    return { execution_status: result.status === 'passed' ? 'complete' : 'failed', spawned: 1, evidence: `sandbox:${policy.sandbox_profile}`, exit_code: result.exit_code ?? null };
  } finally {
    if (disposableRoot) rmSync(disposableRoot, { recursive: true, force: true });
  }
}

export function gateInvocation(gate, artifactRoot, artifactDigest, resolvedPlanDigest, renderSpecPath) {
  const adapter = gateAdapters.get(gate.gate_id);
  const target = adapter.target === 'skill' ? skillRoot : adapter.target === 'index' ? join(artifactRoot, 'index.html') : artifactRoot;
  const args = [join(skillRoot, 'scripts', adapter.script), target];
  let evidence = `node scripts/${adapter.script}`;
  if (gate.gate_id === 'render-smoke') {
    const profilePath = join(artifactRoot, 'render-profile.json');
    args.push(
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout',
      `--spec=${renderSpecPath}`,
      `--profile-out=${profilePath}`,
      `--artifact-digest=${artifactDigest}`,
      `--plan-digest=${resolvedPlanDigest}`
    );
    evidence = profilePath;
  }
  return { executable: process.execPath, args, evidence };
}

function normalizeWorkers(value, maximum) {
  const workers = value ?? maximum ?? 2;
  if (!Number.isInteger(workers) || workers < 1 || workers > maxWorkers) throw new Error(`workers must be between 1 and ${maxWorkers}`);
  return Math.min(workers, maximum, maxWorkers);
}

export async function runExecutionPlan(plan, options = {}) {
  validateCanonicalPlan(plan);
  const context = resolveWorkspace(plan);
  const workers = normalizeWorkers(options.workers, plan.runner.max_concurrency);
  const cacheDir = prepareWritablePath(options.cacheDir || join(context.artifactRoot, '.design', 'cache'), context.workspaceRoot, 'cacheDir', 'directory');
  const telemetryPath = prepareWritablePath(options.telemetryPath || join(context.artifactRoot, '.design', 'execution.ndjson'), context.workspaceRoot, 'telemetryPath', 'file');
  const started = performance.now();
  const emit = (event, fields = {}) => {
    const descriptor = openSync(telemetryPath, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_APPEND | fsConstants.O_NOFOLLOW, 0o600);
    try { writeSync(descriptor, `${JSON.stringify({ schema_version: eventSchema, event, plan_digest: plan.resolved_gate_plan_digest, timestamp: new Date().toISOString(), ...fields })}\n`); }
    finally { closeSync(descriptor); }
  };
  emit('run_started', { workers });

  const policyResult = await executePolicy(plan, context, options);
  emit('policy_finished', policyResult);
  if (policyResult.execution_status === 'blocked_untrusted') {
    const result = {
      schema_version: 'design-execution-result/v2', plan_id: plan.plan_id,
      resolved_gate_plan_digest: plan.resolved_gate_plan_digest,
      execution_status: 'blocked_untrusted', assurance_status: 'pending', delivery_status: 'blocked',
      gate_results: [], human_gate_results: plan.human_gates.map((gate) => ({ gate_id: gate.gate_id, status: 'pending' })),
      telemetry_path: telemetryPath
    };
    emit('run_finished', { execution_status: result.execution_status, spawned: 0 });
    return result;
  }
  if (policyResult.execution_status !== 'complete') {
    return { schema_version: 'design-execution-result/v2', plan_id: plan.plan_id, resolved_gate_plan_digest: plan.resolved_gate_plan_digest, execution_status: 'failed', assurance_status: 'failed', delivery_status: 'blocked', gate_results: [], human_gate_results: [], telemetry_path: telemetryPath };
  }

  const digest = computeArtifactDigest(context.artifactRoot);
  const renderSpecPath = prepareWritablePath(join(context.artifactRoot, '.design', 'render-spec.json'), context.workspaceRoot, 'renderSpecPath', 'file');
  const runtimeRenderSpec = {
    ...plan.render_spec,
    resolved_plan_digest: plan.resolved_gate_plan_digest,
    artifact_digest: digest
  };
  secureWriteFile(renderSpecPath, `${JSON.stringify(runtimeRenderSpec, null, 2)}\n`);
  const executeGate = options.executeGate || (async (gate) => {
    const invocation = gateInvocation(gate, context.artifactRoot, digest, plan.resolved_gate_plan_digest, renderSpecPath);
    const output = await spawnProcess(invocation.executable, invocation.args, { cwd: context.workspaceRoot, timeoutMs: gate.timeout_ms });
    return { ...output, evidence: invocation.evidence };
  });
  const results = [];
  const resultById = new Map();
  const pending = new Set(plan.automatic_gates.map((gate) => gate.gate_id));
  while (pending.size) {
    for (const gate of plan.automatic_gates.filter((item) => pending.has(item.gate_id))) {
      if (gate.depends_on.some((id) => resultById.get(id)?.status !== 'passed' && resultById.has(id))) {
        const blocked = { gate_id: gate.gate_id, status: 'blocked', exit_code: null, evidence: 'blocked by failed dependency' };
        results.push(blocked);
        resultById.set(gate.gate_id, blocked);
        pending.delete(gate.gate_id);
      }
    }
    const batch = plan.automatic_gates
      .filter((gate) => pending.has(gate.gate_id) && gate.depends_on.every((id) => resultById.get(id)?.status === 'passed'))
      .slice(0, workers);
    if (!batch.length) throw new Error('no runnable automatic gates remain; dependency graph is invalid');
    const batchResults = await Promise.all(batch.map(async (gate) => {
      const raw = await executeGate(gate, { ...context, artifact_digest: digest });
      return { gate_id: gate.gate_id, status: raw.status === 'passed' ? 'passed' : 'failed', exit_code: raw.exit_code ?? null, evidence: raw.evidence || '' };
    }));
    for (const result of batchResults) {
      results.push(result);
      resultById.set(result.gate_id, result);
      pending.delete(result.gate_id);
    }
  }
  const automaticPassed = results.every((result) => result.status === 'passed');
  const human = plan.human_gates.map((gate) => ({ gate_id: gate.gate_id, status: 'pending', purpose: gate.purpose }));
  const executionStatus = automaticPassed ? 'complete' : 'failed';
  const assuranceStatus = automaticPassed ? 'pending' : 'failed';
  const deliveryStatus = plan.normalized_request.conditional_policies.schematic.enabled && automaticPassed ? 'schematic_only' : 'blocked';
  const result = {
    schema_version: 'design-execution-result/v2', plan_id: plan.plan_id,
    resolved_gate_plan_digest: plan.resolved_gate_plan_digest,
    execution_status: executionStatus, assurance_status: assuranceStatus, delivery_status: deliveryStatus,
    artifact_digest: digest, gate_results: results, human_gate_results: human, telemetry_path: telemetryPath
  };
  emit('run_finished', { execution_status: executionStatus, assurance_status: assuranceStatus, delivery_status: deliveryStatus, duration_ms: Number((performance.now() - started).toFixed(3)) });
  return result;
}

function parseCli(argv) {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  if (positional.length !== 1) throw new Error('Usage: node scripts/run-execution-plan.mjs <resolved-plan.json> [--workers=2] [--cache-dir=<dir>] [--telemetry=<path>]');
  return {
    planPath: positional[0],
    workers: Number(argv.find((arg) => arg.startsWith('--workers='))?.slice(10)) || undefined,
    cacheDir: argv.find((arg) => arg.startsWith('--cache-dir='))?.slice(12),
    telemetryPath: argv.find((arg) => arg.startsWith('--telemetry='))?.slice(12)
  };
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const cli = parseCli(process.argv.slice(2));
    const plan = JSON.parse(readFileSync(resolve(cli.planPath), 'utf8'));
    const result = await runExecutionPlan(plan, cli);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.execution_status !== 'complete') process.exitCode = 1;
  } catch (error) {
    console.error(`Execution plan run failed: ${error.message}`);
    process.exitCode = 2;
  }
}
