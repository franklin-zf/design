import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const packageRoot = process.cwd();
const { queryDesignSpec, loadDesignKnowledge } = await import('../scripts/lib/design-knowledge.mjs');

function rec(id, over = {}) {
  return {
    schema_version: 'design-spec-record/v1',
    id,
    record_type: 'design_spec_record',
    classification: {
      project_type: 'data-product',
      artifact_type: 'html-deck',
      experience_mode: 'static',
      risk_lane: 'standard',
      content_signals: { tags: over.tags || [] },
      ...(over.classification || {})
    },
    source: { kind: 'artifact', ref: `examples/${id}`, tokens_ref: over.tokensRef || `examples/${id}/tokens.css` },
    extracted: {
      colors: { accent: { value: '#0047ff', role: 'accent' } },
      typography: { body: 'Inter, sans-serif' },
      spacing: { gap: '20px' }
    },
    judgment: { status: 'candidate', ...(over.judgment || {}) },
    ...(over.extra || {})
  };
}

function kb(tmp, records, primitives = []) {
  const root = join(tmp, 'design-knowledge');
  mkdirSync(join(root, 'spec-records'), { recursive: true });
  mkdirSync(join(root, 'primitives'), { recursive: true });
  const specPaths = [];
  for (const r of records) {
    const rel = `design-knowledge/spec-records/${r.id}.json`;
    writeFileSync(join(tmp, rel), JSON.stringify(r, null, 2));
    specPaths.push(rel);
  }
  const primPaths = [];
  for (const p of primitives) {
    const rel = `design-knowledge/primitives/${p.id}.json`;
    writeFileSync(join(tmp, rel), JSON.stringify(p, null, 2));
    primPaths.push(rel);
  }
  writeFileSync(join(root, 'registry.json'), JSON.stringify({
    schema_version: 'design-knowledge-registry/v1',
    spec_records: specPaths,
    primitives: primPaths
  }, null, 2));
}

