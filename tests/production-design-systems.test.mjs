import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  readFileSync,
  statSync
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { v2Request } from './fixtures/execution-request.mjs';

const root = resolve('.');
const systemIds = [
  'expressive-web',
  'operational-product',
  'editorial-evidence'
];
const registry = JSON.parse(readFileSync(
  join(root, 'assets/templates/registry.json'),
  'utf8'
));

test('three production design systems validate as complete packages', () => {
  for (const systemId of systemIds) {
    const result = spawnSync(
      process.execPath,
      [
        join(root, 'scripts/validate-design-system-package.mjs'),
        '.',
        systemId
      ],
      { cwd: root, encoding: 'utf8' }
    );
    assert.equal(
      result.status,
      0,
      `${systemId}\n${result.stdout}\n${result.stderr}`
    );
    const manifest = JSON.parse(readFileSync(
      join(root, 'design-systems', systemId, 'manifest.json'),
      'utf8'
    ));
    assert.equal(manifest.id, systemId);
    assert.equal(
      manifest.preview.length,
      systemId === 'operational-product' ? 5 : 4
    );
    if (systemId === 'operational-product') {
      assert.ok(manifest.preview.some((item) => item.role === 'render-spec'));
    }
  }
});

test('operational system separates blue action from positive state', () => {
  const tokens = JSON.parse(readFileSync(
    join(root, 'design-systems/operational-product/design-tokens.json'),
    'utf8'
  ));
  assert.equal(tokens.colors.accent, '#245EA8');
  assert.equal(tokens.colors.positive, '#26705A');
  assert.notEqual(tokens.colors.accent, tokens.colors.positive);
  assert.deepEqual(
    [
      tokens.spacing.control_compact,
      tokens.spacing.control_regular,
      tokens.spacing.control_touch
    ],
    ['32px', '40px', '44px']
  );
  const html = readFileSync(
    join(root, 'assets/templates/operational-product.html'),
    'utf8'
  );
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, />异常队列</);
  assert.doesNotMatch(html, />Exception queue</);
});

test('operational system binds local Iconfont provenance and surface assertions', () => {
  const systemRoot = join(root, 'design-systems/operational-product');
  const manifest = JSON.parse(readFileSync(
    join(systemRoot, 'manifest.json'),
    'utf8'
  ));
  const asset = manifest.visual_assets[0];
  const sprite = readFileSync(join(systemRoot, asset.file));
  assert.equal(asset.source, 'iconfont-local-svg');
  assert.equal(asset.family, 'ant-design-official');
  assert.equal(asset.license, 'MIT');
  assert.equal(asset.icons.length, 7);
  assert.equal(
    asset.sha256,
    createHash('sha256').update(sprite).digest('hex')
  );
  const spec = JSON.parse(readFileSync(
    join(systemRoot, 'preview/render-spec.json'),
    'utf8'
  ));
  assert.deepEqual(spec.viewports, [1440, 390, 320]);
  assert.deepEqual(
    spec.states.map((state) => state.id),
    ['default', 'dense', 'error']
  );
  const kinds = new Set(spec.states.flatMap(
    (state) => state.assertions.map((assertion) => assertion.kind)
  ));
  for (const kind of ['relation', 'locale', 'icon']) {
    assert.ok(kinds.has(kind), kind);
  }
});

test('expressive system has a local synthetic protagonist and responsive keyframes', () => {
  const assetPath = join(
    root,
    'design-systems/expressive-web/assets/stage.jpg'
  );
  const bytes = readFileSync(assetPath);
  assert.ok(statSync(assetPath).size > 100000);
  assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xd8]);
  const preview = readFileSync(
    join(root, 'design-systems/expressive-web/components.html'),
    'utf8'
  );
  for (const marker of [
    'data-keyframe="first"',
    'data-keyframe="dense"',
    'data-keyframe="critical"',
    '@media (max-width: 720px)'
  ]) {
    const combined = `${preview}\n${readFileSync(
      join(root, 'design-systems/expressive-web/layouts.css'),
      'utf8'
    )}`;
    assert.match(combined, new RegExp(marker.replace(/[()]/g, '\\$&')));
  }
});

test('profile resolution selects materialized expressive and editorial systems', async () => {
  const {
    loadDesignProfileAssets,
    resolveDesignProfile,
    resolveSelectedTemplate
  } = await import('../scripts/lib/design-profile.mjs');
  const assets = loadDesignProfileAssets(root);
  for (const [readerJob, relationship, templateId] of [
    ['brand-communication', 'narrative', 'expressive-web-stage'],
    ['research-reading', 'narrative', 'editorial-evidence']
  ]) {
    const profile = resolveDesignProfile({
      schema_version: 'design-brief/v1',
      reader_job: readerJob,
      primary_relationship: relationship,
      secondary_relationships: [],
      content_density: 'roomy',
      experience_mode: readerJob === 'brand-communication'
        ? 'immersive'
        : 'editorial',
      desired_impression: ['content-specific'],
      anti_impression: ['template-like'],
      primary_subject: readerJob === 'brand-communication'
        ? 'real subject'
        : 'source evidence',
      memory_target: 'one defensible conclusion',
      reference_distance: 'method-only',
      brand_context: 'none'
    }, 'html-deck', assets);
    const resolution = resolveSelectedTemplate(profile, registry, templateId);
    assert.equal(resolution.selected_template_id, templateId);
    assert.ok(Object.keys(resolution.selected_topology_layouts).length > 0);
  }
});

test('operational product template compiles through the existing gate runner', async () => {
  const { compileExecutionPlan } = await import(
    '../scripts/compile-execution-plan.mjs'
  );
  const plan = compileExecutionPlan(v2Request({
    output_surface: {
      artifact_dir: 'artifact',
      artifact_type: 'dashboard',
      template_id: 'operational-product'
    }
  }), { registry });
  const gateIds = plan.automatic_gates.map((gate) => gate.gate_id);
  for (const gateId of [
    'validate-design-output',
    'validate-claim-map',
    'validate-visual-encoding',
    'render-smoke'
  ]) {
    assert.ok(gateIds.includes(gateId), gateId);
  }
});
