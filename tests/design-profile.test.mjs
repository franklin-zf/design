import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import {
  loadDesignProfileAssets,
  resolveDesignProfile,
  resolveTemplateCandidates
} from '../scripts/lib/design-profile.mjs';
import {
  compileExecutionPlan,
  sha256Value
} from '../scripts/compile-execution-plan.mjs';
import { v2Request } from './fixtures/execution-request.mjs';

const root = resolve('.');
const assets = loadDesignProfileAssets(root);
const templateRegistry = JSON.parse(
  readFileSync(join(root, 'assets/templates/registry.json'), 'utf8')
);
const readerJobToPreset = assets.catalogue.routing.reader_job_to_preset;
const artifactTypes = ['ppt-handoff', 'html-deck', 'poster'];

function posterRequest() {
  return v2Request({
    output_surface: {
      artifact_dir: 'artifact',
      artifact_type: 'poster',
      template_id: 'poster-type-led'
    }
  });
}

function brief(overrides = {}) {
  return {
    schema_version: 'design-brief/v1',
    reader_job: 'executive-decision',
    primary_relationship: 'decision',
    secondary_relationships: [],
    content_density: 'auto',
    brand_context: 'none',
    ...overrides
  };
}

test('catalogue contains the six product presets and all surface contracts', () => {
  assert.deepEqual(
    assets.catalogue.product_presets.map((item) => item.id).sort(),
    [
      'consumer-brand',
      'data-analytics',
      'editorial-research',
      'enterprise-saas',
      'executive-strategy',
      'technical-architecture'
    ]
  );
  assert.deepEqual(
    assets.catalogue.surface_contracts.map((item) => item.id).sort(),
    ['html', 'poster', 'ppt']
  );
  assert.equal(assets.catalogue.topology_patterns.length, 7);
});

test('six reader jobs resolve deterministically and route all 18 public surfaces', () => {
  const routeCounts = {
    needs_direction_selection: 0,
    resolved: 0,
    unsupported: 0
  };
  for (const [readerJob, expectedPreset] of Object.entries(readerJobToPreset)) {
    for (const artifactType of artifactTypes) {
      const input = brief({ reader_job: readerJob });
      const first = resolveDesignProfile(input, artifactType, assets);
      const second = resolveDesignProfile(input, artifactType, assets);
      assert.deepEqual(first, second);
      assert.equal(first.primary_preset, expectedPreset);
      assert.equal(first.surface.artifact_type, artifactType);
      assert.ok(assets.themes.presets[first.style_preset]);
      assert.equal(first.catalogue_digest, assets.catalogueDigest);
      assert.equal(first.theme_digest, assets.themeDigest);
      const resolution = resolveTemplateCandidates(first, templateRegistry);
      routeCounts[resolution.status] += 1;
      if (resolution.status === 'unsupported') {
        const fallbackTemplate = templateRegistry.templates.find(
          (template) => template.artifact_types.includes(artifactType)
        );
        assert.throws(
          () => compileExecutionPlan(v2Request({
            output_surface: {
              artifact_dir: 'artifact',
              artifact_type: artifactType,
              template_id: fallbackTemplate.id
            }
          }), { designProfile: first, registry: templateRegistry }),
          /no compatible template/
        );
      } else {
        const selected = resolution.candidates[0];
        const plan = compileExecutionPlan(v2Request({
          output_surface: {
            artifact_dir: 'artifact',
            artifact_type: artifactType,
            template_id: selected.template_id
          }
        }), { designProfile: first, registry: templateRegistry });
        assert.equal(plan.template_resolution.status, 'selected');
        assert.deepEqual(
          plan.template_resolution.selected_topology_layouts,
          selected.topology_layouts
        );
      }
    }
  }
  assert.equal(Object.values(routeCounts).reduce((sum, count) => sum + count, 0), 18);
  assert.ok(routeCounts.unsupported > 0);
  assert.ok(routeCounts.resolved + routeCounts.needs_direction_selection > 0);
});

