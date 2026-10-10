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
  evaluateContentRouting,
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

test('every product preset carries structured alignment and icon rules', () => {
  for (const preset of assets.catalogue.product_presets) {
    assert.equal(preset.composition.edge_tolerance_px, 2, preset.id);
    assert.deepEqual(
      preset.composition.control_heights_px,
      [32, 40, 44],
      preset.id
    );
    assert.ok(preset.composition.alignment_policy, preset.id);
    assert.equal(typeof preset.media.icon_policy, 'object', preset.id);
    assert.deepEqual(preset.media.icon_policy.sizes_px, [16, 18], preset.id);
    assert.equal(preset.media.icon_policy.box_px, 20, preset.id);
    assert.equal(preset.media.icon_policy.text_gap_px, 6, preset.id);
    assert.match(preset.media.icon_policy.source, /local/i, preset.id);
    assert.match(preset.media.icon_policy.fallback, /label/i, preset.id);
  }
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
          secondary_preset_precedence: 'primary-over-secondary',
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
      secondary_preset_precedence: 'primary-over-secondary',
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
    writeFileSync(briefPath, `${JSON.stringify(brief({
      visual_treatment: {
        profile_id: 'editorial-ink-panel',
        variation_id: 'compact-reading',
        background_complexity: 'low'
      }
    }), null, 2)}\n`);
    const result = spawnSync(process.execPath, [
      join(root, 'scripts/design.mjs'),
      'profile',
      briefPath,
      '--artifact-type=poster',
      `--out=${profilePath}`
    ], { cwd: root, encoding: 'utf8' });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    assert.equal(profile.schema_version, 'design-profile/v2');
    assert.equal(profile.surface.id, 'poster');
    assert.equal(profile.visual_treatment.profile_id, 'editorial-ink-panel');
    assert.equal(profile.visual_treatment.variation_id, 'compact-reading');
    assert.equal(
      profile.visual_treatment.decisions['typography.hierarchy'].value,
      'compact-serif-display-sans-body'
    );
    assert.equal(profile.visual_treatment.decisions['material.mode'].value, 'opaque');

    writeFileSync(briefPath, `${JSON.stringify(brief({
      visual_treatment: {
        profile_id: 'glassmorphism-card',
        recipe_ids: ['material.opaque-surface']
      }
    }), null, 2)}\n`);
    const conflict = spawnSync(process.execPath, [
      join(root, 'scripts/design.mjs'),
      'profile',
      briefPath,
      '--artifact-type=poster',
      `--out=${profilePath}`
    ], { cwd: root, encoding: 'utf8' });
    assert.notEqual(conflict.status, 0);
    assert.match(`${conflict.stdout}\n${conflict.stderr}`, /visual treatment conflict/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('public design CLI help keeps only the four-step entrypoints', () => {
  const result = spawnSync(
    process.execPath,
    [join(root, 'scripts/design.mjs'), '--help'],
    { cwd: root, encoding: 'utf8' }
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  for (const command of ['profile', 'plan', 'check', 'preflight']) {
    assert.match(result.stdout, new RegExp(`\\n  ${command}(?: |\\n)`));
  }
  for (const command of [
    'render',
    'capture',
    'directions',
    'validate',
    'test'
  ]) {
    assert.doesNotMatch(result.stdout, new RegExp(`\\n  ${command}(?: |\\n)`));
  }
  assert.match(result.stdout, /references\/workflow\.md/);
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

  for (const field of ['catalogue_digest', 'theme_digest', 'visual_registry_digest']) {
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


test('REQ-003/004: visual recipe profiles resolve through one provenance-aware contract', async () => {
  const { resolveVisualTreatment } = await import('../scripts/lib/design-profile.mjs');
  const explicitGlass = {
    profile_id: 'glassmorphism-card',
    capabilities: { backdrop_filter: true },
    background_complexity: 'low',
    overrides: {
      'material.blur': { value: 16, unit: 'px', provenance: 'source-verbatim' },
      'color.background': { value: 'pastel-purple-to-pink', provenance: 'source-verbatim' },
      'lighting.edge': { value: '1px semi-transparent white', provenance: 'source-verbatim' }
    }
  };
  const glass = resolveVisualTreatment(explicitGlass, assets.visualRegistry);
  assert.equal(glass.status, 'resolved');
  assert.equal(glass.profile_id, 'glassmorphism-card');
  assert.deepEqual(glass.decisions['material.blur'], {
    value: 16, unit: 'px', provenance: 'source-verbatim'
  });
  assert.equal(glass.decisions['color.background'].provenance, 'source-verbatim');
  assert.equal(glass.decisions['lighting.edge'].provenance, 'source-verbatim');

  const glassWithoutExactValues = resolveVisualTreatment({
    profile_id: 'glassmorphism-card',
    capabilities: { backdrop_filter: true },
    background_complexity: 'low'
  }, assets.visualRegistry);
  assert.equal(glassWithoutExactValues.status, 'resolved');
  assert.equal(Object.hasOwn(glassWithoutExactValues.decisions, 'material.blur'), false);
  assert.equal(
    Object.values(glassWithoutExactValues.decisions)
      .some((input) => input.provenance === 'source-verbatim'),
    false
  );

  const editorial = resolveVisualTreatment({
    profile_id: 'editorial-ink-panel',
    capabilities: { backdrop_filter: true },
    background_complexity: 'low'
  }, assets.visualRegistry);
  assert.equal(editorial.status, 'resolved');
  assert.equal(editorial.decisions['material.mode'].value, 'opaque');
  assert.equal(Object.hasOwn(editorial.decisions, 'material.blur'), false);
  assert.equal(JSON.stringify(editorial).includes('pastel-purple'), false);
});

test('REQ-004: visual treatment degrades for density, background complexity, and capability', async () => {
  const { resolveVisualTreatment } = await import('../scripts/lib/design-profile.mjs');
  for (const request of [
    { profile_id: 'glassmorphism-card', content_density: 'dense' },
    { profile_id: 'glassmorphism-card', background_complexity: 'high' },
    { profile_id: 'glassmorphism-card', capabilities: { backdrop_filter: false } }
  ]) {
    const result = resolveVisualTreatment(request, assets.visualRegistry);
    assert.equal(result.status, 'capability_fallback');
    assert.equal(result.decisions['material.mode'].value, 'opaque-readable');
    assert.equal(Object.hasOwn(result.decisions, 'material.blur'), false);
    assert.ok(result.trace.some((entry) => entry.startsWith('fallback:')));
    assert.ok(result.decisions['composition.content_roles']);
  }
});

test('REQ-004/005: conflicts fail closed and unrelated requests do not leak profile details', async () => {
  const { resolveVisualTreatment } = await import('../scripts/lib/design-profile.mjs');
  const conflict = resolveVisualTreatment({
    profile_id: 'glassmorphism-card',
    recipe_ids: ['material.opaque-surface']
  }, assets.visualRegistry);
  assert.equal(conflict.status, 'conflict');
  assert.deepEqual(conflict.decisions, {});
  assert.deepEqual(conflict.conflicts, [
    ['material.opaque-surface', 'material.translucent-surface']
  ]);

  const unrelated = resolveVisualTreatment({ cues: ['dense-dashboard'] }, assets.visualRegistry);
  assert.deepEqual(unrelated, {
    status: 'profile_not_applied', profile_id: null, variation_id: null,
    variation_patch: {}, decisions: {},
    trace: ['no-unique-profile-match']
  });
  assert.equal(JSON.stringify(unrelated).includes('glass'), false);
});

test('REQ-003/004: invalid registry references and provenance fail before resolution', async () => {
  const { resolveVisualTreatment } = await import('../scripts/lib/design-profile.mjs');
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const registrySchema = JSON.parse(readFileSync(
    join(root, 'schemas/visual-recipe-registry.schema.json'),
    'utf8'
  ));
  const invalidSchemaRegistry = structuredClone(assets.visualRegistry);
  invalidSchemaRegistry.profiles[0].recipe_uses[0].inputs.content_roles.provenance = 'invented';
  assert.match(
    validateJsonInstance(registrySchema, invalidSchemaRegistry).join('\n'),
    /provenance/
  );
  const dangling = structuredClone(assets.visualRegistry);
  dangling.profiles[0].recipe_uses[0].recipe_id = 'recipe.missing';
  assert.throws(
    () => resolveVisualTreatment({ profile_id: 'glassmorphism-card' }, dangling),
    /unknown recipe recipe\.missing/
  );
  const invalidProvenance = structuredClone(assets.visualRegistry);
  invalidProvenance.profiles[0].recipe_uses[0].inputs.content_roles.provenance = 'invented';
  assert.throws(
    () => resolveVisualTreatment({ profile_id: 'glassmorphism-card' }, invalidProvenance),
    /invalid provenance|visual recipe registry is invalid/
  );
});

test('REQ-003/005/008: design profile v2 binds and replays visual treatment and registry digest', async () => {
  const input = brief({
    visual_treatment: {
      profile_id: 'glassmorphism-card',
      capabilities: { backdrop_filter: true },
      background_complexity: 'low',
      overrides: {
        'material.blur': { value: 16, unit: 'px', provenance: 'source-verbatim' }
      }
    }
  });
  const profile = resolveDesignProfile(input, 'poster', assets);
  assert.equal(profile.schema_version, 'design-profile/v2');
  assert.match(profile.visual_registry_digest, /^[a-f0-9]{64}$/);
  assert.equal(profile.visual_treatment.profile_id, 'glassmorphism-card');
  assert.equal(profile.visual_treatment.decisions['material.blur'].value, 16);

  const tampered = structuredClone(profile);
  tampered.visual_treatment.decisions['material.blur'].value = 99;
  const { validateResolvedDesignProfile } = await import('../scripts/lib/design-profile.mjs');
  assert.match(
    validateResolvedDesignProfile(tampered, 'poster', assets).join('\n'),
    /does not match the deterministic resolution/
  );
  const digestTamper = structuredClone(profile);
  digestTamper.visual_registry_digest = '0'.repeat(64);
  assert.match(
    validateResolvedDesignProfile(digestTamper, 'poster', assets).join('\n'),
    /visual_registry_digest does not match/
  );
});


test('REQ-010/015: profile-local variations overlay only allowlisted recipe inputs across two groups', async () => {
  const { resolveVisualTreatment } = await import('../scripts/lib/design-profile.mjs');
  const glass = resolveVisualTreatment({
    profile_id: 'glassmorphism-card',
    variation_id: 'blur-medium',
    overrides: {
      'material.blur': { value: 24, unit: 'px', provenance: 'source-verbatim' }
    }
  }, assets.visualRegistry);
  assert.equal(glass.status, 'resolved');
  assert.equal(glass.profile_id, 'glassmorphism-card');
  assert.equal(glass.variation_id, 'blur-medium');
  assert.deepEqual(glass.variation_patch['material.blur'], {
    value: 16, unit: 'px', provenance: 'profile-explicit'
  });
  assert.deepEqual(glass.decisions['material.blur'], {
    value: 24, unit: 'px', provenance: 'source-verbatim'
  });
  assert.ok(glass.trace.includes('variation:blur-medium'));

  const editorial = resolveVisualTreatment({
    profile_id: 'editorial-ink-panel',
    variation_id: 'compact-reading'
  }, assets.visualRegistry);
  assert.equal(editorial.status, 'resolved');
  assert.equal(editorial.profile_id, 'editorial-ink-panel');
  assert.equal(editorial.variation_id, 'compact-reading');
  assert.deepEqual(editorial.variation_patch['typography.hierarchy'], {
    value: 'compact-serif-display-sans-body', provenance: 'profile-explicit'
  });
  assert.equal(editorial.decisions['typography.hierarchy'].value, 'compact-serif-display-sans-body');
  assert.equal(Object.keys(editorial.variation_patch).some((path) => path.startsWith('material.')), false);
});

test('REQ-010/013/014: variation defaults are inert and unknown or incompatible selections fail closed', async () => {
  const { resolveVisualTreatment } = await import('../scripts/lib/design-profile.mjs');
  for (const profileId of ['glassmorphism-card', 'editorial-ink-panel']) {
    const first = resolveVisualTreatment({ profile_id: profileId }, assets.visualRegistry);
    const second = resolveVisualTreatment({ profile_id: profileId }, assets.visualRegistry);
    assert.deepEqual(first, second);
    assert.equal(first.variation_id, null);
    assert.deepEqual(first.variation_patch, {});
    assert.equal(JSON.stringify(first).includes('source-verbatim'), false);

    const unknown = resolveVisualTreatment({
      profile_id: profileId,
      variation_id: 'nearest-looking-name'
    }, assets.visualRegistry);
    assert.equal(unknown.status, 'variation_not_found');
    assert.equal(unknown.profile_id, profileId);
    assert.equal(unknown.variation_id, 'nearest-looking-name');
    assert.deepEqual(unknown.variation_patch, {});
    assert.deepEqual(unknown.decisions, first.decisions);
  }

  const incompatibleRegistry = structuredClone(assets.visualRegistry);
  incompatibleRegistry.profiles[1].variations.push({
    id: 'truth-bypass',
    recipe_inputs: [{
      recipe_id: 'material.translucent-surface',
      inputs: { mode: { value: 'translucent', provenance: 'profile-explicit' } }
    }]
  });
  const baseline = resolveVisualTreatment({
    profile_id: 'editorial-ink-panel'
  }, incompatibleRegistry);
  const incompatible = resolveVisualTreatment({
    profile_id: 'editorial-ink-panel', variation_id: 'truth-bypass'
  }, incompatibleRegistry);
  assert.equal(incompatible.status, 'incompatible_recipe');
  assert.equal(incompatible.variation_id, 'truth-bypass');
  assert.deepEqual(incompatible.variation_patch, {});
  assert.deepEqual(incompatible.decisions, baseline.decisions);
  assert.equal(JSON.stringify(incompatible.decisions).includes('translucent'), false);
});

test('REQ-010/013: variation schema rejects provenance elevation and arbitrary truth fields', async () => {
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const registrySchema = JSON.parse(readFileSync(
    join(root, 'schemas/visual-recipe-registry.schema.json'),
    'utf8'
  ));
  const elevated = structuredClone(assets.visualRegistry);
  elevated.profiles[0].variations[0].recipe_inputs[0].inputs.blur.provenance = 'source-verbatim';
  assert.match(validateJsonInstance(registrySchema, elevated).join('\n'), /provenance/);

  const arbitrary = structuredClone(assets.visualRegistry);
  arbitrary.profiles[0].variations[0].truth = { claims: ['invented'] };
  assert.match(validateJsonInstance(registrySchema, arbitrary).join('\n'), /additional property truth/);
});

test('REQ-010/014: design-profile/v2 variation resolution and legacy replay remain deterministic', async () => {
  const { validateResolvedDesignProfile } = await import('../scripts/lib/design-profile.mjs');
  const variedBrief = brief({
    visual_treatment: {
      profile_id: 'editorial-ink-panel',
      variation_id: 'compact-reading'
    }
  });
  const first = resolveDesignProfile(variedBrief, 'poster', assets);
  const second = resolveDesignProfile(variedBrief, 'poster', assets);
  assert.deepEqual(first, second);
  assert.equal(first.visual_treatment.variation_id, 'compact-reading');
  assert.deepEqual(validateResolvedDesignProfile(first, 'poster', assets), []);

  const legacyBrief = brief({ visual_treatment: { profile_id: 'editorial-ink-panel' } });
  const legacyFirst = resolveDesignProfile(legacyBrief, 'poster', assets);
  const legacySecond = resolveDesignProfile(legacyBrief, 'poster', assets);
  assert.deepEqual(legacyFirst, legacySecond);
  assert.equal(legacyFirst.visual_treatment.variation_id, null);
  assert.deepEqual(legacyFirst.visual_treatment.variation_patch, {});
  assert.deepEqual(validateResolvedDesignProfile(legacyFirst, 'poster', assets), []);
});


function contentSignals(overrides = {}) {
  return {
    content_role: 'decision',
    required_fields: ['recommendation', 'evidence', 'risk', 'next_action'],
    required_facts: ['decision_owner', 'decision_basis'],
    semantic_order: ['recommendation', 'evidence', 'risk', 'next_action'],
    density_bounds: { min_items: 1, max_items: 8 },
    evidence_role: 'supporting',
    primary_action: { intent: 'approve-or-reject', required: true },
    do_not_rewrite: ['recommendation', 'evidence'],
    preserved_invariants: ['facts', 'hierarchy', 'reading_order', 'state_meaning', 'action_intent'],
    truth_status: 'verified',
    delivery: {
      source_medium: 'interactive-web',
      target_medium: 'ppt',
      reduced_motion: false
    },
    candidate_signals: {
      categories: ['same-category-signal'],
      styles: ['decorative-style-word'],
      templates: ['template-name-is-not-authority']
    },
    ...overrides
  };
}

test('REQ-016 content constraints: structured invariants are enforced before profile selection and incomplete input blocks', async () => {
  const { evaluateContentRouting } = await import('../scripts/lib/design-profile.mjs');
  const input = brief({
    reader_job: 'choose',
    content_signals: contentSignals()
  });
  const first = evaluateContentRouting(input, 'ppt-handoff', assets.catalogue);
  const second = evaluateContentRouting(input, 'ppt-handoff', assets.catalogue);
  assert.deepEqual(first, second);
  assert.equal(first.status, 'recommended');
  assert.equal(first.selected_profile_id, 'executive-strategy');
  assert.deepEqual(first.content_constraints.required_fields, input.content_signals.required_fields);
  assert.deepEqual(first.content_constraints.required_facts, input.content_signals.required_facts);
  assert.deepEqual(first.content_constraints.semantic_order, input.content_signals.semantic_order);
  assert.ok(first.enforced_constraints.length > 0);
  assert.ok(first.enforced_constraints.some((item) => item.provenance === 'content-constraint'));

  const incomplete = structuredClone(input);
  delete incomplete.content_signals.required_fields;
  const blocked = evaluateContentRouting(incomplete, 'ppt-handoff', assets.catalogue);
  assert.equal(blocked.status, 'blocked');
  assert.ok(blocked.reason_codes.includes('content_constraints_incomplete'));
  assert.equal(blocked.selected_profile_id, null);
  assert.deepEqual(blocked.candidate_profile_ids, []);
  assert.ok(blocked.unknown_signals.includes('content_signals.required_fields'));
  assert.throws(
    () => resolveDesignProfile(incomplete, 'ppt-handoff', assets),
    (error) => error.code === 'content_constraints_incomplete'
      && error.routing?.status === 'blocked'
  );
});

test('REQ-017 content routing: reader job and content role drive stable catalogue candidates while category/style/template remain hints', async () => {
  const { evaluateContentRouting } = await import('../scripts/lib/design-profile.mjs');
  const fixtures = [
    ['understand', 'explanation', 'technical-architecture'],
    ['compare', 'data', 'data-analytics'],
    ['choose', 'decision', 'executive-strategy'],
    ['navigate', 'navigation', 'enterprise-saas'],
    ['input', 'form', 'enterprise-saas'],
    ['monitor', 'monitoring', 'data-analytics'],
    ['inspect-evidence', 'evidence', 'editorial-research']
  ];
  for (const [readerJob, contentRole, expected] of fixtures) {
    const input = brief({
      reader_job: readerJob,
      content_signals: contentSignals({ content_role: contentRole })
    });
    const result = evaluateContentRouting(input, 'ppt-handoff', assets.catalogue);
    assert.equal(result.status, 'recommended', `${readerJob}/${contentRole}`);
    assert.equal(result.selected_profile_id, expected, `${readerJob}/${contentRole}`);
    assert.ok(result.matched_rule_ids.some((id) => id.startsWith('route-')));
    assert.ok(result.trace.some((entry) => entry.startsWith('candidate-signal:categories:')));
  }

  const narrative = evaluateContentRouting(brief({
    reader_job: 'understand',
    content_signals: contentSignals({ content_role: 'narrative' })
  }), 'ppt-handoff', assets.catalogue);
  assert.equal(narrative.selected_profile_id, 'editorial-research');

  const none = evaluateContentRouting(brief({
    reader_job: 'compare',
    content_signals: contentSignals({ content_role: 'form' })
  }), 'ppt-handoff', assets.catalogue);
  assert.equal(none.status, 'abstained');
  assert.ok(none.reason_codes.includes('no_semantic_route'));
  assert.equal(none.selected_profile_id, null);

  const ambiguousCatalogue = structuredClone(assets.catalogue);
  ambiguousCatalogue.content_routing.rules.push({
    id: 'test-ambiguous-route',
    when: { reader_jobs: ['choose'], content_roles: ['decision'] },
    profile_id: 'consumer-brand',
    reason_code: 'test-ambiguous',
    enforced_constraint_ids: ['preserve-content-invariants']
  });
  const conflict = evaluateContentRouting(brief({
    reader_job: 'choose', content_signals: contentSignals()
  }), 'ppt-handoff', ambiguousCatalogue);
  assert.equal(conflict.status, 'conflict');
  assert.ok(conflict.reason_codes.includes('ambiguous_semantic_routes'));
  assert.deepEqual(conflict.candidate_profile_ids, ['consumer-brand', 'executive-strategy']);
  assert.equal(conflict.selected_profile_id, null);
});

test('REQ-018 semantic degradation: static, PPT, print, reduced-motion, and narrow targets preserve declared invariants or block', async () => {
  const { evaluateContentRouting } = await import('../scripts/lib/design-profile.mjs');
  const cases = [
    ['interactive-web', 'static-document', false],
    ['interactive-web', 'ppt', false],
    ['interactive-web', 'print', false],
    ['dynamic', 'reduced-motion', true],
    ['wide-screen', 'narrow-screen', false]
  ];
  for (const [sourceMedium, targetMedium, reducedMotion] of cases) {
    const input = brief({
      reader_job: 'choose',
      content_signals: contentSignals({
        delivery: {
          source_medium: sourceMedium,
          target_medium: targetMedium,
          reduced_motion: reducedMotion
        }
      })
    });
    const result = evaluateContentRouting(input, 'ppt-handoff', assets.catalogue);
    assert.equal(result.status, 'recommended', `${sourceMedium}->${targetMedium}`);
    assert.equal(result.semantic_degradation.source_medium, sourceMedium);
    assert.equal(result.semantic_degradation.target_medium, targetMedium);
    assert.equal(result.semantic_degradation.status, 'degraded_to_static');
    assert.deepEqual(
      result.semantic_degradation.preserved_invariants,
      input.content_signals.preserved_invariants
    );
    assert.ok(result.semantic_degradation.removed_mechanisms.length > 0);
    assert.ok(result.semantic_degradation.substitute_representation.length > 0);
    assert.ok(result.matched_rule_ids.some((id) => id.startsWith('degrade-')));
  }

  const unsupported = evaluateContentRouting(brief({
    reader_job: 'choose',
    content_signals: contentSignals({
      delivery: {
        source_medium: 'spatial', target_medium: 'print', reduced_motion: false
      }
    })
  }), 'poster', assets.catalogue);
  assert.equal(unsupported.status, 'blocked');
  assert.ok(unsupported.reason_codes.includes('semantic_degradation_blocked'));
  assert.equal(unsupported.selected_profile_id, null);
});

test('REQ-019 intent conflict: explicit profile disagreement and truth-sensitive visual conflicts fail closed without partial decisions', async () => {
  const { evaluateContentRouting } = await import('../scripts/lib/design-profile.mjs');
  const explicit = brief({
    reader_job: 'choose',
    primary_preset_override: 'consumer-brand',
    override_reason: 'The requester asked for a campaign profile.',
    content_signals: contentSignals()
  });
  const conflict = evaluateContentRouting(explicit, 'ppt-handoff', assets.catalogue);
  assert.equal(conflict.status, 'conflict');
  assert.ok(conflict.reason_codes.includes('intent_conflict'));
  assert.deepEqual(conflict.conflicts, [{
    field: 'primary_preset',
    sources: ['content-routing', 'user-explicit'],
    values: ['executive-strategy', 'consumer-brand']
  }]);
  assert.deepEqual(conflict.clarification_questions, [
    'Should the explicit primary preset or the reader-job/content-role route take precedence?'
  ]);
  assert.equal(conflict.selected_profile_id, null);
  assert.throws(
    () => resolveDesignProfile(explicit, 'ppt-handoff', assets),
    (error) => error.code === 'intent_conflict'
      && error.routing?.selected_profile_id === null
  );

  const truthConflict = brief({
    reader_job: 'inspect-evidence',
    primary_relationship: 'metrics',
    content_signals: contentSignals({ content_role: 'evidence', evidence_role: 'primary' }),
    visual_treatment: { profile_id: 'glassmorphism-card' }
  });
  assert.throws(
    () => resolveDesignProfile(truthConflict, 'ppt-handoff', assets),
    (error) => error.code === 'intent_conflict'
      && error.routing?.reason_codes.includes('visual_constraint_conflict')
      && error.routing?.selected_profile_id === null
  );

  const accessibilityConflict = brief({
    reader_job: 'choose',
    content_signals: contentSignals({
      accessibility: { requires_reduced_transparency: true }
    }),
    visual_treatment: { profile_id: 'glassmorphism-card' }
  });
  assert.throws(
    () => resolveDesignProfile(accessibilityConflict, 'ppt-handoff', assets),
    (error) => error.code === 'intent_conflict'
      && error.routing?.reason_codes.includes('accessibility_constraint_conflict')
      && error.routing?.selected_profile_id === null
  );
});

test('REQ-016/017 content routing result is schema-bound and source stays generic without profile slug branches', async () => {
  const { evaluateContentRouting } = await import('../scripts/lib/design-profile.mjs');
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const profileSchema = JSON.parse(readFileSync(join(root, 'schemas/design-profile.schema.json'), 'utf8'));
  const input = brief({ reader_job: 'choose', content_signals: contentSignals() });
  const profile = resolveDesignProfile(input, 'ppt-handoff', assets);
  const decision = evaluateContentRouting(input, 'ppt-handoff', assets.catalogue);
  assert.deepEqual(profile.content_routing, decision);
  assert.deepEqual(validateJsonInstance(profileSchema, profile), []);
  const source = readFileSync(join(root, 'scripts/lib/design-profile.mjs'), 'utf8');
  for (const profileId of assets.catalogue.product_presets.map((item) => item.id)) {
    assert.equal(source.includes(`=== '${profileId}'`), false, profileId);
    assert.equal(source.includes(`case '${profileId}'`), false, profileId);
  }
});


test('MAJ-001 secondary_preset_override requires declared precedence, rejects mutually exclusive profiles, and limits contributions', () => {
  const routedBrief = brief({
    reader_job: 'choose',
    content_signals: contentSignals(),
    secondary_preset_override: 'editorial-research',
    override_reason: 'Add supporting editorial context.'
  });
  assert.throws(
    () => resolveDesignProfile(routedBrief, 'ppt-handoff', assets),
    (error) => error.code === 'intent_conflict'
      && error.routing?.selected_profile_id === null
      && error.routing?.reason_codes.includes('secondary_precedence_missing')
  );

  const legal = resolveDesignProfile({
    ...routedBrief,
    secondary_preset_precedence: 'primary-over-secondary'
  }, 'ppt-handoff', assets);
  assert.equal(legal.primary_preset, 'executive-strategy');
  assert.deepEqual(legal.secondary_preset, {
    id: 'editorial-research',
    contributes: ['topology', 'surface_emphasis']
  });
  assert.equal(legal.content_routing.selected_profile_id, 'executive-strategy');
  assert.ok(legal.content_routing.reason_codes.includes('secondary_precedence_applied'));
  assert.ok(legal.content_routing.trace.some((entry) => entry.startsWith('precedence:')));

  const mutuallyExclusive = brief({
    reader_job: 'choose',
    content_signals: contentSignals(),
    secondary_preset_override: 'consumer-brand',
    secondary_preset_precedence: 'primary-over-secondary',
    override_reason: 'Attempt a conflicting campaign profile.'
  });
  const conflictingAssets = structuredClone(assets);
  conflictingAssets.catalogue.routing.secondary_override_policy
    .mutually_exclusive_profile_pairs.push(['consumer-brand', 'executive-strategy']);
  assert.throws(
    () => resolveDesignProfile(mutuallyExclusive, 'ppt-handoff', conflictingAssets),
    (error) => error.code === 'intent_conflict'
      && error.routing?.reason_codes.includes('secondary_profiles_mutually_exclusive')
      && error.routing?.selected_profile_id === null
  );
});

test('MAJ-002 catalogue schema directly and closedly validates content_routing without self-authorized constraints', async () => {
  const { validateJsonInstance } = await import('../scripts/lib/json-schema.mjs');
  const schema = JSON.parse(readFileSync(
    join(root, 'schemas/design-profile-catalogue.schema.json'), 'utf8'
  ));
  assert.deepEqual(validateJsonInstance(schema, assets.catalogue), []);

  const unknown = structuredClone(assets.catalogue);
  unknown.content_routing.unchecked_extension = true;
  assert.match(validateJsonInstance(schema, unknown).join('\n'), /unchecked_extension/);

  const selfAuthorized = structuredClone(assets.catalogue);
  selfAuthorized.content_routing.enforced_constraint_allowlist = ['content.self_authorized'];
  selfAuthorized.content_routing.constraints.push({
    id: 'self-authorized',
    target_path: 'content.self_authorized',
    source_path: 'required_facts'
  });
  assert.match(
    validateJsonInstance(schema, selfAuthorized).join('\n'),
    /enforced_constraint_allowlist|target_path|content\.self_authorized/
  );

  const invalidDegradation = structuredClone(assets.catalogue);
  delete invalidDegradation.content_routing.degradation_rules[0].preserved_invariants;
  invalidDegradation.content_routing.degradation_rules[0].status = 'rendered-but-not-equivalent';
  invalidDegradation.content_routing.degradation_rules[0].unknown = true;
  const degradationErrors = validateJsonInstance(schema, invalidDegradation).join('\n');
  assert.match(degradationErrors, /preserved_invariants/);
  assert.match(degradationErrors, /status/);
  assert.match(degradationErrors, /unknown/);

  const missing = structuredClone(assets.catalogue);
  delete missing.content_routing.required_signal_paths;
  assert.match(validateJsonInstance(schema, missing).join('\n'), /required_signal_paths/);

  const loaderSource = readFileSync(join(root, 'scripts/lib/design-profile.mjs'), 'utf8');
  assert.equal(loaderSource.includes('delete legacyCatalogueShape.content_routing'), false);
  assert.equal(loaderSource.includes('legacyCatalogueShape'), false);
});

test('MAJ-003 profile slug set is catalogue-driven and malformed dynamic references still fail closed', () => {
  const source = readFileSync(join(root, 'scripts/lib/design-profile.mjs'), 'utf8');
  for (const profileId of assets.catalogue.product_presets.map((item) => item.id)) {
    assert.equal(source.includes(`'${profileId}'`), false, profileId);
  }
  assert.equal(source.includes('expectedPresetIds'), false);

  const extensibleAssets = structuredClone(assets);
  const added = structuredClone(extensibleAssets.catalogue.product_presets[0]);
  added.id = 'qa-added-profile';
  extensibleAssets.catalogue.product_presets.push(added);
  const route = extensibleAssets.catalogue.content_routing.rules.find(
    (item) => item.id === 'route-choose-decision'
  );
  route.profile_id = added.id;
  const resolved = resolveDesignProfile(brief({
    reader_job: 'choose', content_signals: contentSignals()
  }), 'ppt-handoff', extensibleAssets);
  assert.equal(resolved.primary_preset, added.id);

  const duplicate = structuredClone(extensibleAssets);
  duplicate.catalogue.product_presets.push(structuredClone(added));
  assert.throws(
    () => resolveDesignProfile(brief({
      reader_job: 'choose', content_signals: contentSignals()
    }), 'ppt-handoff', duplicate),
    /product preset ids must be unique/
  );

  const dangling = structuredClone(assets.catalogue);
  dangling.content_routing.rules[0].profile_id = 'missing-profile';
  assert.throws(
    () => evaluateContentRouting(brief({
      reader_job: 'understand',
      content_signals: contentSignals({ content_role: 'explanation' })
    }), 'ppt-handoff', dangling),
    /unknown profile missing-profile/
  );

  const invalidPrecedence = structuredClone(assets);
  invalidPrecedence.catalogue.routing.secondary_override_policy.allowed_precedence = ['secondary-wins'];
  assert.throws(
    () => resolveDesignProfile(brief({
      reader_job: 'choose', content_signals: contentSignals()
    }), 'ppt-handoff', invalidPrecedence),
    /invalid precedence secondary-wins/
  );

  const invalidDegradation = structuredClone(assets.catalogue);
  invalidDegradation.content_routing.degradation_rules[0].status = 'best-effort';
  assert.throws(
    () => evaluateContentRouting(brief({
      reader_job: 'choose', content_signals: contentSignals()
    }), 'ppt-handoff', invalidDegradation),
    /invalid status best-effort/
  );

  const unknownConstraint = structuredClone(assets.catalogue);
  unknownConstraint.content_routing.rules[0].enforced_constraint_ids.push('missing-constraint');
  assert.throws(
    () => evaluateContentRouting(brief({
      reader_job: 'understand',
      content_signals: contentSignals({ content_role: 'explanation' })
    }), 'ppt-handoff', unknownConstraint),
    /unknown constraint missing-constraint/
  );
});
