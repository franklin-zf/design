import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const writeJson = (dir, name, value) => writeFileSync(join(dir, name), `${JSON.stringify(value, null, 2)}\n`);
const readJson = (dir, name) => JSON.parse(readFileSync(join(dir, name), 'utf8'));
const planDigest = 'a'.repeat(64);
const checkedAt = '2026-07-19T00:00:00Z';
const numericEvidence = 'metric=营收 entity=华东区 period=2026年第二季度 value=+124000 unit=万元 currency=CNY denominator=全部门店 grain=季度';
const accessibilityIds = ['document-title', 'html-lang', 'main-landmark', 'heading-order', 'keyboard-focus', 'color-contrast', 'reduced-motion'];
const privacyIds = ['remote-requests', 'sensitive-data-exposure', 'redaction-review', 'retention-policy', 'deletion-policy'];
const reviewerIds = ['source-identity', 'claim-semantics', 'numeric-semantics', 'accessibility', 'privacy', 'render', 'visual-review'];

async function validFixture({ schematic = false, delivery = 'ready' } = {}) {
  const { computeArtifactDigest } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'design-evidence-v2-'));
  mkdirSync(join(dir, 'evidence'));
  mkdirSync(join(dir, 'qa'));
  mkdirSync(join(dir, '.design'));
  writeFileSync(join(dir, 'source.csv'), `${numericEvidence}\n`);
  writeFileSync(join(dir, 'evidence', 'a11y.txt'), 'document and interaction checks across declared viewports and state default');
  writeFileSync(join(dir, 'evidence', 'privacy.txt'), 'request inventory, data classification, redaction, retention, and deletion reviewed');
  writeFileSync(join(dir, 'index.html'), schematic
    ? '<!doctype html><html lang="zh-CN"><head><title>示意</title></head><body><main><h1>示意</h1><p class="disclosure" data-schematic-disclosure>Illustrative schematic only</p></main></body></html>'
    : `<!doctype html><html lang="zh-CN"><head><title>报告</title></head><body><main><h1>报告</h1><p data-claim-id="revenue">${numericEvidence}</p></main></body></html>`);
  writeFileSync(join(dir, 'quality-report.md'), 'artifact_status: ready\naccessibility: externally_checked\nprivacy: externally_checked\n');
  writeJson(dir, 'manifest.json', {
    schema_version: 'design-artifact/v1', schematic,
    source_materials: schematic ? [] : ['source.csv']
  });
  writeJson(dir, 'source-inventory.json', {
    schema_version: 'design-source-inventory/v2',
    sources: schematic ? [] : [{ id: 'source-1', path: 'source.csv', sha256: sha(`${numericEvidence}\n`) }]
  });
  writeJson(dir, 'claim-map.json', {
    schema_version: 'design-claim-map/v2',
    claims: schematic ? [] : [{
      id: 'revenue', claim_class: 'source_fact', source_ids: ['source-1'],
      numeric_facts: [{
        value: '124000', unit: '万元', metric: '营收', entity: '华东区', period: '2026年第二季度',
        denominator: '全部门店', grain: '季度', sign: '+', currency: 'CNY', occurrence_count: 1,
        source_id: 'source-1', evidence_text: numericEvidence
      }]
    }]
  });
  const coreDigest = computeArtifactDigest(dir);
  const renderPayload = {
    schema_version: 'design-render-spec/v2',
    viewports: [1440, 390, 320],
    segments: [{ id: 'main', kind: 'selector', selector: 'main' }],
    states: [{ id: 'default', setup: [], assertions: [{ kind: 'visible', selector: 'main' }] }],
    remote_policy: { mode: 'deny_all', allowed_origins: [] }
  };
  const renderSpec = {
    ...renderPayload,
    resolved_plan_digest: planDigest,
    artifact_digest: coreDigest,
    spec_digest: sha(stable(renderPayload))
  };
  writeJson(join(dir, '.design'), 'render-spec.json', renderSpec);
  const screenshots = new Map();
  for (const width of renderSpec.viewports) {
    const ref = `qa/render-${width}-default-main.png`;
    const bytes = `measured screenshot ${width}/default/main`;
    writeFileSync(join(dir, ref), bytes);
    screenshots.set(width, { ref, digest: sha(bytes) });
  }
  writeJson(dir, 'accessibility-checks.json', {
    schema_version: 'design-accessibility-checks/v2', artifact_digest: coreDigest, resolved_plan_digest: planDigest,
    method: 'playwright-structural', scope: { viewports: [1440, 390, 320], state_ids: ['default'] }, checked_at: checkedAt,
    checks: accessibilityIds.map((id) => ({ id, status: 'passed', method: 'browser measurement', scope: 'all declared viewports/default', evidence_ref: 'evidence/a11y.txt', evidence_sha256: sha('document and interaction checks across declared viewports and state default') }))
  });
  writeJson(dir, 'privacy-checks.json', {
    schema_version: 'design-privacy-checks/v2', artifact_digest: coreDigest, resolved_plan_digest: planDigest,
    method: 'request-inventory', classification_scope: 'internal', authorized_remote_origins: [],
    retention_policy: 'retain locally until delivery acceptance', deletion_policy: 'delete working copy on request', checked_at: checkedAt, findings: [],
    checks: privacyIds.map((id) => ({ id, status: 'passed', method: 'request and content review', scope: 'artifact and all render requests', evidence_ref: 'evidence/privacy.txt', evidence_sha256: sha('request inventory, data classification, redaction, retention, and deletion reviewed') }))
  });
  writeJson(dir, 'render-profile.json', {
    schema_version: 'design-render-profile/v2', artifact_digest: coreDigest, resolved_plan_digest: planDigest,
    render_spec_digest: renderSpec.spec_digest,
    profiles: renderSpec.viewports.map((width) => ({
      width, height: 900, strict_success: true, reduced_motion: 'passed', remote_requests: [],
      states: [{
        id: 'default', assertions: [{ kind: 'visible', selector: 'main', passed: true }],
        schematic_disclosure: schematic ? [{ visible: true, geometry: { x: 10, y: 20, width: 220, height: 24 } }] : [],
        segments: [{ id: 'main', screenshot_ref: screenshots.get(width).ref, screenshot_sha256: screenshots.get(width).digest }]
      }]
    }))
  });
  writeJson(dir, 'evidence-contract.json', {
    schema_version: 'design-evidence-contract/v2', resolved_plan_digest: planDigest,
    delivery_status: schematic ? 'schematic_only' : delivery,
    source_inventory_ref: 'source-inventory.json', claim_map_ref: 'claim-map.json',
    accessibility_check_ref: 'accessibility-checks.json', privacy_check_ref: 'privacy-checks.json',
    render_spec_ref: '.design/render-spec.json', render_profile_ref: 'render-profile.json',
    ...(delivery === 'ready' && !schematic ? { reviewer_record_ref: 'reviewer-record.json' } : {})
  });
  if (delivery === 'ready' && !schematic) {
    writeJson(dir, 'reviewer-record.json', {
      schema_version: 'design-reviewer-record/v2', reviewer_id: 'reviewer-1', reviewer_role: 'independent-reviewer',
      reviewed_at: checkedAt, review_scope: ['source identity', 'claims', 'rendered artifact'], review_status: 'approved',
      artifact_digest: coreDigest, resolved_plan_digest: planDigest,
      checks: reviewerIds.map((id) => ({ id, status: 'passed', evidence_refs: ['evidence-contract.json'] })),
      findings: [], remaining_risks: [], non_claims: ['Approval covers only the bound artifact and plan digests.']
    });
  }
  return dir;
}

