import test from 'node:test';
import assert from 'node:assert/strict';
import { loadShotsIndex, searchShots, getShot, syncDailyShots } from '../scripts/dribbble-hub.mjs';

test('Dribbble Hub - loadShotsIndex returns at least 4 shots', () => {
  const index = loadShotsIndex();
  assert.ok(index.shots, 'shots array should exist');
  assert.ok(index.shots.length >= 4, `expected at least 4 shots, got ${index.shots.length}`);
});

test('Dribbble Hub - searchShots by Chinese scene keyword', () => {
  const results = searchShots('生活服务');
  assert.ok(results.length > 0, 'should return matching shot for 生活服务');
  assert.equal(results[0].id, 'shot_20261013_02');
});

test('Dribbble Hub - searchShots by Bento topology', () => {
  const results = searchShots('Bento');
  assert.ok(results.length > 0, 'should find Bento shots');
  assert.ok(results.some(s => s.visual_features.layout_topology.includes('bento')));
});

test('Dribbble Hub - getShot by id returns complete visual features', () => {
  const shot = getShot('shot_20261013_01');
  assert.ok(shot, 'shot should be found');
  assert.equal(shot.title, 'Fintech SaaS Analytics & Bento Workspace');
  assert.ok(shot.visual_features.color_palette.contrast_ratio, 'contrast ratio should exist');
  assert.ok(shot.visual_features.material_recipe.border, 'border recipe should exist');
  assert.ok(shot.visual_features.material_recipe.inset_safe_padding, 'inset safe padding should exist');
});

test('Dribbble Hub - syncDailyShots returns quota success', () => {
  const res = syncDailyShots({ count: 4 });
  assert.equal(res.success, true);
  assert.equal(res.synced_count, 4);
});