test('reviewer_confirmed spec outranks candidate on equal classification match', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kbq-rank-'));
  try {
    kb(tmp, [
      rec('candidate-deck', { judgment: { status: 'candidate' } }),
      rec('confirmed-deck', {
        judgment: {
          status: 'reviewer_confirmed',
          reviewer: 'qa-2026-09',
          review_ref: 'showcases/x/review.json',
          why_it_works: 'single accent',
          signature_move: { move: 'one accent' },
          tags: ['editorial']
        }
      })
    ]);
    const result = queryDesignSpec({ artifactType: 'html-deck', riskLane: 'standard' }, { skillRoot: tmp, knowledgeRoot: tmp });
    assert.equal(result.match_count, 2);
    assert.equal(result.matches[0].id, 'confirmed-deck');
    assert.equal(result.matches[0].status, 'reviewer_confirmed');
    assert.ok(result.matches[0].reasons.some((r) => r.includes('reviewer_confirmed')));
    assert.equal(result.matches[1].id, 'candidate-deck');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('signal overlap scores and non-matching classification is excluded', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kbq-signal-'));
  try {
    kb(tmp, [
      rec('deck-swiss', { tags: ['swiss', 'editorial'] }),
      rec('poster-x', { classification: { artifact_type: 'poster', risk_lane: 'express', content_signals: { tags: ['bold'] } }, tokensRef: 'examples/poster-x/tokens.css' })
    ]);
    const result = queryDesignSpec({ artifactType: 'html-deck', signals: ['swiss'] }, { skillRoot: tmp, knowledgeRoot: tmp });
    assert.equal(result.match_count, 1);
    assert.equal(result.matches[0].id, 'deck-swiss');
    assert.ok(result.matches[0].reasons.some((r) => r.includes('signal')));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('status filter returns only reviewer_confirmed', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kbq-filter-'));
  try {
    kb(tmp, [rec('cand'), rec('conf', { judgment: { status: 'reviewer_confirmed', why_it_works: 'x', signature_move: { move: 'y' }, reviewer: 'r', review_ref: 'z' } })]);
    const result = queryDesignSpec({ artifactType: 'html-deck', status: 'confirmed' }, { skillRoot: tmp, knowledgeRoot: tmp });
    assert.equal(result.match_count, 1);
    assert.equal(result.matches[0].id, 'conf');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('primitives attached when bound to same tokens source', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kbq-prim-'));
  try {
    kb(tmp, [rec('deck-with-prim')], [{
      schema_version: 'design-primitives/v1',
      record_type: 'design_primitives',
      id: 'deck-with-prim-primitives',
      source: { kind: 'artifact', ref: 'examples/deck-with-prim', tokens_ref: 'examples/deck-with-prim/tokens.css' },
      status: 'candidate',
      color_pairings: [{}, {}],
      spacing_scale: [{ role: 'gap', value: '20px', px: 20 }],
      structural_facts: { zero_radius: true }
    }]);
    const result = queryDesignSpec({ artifactType: 'html-deck' }, { skillRoot: tmp, knowledgeRoot: tmp });
    assert.equal(result.matches[0].primitives.length, 1);
    assert.equal(result.matches[0].primitives[0].pairings, 2);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('missing knowledge base reports unavailable rather than failing', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kbq-empty-'));
  try {
    const loaded = loadDesignKnowledge(tmp);
    assert.equal(loaded.available, false);
    const result = queryDesignSpec({ artifactType: 'html-deck' }, { skillRoot: tmp, knowledgeRoot: tmp });
    assert.equal(result.available, false);
    assert.equal(result.match_count, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('default query returns standards but no historical design recommendation', () => {
  const result = queryDesignSpec({ artifactType: 'html-deck', riskLane: 'standard', signals: ['editorial'] }, { skillRoot: packageRoot });
  assert.ok(result.available);
  assert.equal(result.match_count, 0);
  assert.equal(result.case_match_count, 0);
  assert.equal(result.history_enabled, false);
  assert.equal(result.standards_ref, 'design-knowledge/DESIGN_STANDARDS.md');
  assert.equal(result.standards_available, true);
  assert.equal(result.evaluation_policy_ref, 'design-knowledge/evaluation-policy.json');
  assert.equal(result.evaluation_policy_available, true);
});

test('explicit knowledge root lets an installed skill read shared memory from another cwd', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kbq-opt-in-'));
  try {
    kb(tmp, [rec('approved-reference')]);
    const result = queryDesignSpec(
      { artifactType: 'html-deck', riskLane: 'standard' },
      { skillRoot: '/tmp/consumer-project', knowledgeRoot: tmp }
    );
    assert.equal(result.available, true);
    assert.equal(result.history_enabled, true);
    assert.equal(result.matches[0].id, 'approved-reference');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('populated local and environment roots cannot silently enable history', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kbq-no-history-'));
  const previous = process.env.DESIGN_KNOWLEDGE_ROOT;
  try {
    kb(tmp, [rec('unrequested-history')]);
    process.env.DESIGN_KNOWLEDGE_ROOT = tmp;
    const result = queryDesignSpec({ artifactType: 'html-deck' }, { skillRoot: tmp });
    assert.equal(result.match_count, 0);
    assert.equal(result.history_enabled, false);
  } finally {
    if (previous === undefined) delete process.env.DESIGN_KNOWLEDGE_ROOT;
    else process.env.DESIGN_KNOWLEDGE_ROOT = previous;
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('generation package retains standards and code assets, not rejected projects', () => {
  for (const suffix of ['html-pass', 'ppt-pass', 'poster-pass', 'evaluation']) {
    assert.equal(existsSync(join(packageRoot, `examples/product-management-platform-${suffix}`)), false);
  }
  for (const path of [
    'references/design-standards.md',
    'references/frontend-styles.md',
    'assets/vendor/open-design-html-ppt/base.css',
    'assets/vendor/open-design-html-ppt/LICENSE'
  ]) assert.ok(existsSync(join(packageRoot, path)), path);
  const templates = readFileSync(join(packageRoot, 'assets/templates/registry.json'), 'utf8');
  assert.doesNotMatch(templates, /product-management-platform|tests\/fixtures\/history/);
});
