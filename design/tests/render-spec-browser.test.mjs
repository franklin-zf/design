import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { computeArtifactDigest } from '../scripts/validate-evidence-contract.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};

test('Chromium executes every declared viewport, state, assertion, and segment with hashed screenshots', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'design-render-spec-browser-'));
  const artifact = join(temporaryRoot, 'artifact');
  try {
    cpSync(resolve('examples/data-report-pass'), artifact, { recursive: true });
    const planDigest = 'b'.repeat(64);
    const payload = {
      schema_version: 'design-render-spec/v2',
      viewports: [1440, 390, 320],
      segments: [
        { id: 'primary', kind: 'selector', selector: '[data-design-id="primary-finding"]' },
        { id: 'caveats', kind: 'selector', selector: '[data-design-id="caveats"]' }
      ],
      states: [
        { id: 'default', setup: [], assertions: [{ kind: 'visible', selector: 'main' }] },
        { id: 'source-visible', setup: [], assertions: [{ kind: 'text', selector: '[data-design-id="report-context"]', expected: 'Source' }] }
      ],
      remote_policy: { mode: 'deny_all', allowed_origins: [] }
    };
    const spec = {
      ...payload,
      resolved_plan_digest: planDigest,
      artifact_digest: computeArtifactDigest(artifact),
      spec_digest: sha(stable(payload))
    };
    const specPath = join(temporaryRoot, 'render-spec.json');
    const profilePath = join(artifact, 'render-profile.json');
    writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
    const result = spawnSync(process.execPath, [
      resolve('scripts/render-smoke.mjs'), join(artifact, 'index.html'),
      '--viewports=desktop,mobile,small-phone', '--strict-layout', `--spec=${specPath}`,
      `--profile-out=${profilePath}`, `--artifact-digest=${spec.artifact_digest}`, `--plan-digest=${planDigest}`
    ], { encoding: 'utf8', timeout: 120000 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    assert.deepEqual(profile.profiles.map((item) => item.width), [1440, 390, 320]);
    for (const viewport of profile.profiles) {
      assert.equal(viewport.strict_success, true);
      assert.equal(viewport.reduced_motion, 'passed');
      assert.deepEqual(viewport.states.map((state) => state.id), ['default', 'source-visible']);
      for (const state of viewport.states) {
        assert.ok(state.assertions.every((assertion) => assertion.passed));
        assert.deepEqual(state.segments.map((segment) => segment.id), ['primary', 'caveats']);
        for (const segment of state.segments) {
          const screenshot = resolve(artifact, segment.screenshot_ref);
          assert.equal(existsSync(screenshot) && statSync(screenshot).isFile(), true);
          assert.equal(sha(readFileSync(screenshot)), segment.screenshot_sha256);
        }
      }
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
