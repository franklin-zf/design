import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { loadPlaywrightRuntime, PlaywrightRuntimeError } from '../scripts/lib/playwright-runtime.mjs';

function fakePlaywright(root, placement = 'node_modules') {
  const moduleRoot = placement === 'module' ? join(root, 'playwright') : join(root, 'node_modules', 'playwright');
  const executable = join(root, 'fake-chromium');
  mkdirSync(moduleRoot, { recursive: true });
  writeFileSync(executable, 'fake executable');
  writeFileSync(join(moduleRoot, 'package.json'), JSON.stringify({ name: 'playwright', type: 'module', main: 'index.mjs' }));
  writeFileSync(join(moduleRoot, 'index.mjs'), `export const chromium = { executablePath: () => ${JSON.stringify(executable)}, launch: async () => ({ close: async () => {} }) };\n`);
  return { moduleRoot, executable };
}

test('explicit Playwright module or node_modules root resolves first', async () => {
  const root = mkdtempSync(join(tmpdir(), 'design-playwright-explicit-'));
  const emptyPackage = join(root, 'empty-package');
  const emptyHome = join(root, 'empty-home');
  try {
    mkdirSync(emptyPackage);
    mkdirSync(emptyHome);
    fakePlaywright(root);
    const runtime = await loadPlaywrightRuntime({ explicitPath: join(root, 'node_modules'), packageRoot: emptyPackage, homeDir: emptyHome });
    assert.equal(runtime.source, 'explicit');
    assert.match(runtime.modulePath, /playwright\/index\.mjs$/);
    assert.match(runtime.evidence, /source=explicit/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('invalid explicit path falls back deterministically to package-local Playwright', async () => {
  const root = mkdtempSync(join(tmpdir(), 'design-playwright-local-'));
  const emptyHome = join(root, 'empty-home');
  try {
    mkdirSync(emptyHome);
    fakePlaywright(root);
    const runtime = await loadPlaywrightRuntime({ explicitPath: join(root, 'missing'), packageRoot: root, homeDir: emptyHome });
    assert.equal(runtime.source, 'package-local');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('current candidate resolves a validated package-local or Codex bundled runtime', async () => {
  const runtime = await loadPlaywrightRuntime();
  assert.ok(['package-local', 'codex-bundled-runtime', 'explicit'].includes(runtime.source));
  assert.equal(typeof runtime.chromium.launch, 'function');
  assert.ok(runtime.executablePath.length > 0);
});

test('Codex bundled runtime fallback is discovered under the supplied current-user home', async () => {
  const root = mkdtempSync(join(tmpdir(), 'design-playwright-codex-cache-'));
  const emptyPackage = join(root, 'empty-package');
  const runtimeNode = join(root, 'home', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node');
  try {
    mkdirSync(emptyPackage, { recursive: true });
    fakePlaywright(runtimeNode);
    const runtime = await loadPlaywrightRuntime({ packageRoot: emptyPackage, homeDir: join(root, 'home') });
    assert.equal(runtime.source, 'codex-bundled-runtime');
    assert.match(runtime.modulePath, /codex-primary-runtime\/dependencies\/node\/node_modules\/playwright\/index\.mjs$/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('missing runtime fails closed with actionable attempted-path evidence', async () => {
  const root = mkdtempSync(join(tmpdir(), 'design-playwright-missing-'));
  const emptyPackage = join(root, 'empty-package');
  const emptyHome = join(root, 'empty-home');
  try {
    mkdirSync(emptyPackage);
    mkdirSync(emptyHome);
    await assert.rejects(
      () => loadPlaywrightRuntime({ explicitPath: join(root, 'missing'), packageRoot: emptyPackage, homeDir: emptyHome }),
      (error) => error instanceof PlaywrightRuntimeError
        && error.code === 'PLAYWRIGHT_RUNTIME_UNAVAILABLE'
        && /DESIGN_PLAYWRIGHT_PATH/.test(error.message)
        && /module entry missing/.test(error.message)
    );
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('every browser entrypoint uses the shared loader and has no direct Playwright import', () => {
  const entrypoints = [
    'scripts/capability-preflight.mjs',
    'scripts/render-smoke.mjs',
    'scripts/tweakable-smoke.mjs',
    'scripts/capture-deck-slides.mjs',
    'scripts/capture-deck-contact-sheets.mjs'
  ];
  for (const relativePath of entrypoints) {
    const source = readFileSync(resolve(relativePath), 'utf8');
    assert.match(source, /from ['"]\.\/lib\/playwright-runtime\.mjs['"]/);
    assert.match(source, /loadPlaywrightRuntime\(/);
    assert.doesNotMatch(source, /from\s+['"]playwright['"]|import\(\s*['"]playwright['"]\s*\)/);
  }
});