test('supporting preset cannot override main theme, typography, or composition', () => {
  const input = brief({
    reader_job: 'operational-workflow',
    primary_relationship: 'system',
    secondary_relationships: ['metrics']
  });
  const profile = resolveDesignProfile(input, 'html-deck', assets);
  const primary = assets.catalogue.product_presets.find(
    (item) => item.id === 'enterprise-saas'
  );

  assert.equal(profile.primary_preset, 'enterprise-saas');
  assert.deepEqual(profile.secondary_preset, {
    id: 'technical-architecture',
    contributes: ['topology', 'surface_emphasis']
  });
  assert.equal(profile.style_preset, primary.style_preset_by_surface.html);
  assert.deepEqual(profile.resolved_rules.typography_direction, primary.typography_direction);
  assert.equal(profile.resolved_rules.composition.grid, primary.composition.grid);
  assert.deepEqual(profile.topologies, ['system-map', 'metric-evidence']);
});

test('all automatic supporting presets keep primary visual ownership', () => {
  const relationships = Object.keys(
    assets.catalogue.routing.relationship_to_secondary_preset
  );
  for (const readerJob of Object.keys(readerJobToPreset)) {
    for (const relationship of relationships) {
      for (const artifactType of artifactTypes) {
        const profile = resolveDesignProfile(brief({
          primary_relationship: relationship,
          reader_job: readerJob
        }), artifactType, assets);
        const primary = assets.catalogue.product_presets.find(
          (item) => item.id === profile.primary_preset
        );
        assert.equal(
          profile.style_preset,
          primary.style_preset_by_surface[profile.surface.id]
        );
        assert.deepEqual(
          profile.resolved_rules.typography_direction,
          primary.typography_direction
        );
        assert.equal(
          profile.resolved_rules.composition.grid,
          primary.composition.grid
        );
        if (profile.secondary_preset) {
          assert.deepEqual(
            profile.secondary_preset.contributes,
            ['topology', 'surface_emphasis']
          );
        }
      }
    }
  }
});

test('all explicit primary and supporting preset pairs keep primary ownership', () => {
  const presetIds = assets.catalogue.product_presets.map((preset) => preset.id);
  for (const primaryPreset of presetIds) {
    for (const secondaryPreset of presetIds.filter((id) => id !== primaryPreset)) {
      for (const artifactType of artifactTypes) {
        const profile = resolveDesignProfile(brief({
          primary_preset_override: primaryPreset,
          secondary_preset_override: secondaryPreset,
          override_reason: 'Exercise the controlled preset inheritance contract.'
        }), artifactType, assets);
        const primary = assets.catalogue.product_presets.find(
          (preset) => preset.id === primaryPreset
        );
        assert.equal(profile.primary_preset, primaryPreset);
        assert.equal(profile.secondary_preset.id, secondaryPreset);
        assert.deepEqual(
          profile.secondary_preset.contributes,
          ['topology', 'surface_emphasis']
        );
        assert.equal(
          profile.style_preset,
          primary.style_preset_by_surface[profile.surface.id]
        );
        assert.deepEqual(
          profile.resolved_rules.typography_direction,
          primary.typography_direction
        );
        assert.deepEqual(
          profile.resolved_rules.composition,
          primary.composition
        );
      }
    }
  }
});

test('explicit overrides require a reason and cannot select the primary twice', () => {
  assert.throws(
    () => resolveDesignProfile(brief({
      primary_preset_override: 'consumer-brand'
    }), 'poster', assets),
    /override_reason/
  );
  assert.throws(
    () => resolveDesignProfile(brief({
      primary_preset_override: 'consumer-brand',
      secondary_preset_override: 'consumer-brand',
      override_reason: 'Use the supplied brand campaign direction.'
    }), 'poster', assets),
    /secondary_preset_override must differ/
  );
});

