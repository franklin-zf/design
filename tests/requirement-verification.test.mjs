import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { computeArtifactDigest } from '../scripts/lib/artifact-digest.mjs';
import {
  loadDesignProfileAssets,
  resolveDesignProfile
} from '../scripts/lib/design-profile.mjs';
import {
  operationalH0Requirements,
  validateRequirementVerification
} from '../scripts/validate-requirement-verification.mjs';
import { compileExecutionPlan } from '../scripts/compile-execution-plan.mjs';
import {
  operationalRenderPolicy,
  v2Request
} from './fixtures/execution-request.mjs';

const root = resolve('.');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const registry = JSON.parse(readFileSync(
  join(root, 'assets/templates/registry.json'),
  'utf8'
));
const profileAssets = loadDesignProfileAssets(root);

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function binding(path) {
  return {
    ref: path,
    sha256: sha256(readFileSync(path))
  };
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'design-requirements-'));
  writeFileSync(
    join(directory, 'index.html'),
    '<main><button data-requirement-id="REQ-001">筛选</button></main>\n'
  );
  writeJson(join(directory, 'manifest.json'), {
    schema_version: 'design-artifact/v1',
    artifact_type: 'dashboard'
  });
  writeFileSync(
    join(directory, 'prd.md'),
    '# 需求\n\n用户可以在移动端完成筛选并看到已选条件。\n'
  );
  mkdirSync(join(directory, '.design'));
  mkdirSync(join(directory, 'qa'));
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
      state: 'mobile-filter-applied',
      actions: [{ action: 'click', selector: '[data-requirement-id="REQ-001"]' }],
      assertions: [{
        kind: 'visible',
        selector: '[data-requirement-id="REQ-001"]',
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
  const record = {
    schema_version: 'design-requirement-verification/v1',
    artifact_refs: [
      binding(join(directory, 'index.html')),
      binding(join(directory, 'manifest.json'))
    ].map((item) => ({ ...item, ref: item.ref.split('/').pop() })),
    source_refs: [
      binding(join(directory, 'prd.md'))
    ].map((item) => ({ ...item, ref: 'prd.md' })),
    requirements: [
      {
        id: 'REQ-001',
        type: 'interaction',
        priority: 'P0',
        source_ref: 'prd.md',
        source_quote: '用户可以在移动端完成筛选并看到已选条件。',
        acceptance_criteria: [
          '390px 可打开筛选',
          '选择后有可见状态'
        ],
        surface_states: [
          'mobile-default',
          'mobile-filter-applied'
        ],
        verification_method: 'browser-test',
        implementation_refs: [
          'index.html'
        ],
        evidence_refs: [
          {
            ...binding(join(directory, 'browser-test-evidence.json')),
            ref: 'browser-test-evidence.json',
            kind: 'browser-test'
          }
        ],
        status: 'passed',
        reviewer: 'independent-reviewer'
      },
      {
        id: 'REQ-002',
        type: 'visual',
        priority: 'P2',
        source_ref: 'prd.md',
        source_quote: '用户可以在移动端完成筛选并看到已选条件。',
        acceptance_criteria: [
          '筛选状态保持清楚'
        ],
        surface_states: [
          'mobile-filter-applied'
        ],
        verification_method: 'visual-review',
        evidence_refs: [],
        status: 'not_run'
      }
    ],
    coverage: {
      p0_p1_total: 1,
      p0_p1_with_evidence: 1,
      p0_p1_passed: 1,
      status: 'complete'
    },
    non_goals: [
      '本轮不验证桌面筛选重构'
    ]
  };
  writeJson(join(directory, 'requirement-verification.json'), record);
  return directory;
}

test('requirement verification binds source, artifact, evidence, and P0/P1 coverage', () => {
  const directory = fixture();
  try {
    assert.deepEqual(validateRequirementVerification(directory), []);
    const cli = spawnSync(
      process.execPath,
      [join(root, 'scripts/validate-requirement-verification.mjs'), directory],
      { cwd: root, encoding: 'utf8' }
    );
    assert.equal(cli.status, 0, `${cli.stdout}\n${cli.stderr}`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('P0/P1 failed, blocked, or not-run status fails closed', () => {
  const directory = fixture();
  try {
    const path = join(directory, 'requirement-verification.json');
    const record = JSON.parse(readFileSync(path, 'utf8'));
    record.requirements[0].status = 'not_run';
    record.requirements[0].evidence_refs = [];
    record.coverage = {
      p0_p1_total: 1,
      p0_p1_with_evidence: 0,
      p0_p1_passed: 0,
      status: 'incomplete'
    };
    writeJson(path, record);
    const output = validateRequirementVerification(directory).join('\n');
    assert.match(output, /REQ-001 P0 must be passed/);
    assert.match(output, /P0\/P1 requirement coverage is incomplete/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('P0/P1 prototype content and behavior require browser evidence', () => {
  const directory = fixture();
  try {
    const path = join(directory, 'requirement-verification.json');
    const record = JSON.parse(readFileSync(path, 'utf8'));
    record.requirements[0].verification_method = 'content-binding';
    record.requirements[0].evidence_refs[0].kind = 'screenshot';
    writeJson(path, record);
    const output = validateRequirementVerification(directory).join('\n');
    assert.match(output, /must use browser-test or mixed verification/);
    assert.match(output, /must include browser-test evidence/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('artifact, source, and evidence drift invalidate prior acceptance', () => {
  const directory = fixture();
  try {
    writeFileSync(join(directory, 'index.html'), '<main>changed</main>\n');
    writeFileSync(join(directory, 'prd.md'), '# changed\n');
    writeJson(
      join(directory, 'browser-test-evidence.json'),
      { result: 'changed' }
    );
    const output = validateRequirementVerification(directory).join('\n');
    assert.match(output, /artifact ref index\.html SHA-256 mismatch/);
    assert.match(output, /source ref prd\.md SHA-256 mismatch/);
    assert.match(output, /source_quote was not found/);
    assert.match(
      output,
      /evidence browser-test-evidence\.json SHA-256 mismatch/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('coverage values are recomputed and requirement ids stay unique', () => {
  const directory = fixture();
  try {
    const path = join(directory, 'requirement-verification.json');
    const record = JSON.parse(readFileSync(path, 'utf8'));
    record.requirements[1].id = 'REQ-001';
    record.coverage.p0_p1_passed = 0;
    writeJson(path, record);
    const output = validateRequirementVerification(directory).join('\n');
    assert.match(output, /requirement ids must be unique/);
    assert.match(output, /coverage\.p0_p1_passed must equal recomputed value 1/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function assertionResult(assertion) {
  if (assertion.kind === 'relation') {
    return {
      ...assertion,
      actual: {
        source_count: 1,
        target_count: 1,
        delta_px_max: 0,
        measurements: []
      },
      passed: true
    };
  }
  if (assertion.kind === 'locale') {
    return {
      ...assertion,
      actual: {
        locale: 'zh-CN',
        root_count: 1,
        checked_text_nodes: 12,
        checked_accessible_names: 4,
        violations: []
      },
      passed: true
    };
  }
  if (assertion.kind === 'icon') {
    return {
      ...assertion,
      actual: {
        icon_count: 1,
        families: ['ant-design-official'],
        center_delta_px_max: 0,
        measurements: [{
          resource_mode: 'inline-local-symbol',
          accessible_name: '筛选'
        }],
        violations: [],
        asset_sha256: 'a'.repeat(64),
        provenance_id: 'ant-design-official-operational-icons'
      },
      passed: true
    };
  }
  return { ...assertion, actual: true, passed: true };
}

function installOperationalEvidence(directory) {
  const manifestPath = join(directory, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  Object.assign(manifest, {
    style_preset: 'operational-dashboard',
    template_id: 'operational-product'
  });
  writeJson(manifestPath, manifest);

  const profile = resolveDesignProfile({
    schema_version: 'design-brief/v1',
    reader_job: 'operational-workflow',
    primary_relationship: 'system',
    secondary_relationships: [],
    content_density: 'dense',
    brand_context: 'none'
  }, 'dashboard', profileAssets);
  const plan = compileExecutionPlan(v2Request({
    output_surface: {
      artifact_dir: basename(directory),
      artifact_type: 'dashboard',
      template_id: 'operational-product'
    },
    constraints: {
      ...v2Request().constraints,
      workspace_root: dirname(directory)
    },
    conditional_policies: {
      ...v2Request().conditional_policies,
      render: operationalRenderPolicy()
    }
  }), { designProfile: profile, registry });

  const designRoot = join(directory, '.design');
  const qaRoot = join(directory, 'qa');
  mkdirSync(designRoot, { recursive: true });
  mkdirSync(qaRoot, { recursive: true });
  const planPath = join(designRoot, 'execution-plan.json');
  writeJson(planPath, plan);
  const artifactDigest = computeArtifactDigest(directory);
  const renderSpec = {
    ...plan.render_spec,
    resolved_plan_digest: plan.resolved_gate_plan_digest,
    artifact_digest: artifactDigest
  };
  const renderSpecPath = join(designRoot, 'render-spec.json');
  writeJson(renderSpecPath, renderSpec);

  const profiles = [1440, 390, 320].map((width) => ({
    name: String(width),
    width,
    height: 1000,
    strict_success: true,
    states: renderSpec.states.map((state) => {
      const screenshotRef = `qa/${width}-${state.id}.png`;
      const screenshotPath = join(directory, screenshotRef);
      writeFileSync(screenshotPath, `${width}-${state.id}`);
      return {
        id: state.id,
        assertions: state.assertions.map(assertionResult),
        segments: [{
          id: 'main',
          screenshot_ref: screenshotRef,
          screenshot_sha256: sha256(readFileSync(screenshotPath))
        }]
      };
    })
  }));
  const renderProfile = {
    schema_version: 'design-render-profile/v2',
    artifact_digest: artifactDigest,
    resolved_plan_digest: plan.resolved_gate_plan_digest,
    render_spec_digest: renderSpec.spec_digest,
    profiles
  };
  const renderProfilePath = join(directory, 'render-profile.json');
  writeJson(renderProfilePath, renderProfile);
  const browserEvidencePath = join(directory, 'browser-test-evidence.json');
  const browserEvidence = JSON.parse(readFileSync(browserEvidencePath, 'utf8'));
  browserEvidence.artifact_digest = artifactDigest;
  browserEvidence.execution_plan_digest = plan.resolved_gate_plan_digest;
  browserEvidence.render_spec_digest = renderSpec.spec_digest;
  writeJson(browserEvidencePath, browserEvidence);

  const recordPath = join(directory, 'requirement-verification.json');
  const record = JSON.parse(readFileSync(recordPath, 'utf8'));
  record.artifact_refs.find(
    (item) => item.ref === 'manifest.json'
  ).sha256 = sha256(readFileSync(manifestPath));
  record.requirements.find(
    (item) => item.id === 'REQ-001'
  ).evidence_refs[0].sha256 = sha256(readFileSync(browserEvidencePath));
  const screenshotBindings = profiles.flatMap((viewport) => (
    viewport.states.map((state) => ({
      ref: state.segments[0].screenshot_ref,
      sha256: state.segments[0].screenshot_sha256,
      viewport: viewport.width,
      state: state.id
    }))
  ));
  const sharedBinding = {
    artifact: {
      ref: 'index.html',
      sha256: sha256(readFileSync(join(directory, 'index.html')))
    },
    plan: {
      ref: '.design/execution-plan.json',
      sha256: sha256(readFileSync(planPath))
    },
    render_spec: {
      ref: '.design/render-spec.json',
      sha256: sha256(readFileSync(renderSpecPath))
    },
    render_profile: {
      ref: 'render-profile.json',
      sha256: sha256(readFileSync(renderProfilePath))
    }
  };
  record.requirements.push(...operationalH0Requirements.map((requirement) => {
    const requiredStates = new Set(requirement.surface_states);
    const screenshots = screenshotBindings.filter((item) => (
      requiredStates.has(`${item.viewport}-${item.state}`)
    ));
    const evidenceRefs = requirement.id === 'VIS-COLOR'
      ? screenshots.map((item) => ({
          ref: item.ref,
          sha256: item.sha256,
          kind: 'screenshot'
        }))
      : [{
          ref: 'render-profile.json',
          sha256: sharedBinding.render_profile.sha256,
          kind: 'browser-test'
        }];
    return {
      id: requirement.id,
      type: requirement.type,
      priority: requirement.priority,
      source_ref: 'prd.md',
      source_quote: '用户可以在移动端完成筛选并看到已选条件。',
      acceptance_criteria: requirement.acceptance_criteria,
      surface_states: requirement.surface_states,
      verification_method: requirement.verification_method,
      implementation_refs: ['index.html'],
      evidence_refs: evidenceRefs,
      evidence_binding: {
        ...sharedBinding,
        screenshots
      },
      status: 'passed',
      reviewer: 'independent-reviewer'
    };
  }));
  record.coverage = {
    p0_p1_total: 5,
    p0_p1_with_evidence: 5,
    p0_p1_passed: 5,
    status: 'complete'
  };
  writeJson(recordPath, record);
  return { recordPath, renderProfilePath };
}

function refreshRenderProfileBindings(record, renderProfilePath) {
  const digest = sha256(readFileSync(renderProfilePath));
  for (const requirement of record.requirements.filter(
    (item) => item.id.startsWith('VIS-')
  )) {
    requirement.evidence_binding.render_profile.sha256 = digest;
    for (const evidence of requirement.evidence_refs) {
      if (evidence.ref === 'render-profile.json') evidence.sha256 = digest;
    }
  }
}

test('operational artifacts require semantic H0 evidence on one digest chain', () => {
  const directory = fixture();
  try {
    const { recordPath } = installOperationalEvidence(directory);
    assert.deepEqual(validateRequirementVerification(directory), []);

    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.requirements = record.requirements.filter(
      (item) => item.id !== 'VIS-ICON'
    );
    record.coverage = {
      p0_p1_total: 4,
      p0_p1_with_evidence: 4,
      p0_p1_passed: 4,
      status: 'complete'
    };
    writeJson(recordPath, record);
    assert.match(
      validateRequirementVerification(directory).join('\n'),
      /requires exactly one VIS-ICON requirement/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('operational H0 evidence rejects kind swaps, missing states, and stale screenshots', () => {
  for (const scenario of ['kind', 'state', 'screenshot']) {
    const directory = fixture();
    try {
      const { recordPath } = installOperationalEvidence(directory);
      const record = JSON.parse(readFileSync(recordPath, 'utf8'));
      if (scenario === 'kind') {
        record.requirements.find(
          (item) => item.id === 'VIS-LOCALE'
        ).evidence_refs[0].kind = 'screenshot';
      }
      if (scenario === 'state') {
        const align = record.requirements.find(
          (item) => item.id === 'VIS-ALIGN'
        );
        align.evidence_binding.screenshots = align.evidence_binding
          .screenshots.filter((item) => (
            !(item.viewport === 320 && item.state === 'dense')
          ));
      }
      if (scenario === 'screenshot') {
        writeFileSync(join(directory, 'qa/390-error.png'), 'drift');
      }
      writeJson(recordPath, record);
      const output = validateRequirementVerification(directory).join('\n');
      if (scenario === 'kind') {
        assert.match(output, /VIS-LOCALE evidence kind must be browser-test/);
      }
      if (scenario === 'state') {
        assert.match(output, /VIS-ALIGN evidence binding is missing 320-dense/);
      }
      if (scenario === 'screenshot') {
        assert.match(output, /screenshot qa\/390-error\.png SHA-256 mismatch/);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test('operational H0 measured failures override forged passed requirement status', () => {
  for (const scenario of ['alignment', 'icon']) {
    const directory = fixture();
    try {
      const { recordPath, renderProfilePath } = installOperationalEvidence(directory);
      const profile = JSON.parse(readFileSync(renderProfilePath, 'utf8'));
      const state = profile.profiles[0].states.find(
        (item) => item.id === 'default'
      );
      if (scenario === 'alignment') {
        const relation = state.assertions.find(
          (assertion) => assertion.kind === 'relation'
            && assertion.selector !== '[data-icon]'
        );
        relation.actual.delta_px_max = 2.01;
      } else {
        const icon = state.assertions.find(
          (assertion) => assertion.kind === 'icon'
        );
        icon.passed = false;
        icon.actual.measurements[0].resource_mode = 'invalid';
      }
      writeJson(renderProfilePath, profile);
      const record = JSON.parse(readFileSync(recordPath, 'utf8'));
      refreshRenderProfileBindings(record, renderProfilePath);
      writeJson(recordPath, record);
      const output = validateRequirementVerification(directory).join('\n');
      assert.match(
        output,
        scenario === 'alignment'
          ? /VIS-ALIGN 1440-default exceeds 2px tolerance/
          : /VIS-ICON 1440-default must pass local icon provenance/
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});
