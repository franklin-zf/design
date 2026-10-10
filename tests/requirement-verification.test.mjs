import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  operationalH0Requirements,
  validateRequirementVerification
} from '../scripts/validate-requirement-verification.mjs';

const root = resolve('.');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

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
  writeJson(join(directory, 'qa-filter.json'), {
    viewport: 390,
    action: 'open-filter',
    result: 'selected-state-visible'
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
            ...binding(join(directory, 'qa-filter.json')),
            ref: 'qa-filter.json',
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

test('artifact, source, and evidence drift invalidate prior acceptance', () => {
  const directory = fixture();
  try {
    writeFileSync(join(directory, 'index.html'), '<main>changed</main>\n');
    writeFileSync(join(directory, 'prd.md'), '# changed\n');
    writeJson(join(directory, 'qa-filter.json'), { result: 'changed' });
    const output = validateRequirementVerification(directory).join('\n');
    assert.match(output, /artifact ref index\.html SHA-256 mismatch/);
    assert.match(output, /source ref prd\.md SHA-256 mismatch/);
    assert.match(output, /source_quote was not found/);
    assert.match(output, /evidence qa-filter\.json SHA-256 mismatch/);
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

test('operational artifacts require the four generated H0 visual requirements', () => {
  const directory = fixture();
  try {
    const manifestPath = join(directory, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.style_preset = 'operational-dashboard';
    manifest.template_id = 'operational-product';
    writeJson(manifestPath, manifest);
    const recordPath = join(directory, 'requirement-verification.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.artifact_refs.find(
      (item) => item.ref === 'manifest.json'
    ).sha256 = sha256(readFileSync(manifestPath));
    record.requirements.push(...operationalH0Requirements.map((requirement) => ({
      id: requirement.id,
      type: requirement.type,
      priority: requirement.priority,
      source_ref: 'prd.md',
      source_quote: '用户可以在移动端完成筛选并看到已选条件。',
      acceptance_criteria: requirement.acceptance_criteria,
      surface_states: requirement.surface_states,
      verification_method: requirement.verification_method,
      implementation_refs: ['index.html'],
      evidence_refs: [{
        ...binding(join(directory, 'qa-filter.json')),
        ref: 'qa-filter.json',
        kind: 'browser-test'
      }],
      status: 'passed',
      reviewer: 'independent-reviewer'
    })));
    record.coverage = {
      p0_p1_total: 5,
      p0_p1_with_evidence: 5,
      p0_p1_passed: 5,
      status: 'complete'
    };
    writeJson(recordPath, record);
    assert.deepEqual(validateRequirementVerification(directory), []);

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