test('brand context remains unmerged and ppt remains a handoff', () => {
  const profile = resolveDesignProfile(brief({
    brand_context: 'provided',
    brand_ref: 'brand/verified-guidelines.json'
  }), 'ppt-handoff', assets);

  assert.equal(profile.selection.brand_status, 'requires_verified_brand_merge');
  assert.equal(profile.surface.delivery_mode, 'handoff_only');
  assert.match(profile.surface.rules.interaction_policy, /static slide state/);
});

test('design CLI writes a validated profile', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-profile-test-'));
  try {
    const briefPath = join(tempRoot, 'brief.json');
    const profilePath = join(tempRoot, 'profile.json');
    writeFileSync(briefPath, `${JSON.stringify(brief(), null, 2)}\n`);
    const result = spawnSync(process.execPath, [
      join(root, 'scripts/design.mjs'),
      'profile',
      briefPath,
      '--artifact-type=poster',
      `--out=${profilePath}`
    ], { cwd: root, encoding: 'utf8' });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    assert.equal(profile.schema_version, 'design-profile/v1');
    assert.equal(profile.surface.id, 'poster');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('execution plans bind a current reproducible design profile', async () => {
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const planSchema = JSON.parse(
    readFileSync(join(root, 'schemas/execution-plan.schema.json'), 'utf8')
  );
  const designProfile = resolveDesignProfile(brief(), 'poster', assets);
  const plan = compileExecutionPlan(posterRequest(), {
    designProfile,
    registry: templateRegistry
  });

  assert.deepEqual(plan.design_profile, designProfile);
  assert.equal(plan.template_resolution.selected_template_id, 'poster-type-led');
  assert.deepEqual(
    plan.template_resolution.selected_topology_layouts,
    { 'decision-frame': ['poster-type-led'] }
  );
  assert.deepEqual(validateJsonInstance(planSchema, plan), []);

  const tampered = structuredClone(designProfile);
  tampered.resolved_rules.composition.grid = 'Unregistered arbitrary grid';
  assert.throws(
    () => compileExecutionPlan(posterRequest(), {
      designProfile: tampered,
      registry: templateRegistry
    }),
    /does not match the deterministic resolution/
  );

  for (const field of ['catalogue_digest', 'theme_digest']) {
    const digestTamper = structuredClone(designProfile);
    digestTamper[field] = '0'.repeat(64);
    assert.throws(
      () => compileExecutionPlan(posterRequest(), {
        designProfile: digestTamper,
        registry: templateRegistry
      }),
      new RegExp(`${field} does not match`)
    );
  }
});

test('core plans cannot bypass a design profile in compiler or schema', async () => {
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const planSchema = JSON.parse(
    readFileSync(join(root, 'schemas/execution-plan.schema.json'), 'utf8')
  );
  assert.throws(
    () => compileExecutionPlan(posterRequest(), { registry: templateRegistry }),
    /requires --design-profile/
  );

  const profile = resolveDesignProfile(brief(), 'poster', assets);
  const plan = compileExecutionPlan(posterRequest(), {
    designProfile: profile,
    registry: templateRegistry
  });
  delete plan.design_profile;
  delete plan.template_resolution;
  assert.match(
    validateJsonInstance(planSchema, plan).join('\n'),
    /required property design_profile|required property template_resolution/
  );

  const missingCheckPlan = spawnSync(process.execPath, [
    join(root, 'scripts/design.mjs'),
    'check',
    'examples/poster-pass'
  ], { cwd: root, encoding: 'utf8' });
  assert.notEqual(missingCheckPlan.status, 0);
  assert.match(
    `${missingCheckPlan.stdout}\n${missingCheckPlan.stderr}`,
    /poster check requires --execution-plan/
  );
});

test('template topology cannot reference an unregistered layout', () => {
  const profile = resolveDesignProfile(brief({
    reader_job: 'system-explanation',
    primary_relationship: 'system'
  }), 'ppt-handoff', assets);
  const invalidRegistry = structuredClone(templateRegistry);
  const template = invalidRegistry.templates.find(
    (item) => item.id === 'swiss-evidence-deck'
  );
  template.topology_support['system-map'] = ['S99'];
  assert.throws(
    () => resolveTemplateCandidates(profile, invalidRegistry),
    /unknown layout S99/
  );
});

test('runner rejects a topology-layout mutation even after digest refresh', async () => {
  const { runExecutionPlan } = await import('../scripts/run-execution-plan.mjs');
  const profile = resolveDesignProfile(brief(), 'poster', assets);
  const plan = compileExecutionPlan(posterRequest(), {
    designProfile: profile,
    registry: templateRegistry
  });
  plan.template_resolution.selected_topology_layouts['decision-frame'] = [
    'poster-editorial'
  ];
  const payload = Object.fromEntries(Object.entries(plan).filter(
    ([key]) => key !== 'plan_id' && key !== 'resolved_gate_plan_digest'
  ));
  const digest = sha256Value(payload);
  plan.plan_id = digest;
  plan.resolved_gate_plan_digest = digest;
  await assert.rejects(
    () => runExecutionPlan(plan),
    /template_resolution does not match/
  );
});

test('artifact validators reject registered layouts outside selected topology', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-topology-artifact-'));
  const artifactRoot = join(tempRoot, 'artifact');
  mkdirSync(artifactRoot);
  try {
    const deckProfile = resolveDesignProfile(brief({
      reader_job: 'system-explanation',
      primary_relationship: 'system'
    }), 'ppt-handoff', assets);
    const deckPlan = compileExecutionPlan(v2Request({
      output_surface: {
        artifact_dir: 'artifact',
        artifact_type: 'ppt-handoff',
        template_id: 'swiss-evidence-deck'
      },
      constraints: {
        ...v2Request().constraints,
        workspace_root: tempRoot
      }
    }), { designProfile: deckProfile, registry: templateRegistry });
    const deckPlanPath = join(tempRoot, 'deck-plan.json');
    writeFileSync(deckPlanPath, `${JSON.stringify(deckPlan, null, 2)}\n`);
    writeFileSync(join(artifactRoot, 'manifest.json'), `${JSON.stringify({
      artifact_type: 'ppt-handoff',
      template_id: 'swiss-evidence-deck',
      layouts: ['S17'],
      aesthetic_contract: { layout_lock: 'swiss-s01-s22' }
    }, null, 2)}\n`);
    writeFileSync(join(artifactRoot, 'slide-plan.json'), `${JSON.stringify({
      slides: [{ layout_id: 'S17' }]
    }, null, 2)}\n`);
    writeFileSync(
      join(artifactRoot, 'index.html'),
      '<section class="slide" data-layout="S03"></section>\n'
    );
    const deckResult = spawnSync(process.execPath, [
      join(root, 'scripts/validate-layout-lock.mjs'),
      artifactRoot,
      `--execution-plan=${deckPlanPath}`
    ], { cwd: root, encoding: 'utf8' });
    assert.notEqual(deckResult.status, 0);
    assert.match(
      `${deckResult.stdout}\n${deckResult.stderr}`,
      /slide 1 layout mismatch: slide-plan S17 != HTML S03/
    );

    const posterProfileValue = resolveDesignProfile(brief(), 'poster', assets);
    const posterPlan = compileExecutionPlan(v2Request({
      output_surface: {
        artifact_dir: 'artifact',
        artifact_type: 'poster',
        template_id: 'poster-type-led'
      },
      constraints: {
        ...v2Request().constraints,
        workspace_root: tempRoot
      }
    }), { designProfile: posterProfileValue, registry: templateRegistry });
    const posterPlanPath = join(tempRoot, 'poster-execution-plan.json');
    writeFileSync(posterPlanPath, `${JSON.stringify(posterPlan, null, 2)}\n`);
    writeFileSync(join(artifactRoot, 'manifest.json'), `${JSON.stringify({
      artifact_type: 'poster',
      template_id: 'poster-type-led',
      layouts: ['poster-type-led']
    }, null, 2)}\n`);
    writeFileSync(join(artifactRoot, 'poster-plan.json'), `${JSON.stringify({
      schema_version: 'design-poster-plan/v1',
      poster_goal: 'concept',
      audience: 'reviewer',
      single_message: 'One decision.',
      visual_hook: 'One focal claim.',
      layout_lock: 'poster-type-led',
      design_system: 'swiss-deck',
      source_materials: ['source.txt'],
      image_strategy: 'typography-only',
      claim_integrity: 'source-backed',
      anti_ai_slop_checks: ['one focal claim']
    }, null, 2)}\n`);
    writeFileSync(
      join(artifactRoot, 'index.html'),
      '<main data-poster-id="test" data-layout="poster-editorial">'
      + '<h1>One decision.</h1></main>\n'
    );
    const posterResult = spawnSync(process.execPath, [
      join(root, 'scripts/validate-poster-contract.mjs'),
      artifactRoot,
      `--execution-plan=${posterPlanPath}`
    ], { cwd: root, encoding: 'utf8' });
    assert.notEqual(posterResult.status, 0);
    assert.match(
      `${posterResult.stdout}\n${posterResult.stderr}`,
      /HTML poster layout poster-editorial must match poster-plan layout_lock poster-type-led/
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('topology changes constrain layout selection for the same deck template', () => {
  const systemProfile = resolveDesignProfile(brief({
    reader_job: 'system-explanation',
    primary_relationship: 'system'
  }), 'ppt-handoff', assets);
  const decisionProfile = resolveDesignProfile(brief({
    reader_job: 'executive-decision',
    primary_relationship: 'decision'
  }), 'ppt-handoff', assets);
  const deckRequest = v2Request({
    output_surface: {
      artifact_dir: 'artifact',
      artifact_type: 'ppt-handoff',
      template_id: 'swiss-evidence-deck'
    }
  });
  const systemPlan = compileExecutionPlan(deckRequest, {
    designProfile: systemProfile,
    registry: templateRegistry
  });
  const decisionPlan = compileExecutionPlan(deckRequest, {
    designProfile: decisionProfile,
    registry: templateRegistry
  });

  assert.deepEqual(
    systemPlan.template_resolution.selected_topology_layouts,
    { 'system-map': ['S17'] }
  );
  assert.deepEqual(
    decisionPlan.template_resolution.selected_topology_layouts,
    { 'decision-frame': ['S03', 'S21'] }
  );
});

test('public plan CLI requires a profile for core design surfaces', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-profile-plan-test-'));
  try {
    const requestPath = join(tempRoot, 'request.json');
    const profilePath = join(tempRoot, 'profile.json');
    writeFileSync(requestPath, `${JSON.stringify(posterRequest(), null, 2)}\n`);
    writeFileSync(
      profilePath,
      `${JSON.stringify(resolveDesignProfile(brief(), 'poster', assets), null, 2)}\n`
    );

    const missing = spawnSync(process.execPath, [
      join(root, 'scripts/design.mjs'),
      'plan',
      requestPath
    ], { cwd: root, encoding: 'utf8' });
    assert.notEqual(missing.status, 0);
    assert.match(`${missing.stdout}\n${missing.stderr}`, /requires --design-profile/);

    const supplied = spawnSync(process.execPath, [
      join(root, 'scripts/design.mjs'),
      'plan',
      requestPath,
      `--design-profile=${profilePath}`
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(supplied.status, 0, `${supplied.stdout}\n${supplied.stderr}`);
    assert.match(supplied.stdout, /"primary_preset": "executive-strategy"/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
