import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateVisualReview } from '../scripts/validate-visual-review.mjs';

const root = resolve('.');
const dimensionIds = [
  'composition',
  'typography',
  'color-material',
  'media-art-direction',
  'motion-interaction',
  'responsive-adaptation',
  'finish-micro-detail'
];
const operationalCheckIds = [
  'alignment',
  'locale',
  'iconography',
  'palette'
];

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'design-visual-review-'));
  writeFileSync(join(directory, 'surface.png'), 'reviewed surface bytes');
  const record = {
    schema_version: 'design-reviewer-record/v4',
    reviewer_id: 'reviewer-1',
    artifact_author_id: 'author-1',
    reviewer_role: 'independent-reviewer',
    reviewed_at: '2026-10-09T00:00:00Z',
    review_scope: ['target surface', 'visual craft', 'content ownership'],
    review_status: 'approved',
    artifact_digest: 'a'.repeat(64),
    content_digest: 'b'.repeat(64),
    surface_digest: 'c'.repeat(64),
    resolved_plan_digest: 'd'.repeat(64),
    checks: [
      'source-identity',
      'claim-semantics',
      'numeric-semantics',
      'accessibility',
      'privacy',
      'render',
      'visual-review'
    ].map((id) => ({
      id,
      status: 'passed',
      evidence_refs: ['surface.png']
    })),
    craft_review: {
      rubric_version: 'design-craft-rubric/v1',
      experience_mode: 'editorial',
      dimensions: dimensionIds.map((id) => ({
        id,
        status: id === 'motion-interaction' ? 'not_applicable' : 'scored',
        ...(id === 'motion-interaction' ? {} : { score: 3 }),
        evidence_refs: ['surface.png'],
        rationale: id === 'motion-interaction'
          ? 'The delivered report is intentionally static.'
          : `The ${id} treatment is complete on the reviewed target surface.`
      })),
      ownership: {
        content_specificity: 3,
        world_coherence: 3,
        memorable_element: 3,
        rationale: 'The composition follows the evidence structure and uses one content-owned visual action.',
        evidence_refs: ['surface.png']
      },
      summary: {
        applicable_count: 6,
        minimum_score: 3,
        gate_status: 'passed'
      }
    },
    findings: [],
    remaining_risks: [],
    non_claims: ['The review does not establish real-user preference.']
  };
  writeFileSync(
    join(directory, 'reviewer-record.json'),
    `${JSON.stringify(record, null, 2)}\n`
  );
  return { directory, record };
}

function operationalFixture({ includeChecks = true } = {}) {
  const result = fixture();
  result.record.craft_review.experience_mode = 'operational';
  if (includeChecks) {
    result.record.checks.push(...operationalCheckIds.map((id) => ({
      id,
      status: 'passed',
      evidence_refs: ['surface.png']
    })));
  }
  return result;
}

test('visual review requires evidence-backed scores and content ownership', () => {
  const { directory, record } = fixture();
  try {
    assert.deepEqual(validateVisualReview(record, directory), []);
    const cli = spawnSync(
      process.execPath,
      [join(root, 'scripts/validate-visual-review.mjs'), directory],
      { cwd: root, encoding: 'utf8' }
    );
    assert.equal(cli.status, 0, `${cli.stdout}\n${cli.stderr}`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('visual review fails closed on low craft or ownership scores', () => {
  const { directory, record } = fixture();
  try {
    record.craft_review.dimensions[0].score = 2;
    record.craft_review.ownership.content_specificity = 2;
    record.craft_review.summary.minimum_score = 2;
    record.craft_review.summary.gate_status = 'failed';
    const output = validateVisualReview(record, directory).join('\n');
    assert.match(output, /composition must score at least 3/);
    assert.match(output, /content_specificity must score at least 3/);
    assert.match(output, /approved reviewer record requires a passed craft gate/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('only motion may be not applicable and evidence files must exist', () => {
  const { directory, record } = fixture();
  try {
    const typography = record.craft_review.dimensions.find(
      (dimension) => dimension.id === 'typography'
    );
    typography.status = 'not_applicable';
    delete typography.score;
    typography.evidence_refs = ['missing.png'];
    record.craft_review.summary.applicable_count = 5;
    const output = validateVisualReview(record, directory).join('\n');
    assert.match(output, /typography cannot be not_applicable/);
    assert.match(output, /evidence is missing/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('v3 reviewer records remain schema-readable but cannot authorize visual release', () => {
  const { directory, record } = fixture();
  try {
    record.schema_version = 'design-reviewer-record/v3';
    delete record.craft_review;
    assert.match(
      validateVisualReview(record, directory).join('\n'),
      /requires design-reviewer-record\/v4/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('operational visual review requires four passed evidence-backed checks', () => {
  const { directory, record } = operationalFixture();
  try {
    assert.deepEqual(validateVisualReview(record, directory), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('PE Partner-like operational review cannot pass on craft scores alone', () => {
  const { directory, record } = operationalFixture({
    includeChecks: false
  });
  try {
    const output = validateVisualReview(record, directory).join('\n');
    for (const id of operationalCheckIds) {
      assert.match(
        output,
        new RegExp(`requires exactly one ${id} check`)
      );
    }
    assert.equal(record.craft_review.summary.gate_status, 'passed');
    assert.equal(record.review_status, 'approved');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('operational checks fail closed on failed status or missing evidence', () => {
  const { directory, record } = operationalFixture();
  try {
    const alignment = record.checks.find((check) => check.id === 'alignment');
    alignment.status = 'failed';
    const locale = record.checks.find((check) => check.id === 'locale');
    locale.evidence_refs = ['missing.png'];
    const output = validateVisualReview(record, directory).join('\n');
    assert.match(output, /operational reviewer check alignment must be passed/);
    assert.match(
      output,
      /approved reviewer record requires reviewer check alignment to be passed/
    );
    assert.match(output, /reviewer check locale evidence is missing/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
