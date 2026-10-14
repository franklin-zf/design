import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { computeArtifactDigest } from '../scripts/lib/artifact-digest.mjs';
import {
  bindBrowserTestEvidence
} from '../scripts/bind-browser-test-evidence.mjs';
import {
  validateBrowserTestEvidence
} from '../scripts/validate-browser-test-evidence.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'browser-evidence-'));
  mkdirSync(join(directory, '.design'));
  mkdirSync(join(directory, 'qa'));
  writeFileSync(
    join(directory, 'index.html'),
    '<main><button id="filter">筛选</button></main>\n'
  );
  writeJson(join(directory, 'manifest.json'), {
    artifact_type: 'dashboard'
  });
  const planDigest = 'a'.repeat(64);
  const renderSpecDigest = 'b'.repeat(64);
  writeJson(join(directory, '.design', 'execution-plan.json'), {
    resolved_gate_plan_digest: planDigest
  });
  writeJson(join(directory, '.design', 'render-spec.json'), {
    spec_digest: renderSpecDigest
  });
  const screenshotPath = join(directory, 'qa', 'filter.png');
  writeFileSync(screenshotPath, 'browser screenshot');
  writeJson(join(directory, 'browser-test-evidence.json'), {
    schema_version: 'design-browser-test-evidence/v1',
    adapter: {
      id: 'playwright',
      version: '1.61.1',
      runtime: '/runtime/chromium'
    },
    generated_at: '2026-10-14T00:00:00.000Z',
    artifact_digest: computeArtifactDigest(directory),
    execution_plan_digest: planDigest,
    render_spec_digest: renderSpecDigest,
    runs: [{
      id: 'mobile-filter-applied',
      requirement_ids: ['REQ-001'],
      viewport: 390,
      state: 'filter-applied',
      actions: [{
        action: 'click',
        selector: '#filter'
      }],
      assertions: [{
        kind: 'visible',
        selector: '#filter',
        actual: true,
        passed: true
      }],
      after_screenshot: {
        ref: 'qa/filter.png',
        sha256: sha256(readFileSync(screenshotPath))
      },
      console_errors: [],
      page_errors: [],
      unauthorized_requests: [],
      passed: true
    }]
  });
  return directory;
}

test('browser evidence binds artifact, plan, render spec, and screenshot', () => {
  const directory = fixture();
  try {
    assert.deepEqual(validateBrowserTestEvidence(directory, {
      expectedRequirementIds: ['REQ-001']
    }), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('browser evidence rejects digest and requirement coverage drift', () => {
  const directory = fixture();
  try {
    const path = join(directory, 'browser-test-evidence.json');
    const evidence = JSON.parse(readFileSync(path, 'utf8'));
    evidence.execution_plan_digest = 'c'.repeat(64);
    evidence.runs[0].requirement_ids = ['REQ-OTHER'];
    evidence.runs[0].after_screenshot.sha256 = 'd'.repeat(64);
    writeJson(path, evidence);
    const output = validateBrowserTestEvidence(directory, {
      expectedRequirementIds: ['REQ-001']
    }).join('\n');
    assert.match(output, /execution_plan_digest mismatch/);
    assert.match(output, /does not cover requirement REQ-001/);
    assert.match(output, /screenshot SHA-256 mismatch/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Browser MCP traces bind into the canonical evidence contract', () => {
  const directory = fixture();
  try {
    unlinkSync(join(directory, 'browser-test-evidence.json'));
    const evidence = bindBrowserTestEvidence(directory, {
      adapter: {
        id: 'browser-mcp',
        version: '1.0.0',
        runtime: 'integrated-browser'
      },
      runs: [{
        id: 'mobile-filter-applied',
        requirement_ids: ['REQ-001'],
        viewport: 390,
        state: 'filter-applied',
        actions: [{ action: 'click', selector: '#filter' }],
        assertions: [{
          kind: 'visible',
          selector: '#filter',
          actual: true,
          passed: true
        }],
        after_screenshot: { ref: 'qa/filter.png' },
        console_errors: [],
        page_errors: [],
        unauthorized_requests: []
      }]
    });
    assert.equal(evidence.adapter.id, 'browser-mcp');
    assert.deepEqual(validateBrowserTestEvidence(directory, {
      expectedRequirementIds: ['REQ-001']
    }), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