test('source-backed ready evidence validates strict claims, sidecars, exact render execution, and reviewer binding', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture();
  try { assert.deepEqual(validateEvidenceContract(dir), []); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('source hash and bidirectional data-claim-id coverage fail closed', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture({ delivery: 'blocked' });
  try {
    writeFileSync(join(dir, 'source.csv'), 'drift');
    writeFileSync(join(dir, 'index.html'), '<p data-claim-id="unmapped">+124000 CNY</p>');
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /SHA-256 mismatch/i);
    assert.match(errors, /claim revenue has no visible/i);
    assert.match(errors, /unmapped.*no claim-map/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('duplicate mapped and visible claim ids are rejected', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture({ delivery: 'blocked' });
  try {
    const map = readJson(dir, 'claim-map.json');
    map.claims.push(structuredClone(map.claims[0]));
    writeJson(dir, 'claim-map.json', map);
    writeFileSync(join(dir, 'index.html'), `<main><p data-claim-id="revenue">${numericEvidence}</p><p data-claim-id="revenue">${numericEvidence}</p></main>`);
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /claim id revenue must be mapped exactly once/i);
    assert.match(errors, /data-claim-id revenue must be visible exactly once/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Chinese numeric claims bind sign, currency, unit, context, and exact occurrence count', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture({ delivery: 'blocked' });
  try {
    const map = readJson(dir, 'claim-map.json');
    Object.assign(map.claims[0].numeric_facts[0], { currency: 'USD', sign: '-', occurrence_count: 2 });
    writeJson(dir, 'claim-map.json', map);
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /visible numeric context mismatch: currency=USD/i);
    assert.match(errors, /source numeric context mismatch: currency=USD/i);
    assert.match(errors, /visible occurrence_count mismatch for -124000/i);
    assert.match(errors, /source occurrence_count mismatch for -124000/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('quality-report cannot self-award checks and shallow sidecars or reviewer records fail', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture();
  try {
    writeJson(dir, 'accessibility-checks.json', { schema_version: 'design-accessibility-checks/v2', artifact_digest: '0'.repeat(64), resolved_plan_digest: planDigest, checks: [] });
    writeJson(dir, 'privacy-checks.json', { schema_version: 'design-privacy-checks/v2', artifact_digest: '0'.repeat(64), resolved_plan_digest: '1'.repeat(64), checks: [] });
    writeJson(dir, 'reviewer-record.json', { schema_version: 'design-reviewer-record/v2', reviewer_id: 'reviewer-1', review_status: 'approved', artifact_digest: '0'.repeat(64), resolved_plan_digest: '1'.repeat(64) });
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /accessibility sidecar.*required property method/i);
    assert.match(errors, /accessibility sidecar requires exactly one keyboard-focus check/i);
    assert.match(errors, /privacy sidecar.*required property classification_scope/i);
    assert.match(errors, /reviewer record.*required property reviewer_role/i);
    assert.match(errors, /reviewer record requires exactly one visual-review check/i);
    assert.match(errors, /artifact_digest mismatch/i);
    assert.match(errors, /resolved_plan_digest mismatch/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('mandatory accessibility and privacy checks cannot all self-waive as not_applicable', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture();
  try {
    for (const name of ['accessibility-checks.json', 'privacy-checks.json']) {
      const sidecar = readJson(dir, name);
      for (const check of sidecar.checks) check.status = 'not_applicable';
      writeJson(dir, name, sidecar);
    }
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /accessibility sidecar.*status.*allowed values|accessibility mandatory check document-title must be passed/i);
    assert.match(errors, /privacy sidecar.*status.*allowed values|privacy mandatory check remote-requests must be passed/i);
    assert.match(errors, /ready requires passed accessibility and privacy evidence/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an unresolved privacy finding blocks ready delivery', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture();
  try {
    const privacy = readJson(dir, 'privacy-checks.json');
    privacy.findings.push({
      id: 'PRIV-1', severity: 'major', status: 'open', summary: 'Sensitive identifier remains visible.',
      evidence_refs: ['evidence/privacy.txt']
    });
    writeJson(dir, 'privacy-checks.json', privacy);
    assert.match(validateEvidenceContract(dir).join('\n'), /ready delivery cannot contain unresolved privacy findings/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('approved reviewer record cannot contain a failed mandatory check', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture();
  try {
    const reviewer = readJson(dir, 'reviewer-record.json');
    reviewer.checks.find((check) => check.id === 'numeric-semantics').status = 'failed';
    writeJson(dir, 'reviewer-record.json', reviewer);
    assert.match(validateEvidenceContract(dir).join('\n'), /approved ready reviewer check numeric-semantics must be passed/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('approved reviewer record cannot contain a not_checked mandatory check or unresolved major finding', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture();
  try {
    const reviewer = readJson(dir, 'reviewer-record.json');
    reviewer.checks.find((check) => check.id === 'visual-review').status = 'not_checked';
    reviewer.findings.push({
      id: 'REV-1', severity: 'blocking', status: 'open', summary: 'Visual review remains incomplete.',
      evidence_refs: ['render-profile.json']
    });
    writeJson(dir, 'reviewer-record.json', reviewer);
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /approved ready reviewer check visual-review must be passed/i);
    assert.match(errors, /cannot contain unresolved major or blocking findings/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('CSS-hidden schematic disclosure fails on computed render evidence', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture({ schematic: true, delivery: 'schematic_only' });
  try {
    assert.deepEqual(validateEvidenceContract(dir), []);
    writeFileSync(join(dir, 'index.html'), '<style>.disclosure{display:none}</style><main><p class="disclosure" data-schematic-disclosure>Illustrative</p></main>');
    const profile = readJson(dir, 'render-profile.json');
    for (const viewport of profile.profiles) viewport.states[0].schematic_disclosure = [{ visible: false, geometry: { x: 0, y: 0, width: 0, height: 0 } }];
    writeJson(dir, 'render-profile.json', profile);
    assert.match(validateEvidenceContract(dir).join('\n'), /no computed visible schematic disclosure/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('undeclared render state, missing segment, screenshot drift, and remote requests fail exact evidence validation', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture({ delivery: 'blocked' });
  try {
    const profile = readJson(dir, 'render-profile.json');
    profile.profiles[0].states[0].id = 'fabricated-state';
    profile.profiles[1].states[0].segments = [];
    profile.profiles[2].states[0].segments[0].screenshot_sha256 = '0'.repeat(64);
    profile.profiles[2].remote_requests = [{ url: 'https://tracker.example/pixel', origin: 'https://tracker.example', authorized: false }];
    writeJson(dir, 'render-profile.json', profile);
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /1440 state ids do not match render spec/i);
    assert.match(errors, /390\/default segment ids do not match render spec/i);
    assert.match(errors, /320\/default\/main screenshot is missing or hash-mismatched/i);
    assert.match(errors, /unauthorized remote request/i);
    assert.match(errors, /privacy sidecar does not authorize remote origin/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('missing required sidecars and render profile fail even for schematic delivery', async () => {
  const { validateEvidenceContract } = await import('../scripts/validate-evidence-contract.mjs');
  const dir = await validFixture({ schematic: true, delivery: 'schematic_only' });
  try {
    unlinkSync(join(dir, 'privacy-checks.json'));
    unlinkSync(join(dir, 'render-profile.json'));
    const errors = validateEvidenceContract(dir).join('\n');
    assert.match(errors, /privacy.*sidecar/i);
    assert.match(errors, /render profile/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
