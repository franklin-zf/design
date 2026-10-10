import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
const fixture = join(root, 'examples/chart-frame-pass');

function copyFixture() {
  const dir = mkdtempSync(join('/tmp', 'design-visual-encoding-'));
  cpSync(fixture, dir, { recursive: true });
  return dir;
}

function runValidator(dir) {
  return spawnSync(process.execPath, ['scripts/validate-visual-encoding.mjs', dir], {
    cwd: root,
    encoding: 'utf8'
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

test('visual encoding passes a source-backed chart frame', () => {
  const result = runValidator(fixture);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('visual encoding rejects color-only and perspective encodings', () => {
  const dir = copyFixture();
  const manifestPath = join(dir, 'manifest.json');
  const manifest = readJson(manifestPath);
  manifest.charts[0].visual_encoding.mark = '3d perspective bars';
  manifest.charts[0].visual_encoding.label_policy = 'color-only';
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const result = runValidator(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /misleading depth|color, hover, tooltip/);
});

test('visual encoding rejects an unrendered chart contract', () => {
  const dir = copyFixture();
  const manifestPath = join(dir, 'manifest.json');
  const manifest = readJson(manifestPath);
  manifest.charts[0].id = 'missing-chart-region';
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const result = runValidator(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not rendered by a data-chart-id region/);
});
