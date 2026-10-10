import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  contrastRatio,
  validateColorContract,
  validateColorSystemRoot
} from '../scripts/validate-color-system.mjs';
import {
  loadDesignProfileAssets,
  resolveDesignProfile
} from '../scripts/lib/design-profile.mjs';

const root = resolve('.');
const colorSchema = JSON.parse(
  readFileSync(join(root, 'schemas/color-contract.schema.json'), 'utf8')
);

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

test('style presets and production design systems satisfy one color contract', () => {
  assert.deepEqual(validateColorSystemRoot(root), []);
  assert.ok(contrastRatio('#111111', '#f4f4f0') >= 7);
});

test('resolved profiles bind primary color direction and style color contract', () => {
  const assets = loadDesignProfileAssets(root);
  const artifactTypes = ['ppt-handoff', 'html-deck', 'poster'];
  for (const [readerJob, primaryId] of Object.entries(
    assets.catalogue.routing.reader_job_to_preset
  )) {
    for (const artifactType of artifactTypes) {
      const profile = resolveDesignProfile(
        brief({ reader_job: readerJob }),
        artifactType,
        assets
      );
      const primary = assets.catalogue.product_presets.find(
        (preset) => preset.id === primaryId
      );
      assert.deepEqual(profile.resolved_rules.color_direction, primary.color_direction);
      assert.equal(
        profile.resolved_theme.color_contract.schema_version,
        'design-color-contract/v1'
      );
      assert.equal(profile.resolved_theme.color_contract.color_alone, false);
    }
  }
});

test('color contract fails closed on weak contrast, missing roles, and color-only meaning', () => {
  const assets = loadDesignProfileAssets(root);
  const preset = structuredClone(assets.themes.presets['neutral-analytic']);
  const colors = Object.fromEntries(
    Object.entries(preset).filter(([, value]) => /^#[a-f0-9]{6}$/i.test(value))
  );

  colors.muted = '#b8b8b8';
  assert.match(
    validateColorContract(
      preset.color_contract,
      colors,
      { label: 'mutated preset', schema: colorSchema }
    ).join('\n'),
    /contrast .* below declared/i
  );

  delete colors.accent;
  assert.match(
    validateColorContract(
      preset.color_contract,
      colors,
      { label: 'mutated preset', schema: colorSchema }
    ).join('\n'),
    /requires an accent color role|missing foreground role accent/i
  );

  const unsafeContract = structuredClone(preset.color_contract);
  unsafeContract.color_alone = true;
  assert.match(
    validateColorContract(
      unsafeContract,
      colors,
      { label: 'mutated preset', schema: colorSchema }
    ).join('\n'),
    /color_alone.*must equal const false/i
  );
});

test('non-text and text usages enforce different minimum contrast floors', () => {
  const assets = loadDesignProfileAssets(root);
  const preset = structuredClone(assets.themes.presets['neutral-analytic']);
  const colors = Object.fromEntries(
    Object.entries(preset).filter(([, value]) => /^#[a-f0-9]{6}$/i.test(value))
  );
  const contract = structuredClone(preset.color_contract);
  contract.required_pairings[0].minimum_ratio = 3;
  assert.match(
    validateColorContract(
      contract,
      colors,
      { label: 'mutated preset', schema: colorSchema }
    ).join('\n'),
    /below the 4\.5:1 floor for body-text/i
  );
});

test('operational accent cannot reuse a semantic status color', () => {
  const assets = loadDesignProfileAssets(root);
  const preset = structuredClone(assets.themes.presets['operational-dashboard']);
  const colors = Object.fromEntries(
    Object.entries(preset).filter(([, value]) => /^#[a-f0-9]{6}$/i.test(value))
  );
  colors.accent = colors.positive;
  assert.match(
    validateColorContract(
      preset.color_contract,
      colors,
      { label: 'mutated operational preset', schema: colorSchema }
    ).join('\n'),
    /operational accent must remain distinct from semantic role positive/i
  );
});
