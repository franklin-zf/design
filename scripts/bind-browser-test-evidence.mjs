#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync
} from 'node:fs';
import {
  isAbsolute,
  relative,
  resolve
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeArtifactDigest } from './lib/artifact-digest.mjs';
import {
  validateBrowserTestEvidence
} from './validate-browser-test-evidence.mjs';

const modulePath = fileURLToPath(import.meta.url);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function inside(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
}

function regularArtifactFile(root, ref, label) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).includes('..')) {
    throw new Error(`${label} must be artifact-relative`);
  }
  const path = resolve(root, ref);
  if (!inside(root, path) || !existsSync(path)
      || lstatSync(path).isSymbolicLink()) {
    throw new Error(`${label} is missing, unsafe, or a symlink: ${ref}`);
  }
  const real = realpathSync(path);
  if (!inside(root, real) || !statSync(real).isFile()) {
    throw new Error(`${label} must resolve to a regular artifact file`);
  }
  return real;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

export function bindBrowserTestEvidence(
  artifactDirectory,
  input,
  options = {}
) {
  const artifactRoot = realpathSync(resolve(artifactDirectory));
  const planPath = resolve(
    options.executionPlanPath
      || joinArtifact(artifactRoot, '.design/execution-plan.json')
  );
  const renderSpecPath = resolve(
    options.renderSpecPath
      || joinArtifact(artifactRoot, '.design/render-spec.json')
  );
  const plan = readJson(planPath, 'execution plan');
  const renderSpec = readJson(renderSpecPath, 'render spec');
  if (!['browser-mcp', 'target-player'].includes(input?.adapter?.id)) {
    throw new Error('host trace adapter must be browser-mcp or target-player');
  }
  if (!Array.isArray(input.runs) || !input.runs.length) {
    throw new Error('host trace requires at least one run');
  }
  const runs = input.runs.map((run) => {
    if ((run.assertions || []).some((assertion) => assertion.passed !== true)
        || (run.console_errors || []).length
        || (run.page_errors || []).length
        || (run.unauthorized_requests || []).length) {
      throw new Error(`host trace run is not passing: ${run.id || '<missing>'}`);
    }
    const screenshotPath = regularArtifactFile(
      artifactRoot,
      run.after_screenshot?.ref,
      `host trace run ${run.id || '<missing>'} screenshot`
    );
    return {
      ...run,
      after_screenshot: {
        ref: run.after_screenshot.ref,
        sha256: sha256(readFileSync(screenshotPath))
      },
      passed: true
    };
  });
  const evidence = {
    schema_version: 'design-browser-test-evidence/v1',
    adapter: input.adapter,
    generated_at: new Date().toISOString(),
    artifact_digest: computeArtifactDigest(artifactRoot),
    execution_plan_digest: plan.resolved_gate_plan_digest,
    render_spec_digest: renderSpec.spec_digest,
    runs
  };
  const outputPath = resolve(
    options.outputPath
      || joinArtifact(artifactRoot, 'browser-test-evidence.json')
  );
  if (!inside(artifactRoot, outputPath)) {
    throw new Error('browser evidence output must stay inside the artifact');
  }
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  const errors = validateBrowserTestEvidence(artifactRoot, {
    evidenceRef: relative(artifactRoot, outputPath).split('\\').join('/'),
    executionPlanPath: planPath,
    renderSpecPath
  });
  if (errors.length) {
    throw new Error(`bound browser evidence is invalid:\n- ${errors.join('\n- ')}`);
  }
  return evidence;
}

function joinArtifact(root, ref) {
  return resolve(root, ref);
}

function option(name) {
  return process.argv.find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

if (process.argv[1] === modulePath) {
  try {
    const artifactDirectory = process.argv[2];
    const inputPath = process.argv[3];
    if (!artifactDirectory || !inputPath) {
      throw new Error(
        'Usage: node scripts/bind-browser-test-evidence.mjs '
        + '<artifact-dir> <host-trace.json> '
        + '[--execution-plan=<path>] [--render-spec=<path>] [--out=<path>]'
      );
    }
    const evidence = bindBrowserTestEvidence(
      artifactDirectory,
      readJson(resolve(inputPath), 'host trace'),
      {
        executionPlanPath: option('--execution-plan'),
        renderSpecPath: option('--render-spec'),
        outputPath: option('--out')
      }
    );
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
