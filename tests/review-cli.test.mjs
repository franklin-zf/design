import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const cli = resolve('scripts/design.mjs');

test('review requires an execution plan', () => {
  const result = spawnSync(process.execPath, [
    cli,
    'review',
    'examples/data-report-pass'
  ], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /review requires --execution-plan/);
});

test('review rejects an artifact path that differs from the plan', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'design-review-cli-'));
  try {
    const artifact = join(workspace, 'artifact');
    mkdirSync(artifact);
    writeFileSync(join(artifact, 'manifest.json'), '{"artifact_type":"data-report"}\n');
    const planPath = join(workspace, 'plan.json');
    writeFileSync(planPath, `${JSON.stringify({
      artifact: {
        workspace_root: workspace,
        artifact_dir: 'different-artifact'
      },
      profile: 'standard'
    })}\n`);
    const result = spawnSync(process.execPath, [
      cli,
      'review',
      artifact,
      `--execution-plan=${planPath}`
    ], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /artifact path must match/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
