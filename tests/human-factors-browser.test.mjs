import assert from 'node:assert/strict';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import {
  loadDesignProfileAssets,
  resolveDesignProfile,
  validateResolvedDesignProfile
} from '../scripts/lib/design-profile.mjs';
import { bindHumanFactorsToHtml } from '../scripts/lib/human-factors.mjs';
import { loadPlaywrightRuntime } from '../scripts/lib/playwright-runtime.mjs';

const root = resolve('.');
const profileAssets = loadDesignProfileAssets(root);

function createDeckFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'design-human-runtime-'));
  copyFileSync(
    join(root, 'assets/runtime/human-factors.css'),
    join(directory, 'human-factors.css')
  );
  copyFileSync(
    join(root, 'assets/runtime/human-factors.js'),
    join(directory, 'human-factors.js')
  );
  copyFileSync(
    join(root, 'assets/vendor/open-design-html-ppt/runtime.js'),
    join(directory, 'deck-runtime.js')
  );
  writeFileSync(join(directory, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Human Factors Deck</title>
  <link rel="stylesheet" href="human-factors.css">
  <style>
    :root { --surface:#fff; --surface-2:#f2f2f4; --text-1:#111; --text-2:#555; --accent:#0047ff; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:system-ui,sans-serif; }
    .deck { position:relative; width:100vw; height:100vh; overflow:hidden; }
    .slide { position:absolute; inset:0; display:none; padding:64px; }
    .slide.is-active { display:block; }
    .slide button,.slide input { min-width:44px; min-height:44px; }
    .deck-footer { position:fixed; left:24px; right:24px; bottom:24px; }
  </style>
</head>
<body>
  <main class="deck" data-design-id="human-factor-deck"
        data-primary-preset="technical-architecture" data-style-preset="swiss-deck"
        data-design-profile-digest="${'b'.repeat(64)}"
        data-artifact-type="html-deck" data-navigation-mode="paged"
        data-reading-pattern="scan-decide-verify" data-attention-context="focused"
        data-usage-frequency="repeated" data-input-context="mixed"
        data-interaction-intent="navigate" data-min-target-size="24"
        data-human-factors-digest="${'a'.repeat(64)}">
    <section class="slide"><h1>Decision</h1></section>
    <section class="slide"><h2>Evidence</h2><input id="deck-input" aria-label="Evidence note"><button id="deck-action" onclick="this.dataset.clicked='yes'">Inspect</button></section>
    <section class="slide"><h2>Action</h2></section>
  </main>
  <div class="deck-footer"><span class="slide-number"></span></div>
  <script>if (!location.hash) history.replaceState(null, '', '#/2');</script>
  <script src="deck-runtime.js"></script>
  <script src="human-factors.js"></script>
</body>
</html>
`);
  return directory;
}

function createSwissTemplateFixture(artifactType = 'html-deck') {
  const directory = mkdtempSync(join(tmpdir(), 'design-human-template-'));
  for (const path of [
    'assets/templates',
    'assets/vendor/open-design-html-ppt',
    'assets/runtime',
    'design-systems/swiss-deck'
  ]) {
    mkdirSync(join(directory, path), { recursive: true });
  }
  for (const path of [
    'assets/vendor/open-design-html-ppt/base.css',
    'assets/vendor/open-design-html-ppt/runtime.js',
    'assets/runtime/deck-bootstrap.js',
    'assets/runtime/human-factors.css',
    'assets/runtime/human-factors.js',
    'design-systems/swiss-deck/layouts.css'
  ]) {
    copyFileSync(join(root, path), join(directory, path));
  }
  const profile = resolveDesignProfile({
    schema_version: 'design-brief/v1',
    reader_job: 'executive-decision',
    primary_relationship: 'decision',
    secondary_relationships: [],
    content_density: 'auto',
    attention_context: artifactType === 'ppt-handoff' ? 'projected' : 'auto',
    usage_frequency: 'repeated',
    input_context: artifactType === 'ppt-handoff' ? 'keyboard' : 'auto',
    brand_context: 'none',
    ...(artifactType === 'html-deck' ? {
      primary_preset_override: 'technical-architecture',
      override_reason: 'The fixture materializes the Swiss deck template.'
    } : {})
  }, artifactType, profileAssets);
  const bodySlide = `<section class="slide ds-swiss-close" data-layout="S03"
    data-purpose="evidence"><h2 class="ds-swiss-title">Evidence</h2>
    <p class="ds-swiss-copy">The default state keeps the answer visible.</p></section>`;
  let materialized = bindHumanFactorsToHtml(
    readFileSync(join(root, 'assets/templates/swiss-evidence-deck.html'), 'utf8'),
    profile
  ).replace('{{BODY_SLIDES}}', bodySlide)
    .replace(/{{[A-Z0-9_]+}}/g, 'Decision');
  if (artifactType === 'ppt-handoff') {
    materialized = materialized
      .replace('data-human-factors-digest="', 'data-surface-mode="projection-fixed" data-human-factors-digest="')
      .replace('</head>', `<style>
        main[data-artifact-type="ppt-handoff"][data-navigation-mode="external-player"][data-surface-mode="projection-fixed"] > .slide {
          width:100%; height:auto; min-height:0; aspect-ratio:16 / 9;
          overflow:hidden; padding:clamp(10px,5vw,64px);
        }
        main[data-surface-mode="projection-fixed"] .ds-swiss-title {
          font-size:clamp(18px,5vw,84px);
        }
        main[data-surface-mode="projection-fixed"] .ds-swiss-copy,
        main[data-surface-mode="projection-fixed"] .ds-swiss-meta {
          font-size:clamp(7px,1.4vw,20px);
        }
      </style></head>`);
  }
  const htmlPath = join(directory, 'assets/templates/index.html');
  writeFileSync(htmlPath, materialized);
  return { directory, htmlPath, profile };
}

async function assertState(page, current, total) {
  const deck = page.locator('.deck');
  await page.waitForFunction(
    ({ expectedCurrent, expectedTotal }) => {
      const rootElement = document.querySelector('.deck');
      return rootElement?.dataset.currentSlide === String(expectedCurrent)
        && rootElement?.dataset.totalSlides === String(expectedTotal);
    },
    { expectedCurrent: current, expectedTotal: total }
  );
  assert.equal(await deck.getAttribute('data-current-slide'), String(current));
  assert.equal(
    await page.locator('[data-human-status]').textContent(),
    `${current} / ${total}`
  );
  assert.equal(await page.locator('.deck > .slide[aria-current="step"]').count(), 1);
  assert.equal(
    await page.locator(`.deck > .slide:nth-of-type(${current})`).getAttribute('aria-hidden'),
    'false'
  );
  assert.equal(
    await page.locator('.slide[aria-hidden="true"]:not([inert])').count(),
    0
  );
  assert.equal(
    await page.locator('.deck > .slide').evaluateAll((slides) => slides.filter((slide) => {
      const style = getComputedStyle(slide);
      const rect = slide.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0 && rect.width > 1 && rect.height > 1;
    }).length),
    1
  );
}

test('human-factor runtime preserves deck orientation and recovery', async () => {
  const directory = createDeckFixture();
  const { chromium } = await loadPlaywrightRuntime({ packageRoot: root });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 320, height: 700 }
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      try {
        await page.goto(pathToFileURL(join(directory, 'index.html')).href);
        await assertState(page, 2, 3);
        assert.equal(
          await page.locator('.deck > .slide:nth-of-type(2)').getAttribute('aria-roledescription'),
          'Slide'
        );
        assert.equal(
          await page.locator('[data-human-status]').getAttribute('aria-label'),
          'Current slide 2 / 3: Evidence'
        );
        assert.equal(await page.locator('#deck-input').count(), 1);

        const input = page.locator('#deck-input');
        await input.focus();
        await input.press('End');
        await input.press(' ');
        await assertState(page, 2, 3);
        const action = page.locator('#deck-action');
        await action.focus();
        await action.press('Enter');
        assert.equal(await action.getAttribute('data-clicked'), 'yes');
        await assertState(page, 2, 3);

        const controls = page.locator('.deck-human-controls');
        const controlsBox = await controls.boundingBox();
        assert.ok(controlsBox);
        assert.ok(controlsBox.x >= 0 && controlsBox.x + controlsBox.width <= viewport.width);
        assert.ok(controlsBox.y >= 0 && controlsBox.y + controlsBox.height <= viewport.height);
        for (const id of ['previous', 'next']) {
          const button = page.locator(`[data-human-control="${id}"]`);
          const box = await button.boundingBox();
          assert.ok(box && box.width >= 44 && box.height >= 44);
          assert.ok(await button.getAttribute('aria-label'));
        }

        const previous = page.locator('[data-human-control="previous"]');
        await previous.focus();
        await previous.press('Enter');
        await assertState(page, 1, 3);

        const next = page.locator('[data-human-control="next"]');
        await next.focus();
        await next.press('Enter');
        await assertState(page, 2, 3);
        await next.press('Enter');
        await assertState(page, 3, 3);
        assert.equal(await next.isDisabled(), true);
        assert.equal(await page.evaluate(() => location.hash), '#/3');

        await page.reload();
        await assertState(page, 3, 3);
        await page.keyboard.press('Home');
        await assertState(page, 1, 3);
        assert.equal(await page.evaluate(() => location.hash), '#/1');
        await page.evaluate(() => { location.hash = '#/99'; });
        await assertState(page, 3, 3);
        assert.equal(await page.evaluate(() => location.hash), '#/3');
        await page.evaluate(() => { location.hash = '#/invalid'; });
        await assertState(page, 1, 3);
        assert.equal(await page.evaluate(() => location.hash), '#/1');
      } finally {
        await context.close();
      }
    }
    const smoke = spawnSync(process.execPath, [
      join(root, 'scripts/render-smoke.mjs'),
      join(directory, 'index.html'),
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.equal(smoke.status, 0, `${smoke.stdout}\n${smoke.stderr}`);
    const audit = spawnSync(process.execPath, [
      join(root, 'scripts/audit-human-factors.mjs'),
      join(directory, 'index.html'),
      '--viewports=desktop,mobile,small-phone'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.equal(audit.status, 0, `${audit.stdout}\n${audit.stderr}`);
    const auditResult = JSON.parse(audit.stdout);
    assert.equal(auditResult.status, 'passed');
    for (const observation of auditResult.observations) {
      assert.equal(
        observation.checks.find((check) => check.id === 'html-one-visible-page')?.passed,
        true
      );
      assert.equal(
        observation.checks.find(
          (check) => check.id === 'html-floating-control-occlusion'
        )?.passed,
        true
      );
    }
  } finally {
    await browser.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('human-factor audit rejects a floating control over readable content', () => {
  const directory = mkdtempSync(join(tmpdir(), 'design-human-occlusion-'));
  const htmlPath = join(directory, 'index.html');
  try {
    writeFileSync(htmlPath, `<!doctype html>
<html lang="en"><head><style>
  body { margin:0; }
  .slide { min-height:100vh; padding:20px; }
  .deck-human-controls { position:fixed; inset:12px auto auto 12px; }
  button { width:44px; height:44px; }
</style></head><body>
<main data-design-id="occluded-deck" data-artifact-type="html-deck"
  data-primary-preset="technical-architecture" data-style-preset="swiss-deck"
  data-design-profile-digest="${'b'.repeat(64)}"
  data-navigation-mode="paged" data-reading-pattern="scan-decide-verify"
  data-attention-context="focused" data-usage-frequency="one-off"
  data-input-context="mixed" data-interaction-intent="navigate"
  data-min-target-size="24" data-human-factors-digest="${'a'.repeat(64)}"
  data-current-slide="1" data-total-slides="1">
  <section class="slide" aria-current="step" aria-hidden="false"><h1>Decision</h1></section>
</main>
<nav class="deck-human-controls"><button data-human-control="previous" aria-label="Previous">←</button><output data-human-status>1 / 1</output><button data-human-control="next" aria-label="Next">→</button></nav>
<script>history.replaceState(null, '', '#/1');</script>
</body></html>`);
    const audit = spawnSync(process.execPath, [
      join(root, 'scripts/audit-human-factors.mjs'),
      htmlPath,
      '--viewports=desktop'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.notEqual(audit.status, 0, audit.stdout);
    const result = JSON.parse(audit.stdout);
    const collision = result.observations[0].checks.find(
      (check) => check.id === 'html-floating-control-occlusion'
    );
    assert.equal(collision?.passed, false);
    assert.match(JSON.stringify(collision.evidence), /Decision/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('human-factor audit rejects roughly twenty percent text overlap', () => {
  const directory = mkdtempSync(join(tmpdir(), 'design-human-text-overlap-'));
  const htmlPath = join(directory, 'index.html');
  try {
    writeFileSync(htmlPath, `<!doctype html><html lang="en"><body>
      <main data-design-id="overlap-poster" data-artifact-type="poster"
        data-primary-preset="technical-architecture" data-style-preset="swiss-deck"
        data-design-profile-digest="${'b'.repeat(64)}"
        data-navigation-mode="static" data-reading-pattern="scan-decide-verify"
        data-attention-context="focused" data-usage-frequency="one-off"
        data-input-context="none" data-interaction-intent="static"
        data-min-target-size="0" data-human-factors-digest="${'a'.repeat(64)}"
        data-primary-claim="#claim" data-surface-mode="poster-fixed"
        data-poster-frame-width="1080" data-poster-frame-height="1350"
        data-poster-frame-aspect="0.8" style="position:relative;width:320px;aspect-ratio:4/5">
        <h1 id="claim" data-poster-region="claim"
          style="position:absolute;left:20px;top:20px;margin:0;font:20px monospace">Overlap test</h1>
        <span style="position:absolute;left:135px;top:20px;font:20px monospace">Overlap test</span>
        <span data-poster-region="proof" style="position:absolute;left:20px;top:100px">Proof</span>
        <footer data-poster-region="source" style="position:absolute;left:20px;top:300px">Source</footer>
      </main>
    </body></html>`);
    const audit = spawnSync(process.execPath, [
      join(root, 'scripts/audit-human-factors.mjs'),
      htmlPath,
      '--viewports=desktop'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.notEqual(audit.status, 0, audit.stdout);
    const result = JSON.parse(audit.stdout);
    const collision = result.observations[0].checks.find(
      (check) => check.id === 'surface-collisions'
    );
    assert.equal(collision?.passed, false);
    assert.match(JSON.stringify(collision.evidence), /Overlap test/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('human-factor audit rejects PPT text outside its slide and over its footer', () => {
  const directory = mkdtempSync(join(tmpdir(), 'design-human-ppt-bounds-'));
  const htmlPath = join(directory, 'index.html');
  try {
    writeFileSync(htmlPath, `<!doctype html>
<html lang="en"><head><style>
  body { margin:0; }
  .slide { position:relative; width:300px; height:180px; overflow:hidden; }
  .overflow { position:absolute; left:12px; top:164px; margin:0; line-height:24px; }
  footer { position:absolute; left:0; right:0; bottom:0; height:20px; }
</style></head><body class="ppt-handoff-static">
<main data-design-id="bounded-ppt" data-artifact-type="ppt-handoff"
  data-primary-preset="executive-strategy" data-style-preset="swiss-deck"
  data-design-profile-digest="${'b'.repeat(64)}"
  data-navigation-mode="external-player" data-reading-pattern="scan-decide-verify"
  data-attention-context="projected" data-usage-frequency="one-off"
  data-input-context="keyboard" data-interaction-intent="navigate"
  data-min-target-size="0" data-human-factors-digest="${'a'.repeat(64)}">
  <section class="slide"><h1>Decision</h1><p class="overflow">Hidden ending</p>
    <footer>Source</footer></section>
</main>
</body></html>`);
    const audit = spawnSync(process.execPath, [
      join(root, 'scripts/audit-human-factors.mjs'),
      htmlPath,
      '--viewports=desktop'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.notEqual(audit.status, 0, audit.stdout);
    const result = JSON.parse(audit.stdout);
    const bounds = result.observations[0].checks.find(
      (check) => check.id === 'ppt-slide-content-bounds'
    );
    assert.equal(bounds?.passed, false);
    assert.match(JSON.stringify(bounds.evidence), /Hidden ending/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('human-factor audit reports checked overlay, projection, and poster-claim gates', () => {
  const directory = mkdtempSync(join(tmpdir(), 'design-human-surface-gates-'));
  try {
    const cases = [
      {
        id: 'legal-overlay',
        expectedStatus: 0,
        expectedCheck: 'surface-collisions',
        expectedEvidence: /"allowed_overlays":1/,
        html: `<!doctype html><html lang="en"><body style="margin:0"><main data-design-id="legal-poster"
          data-primary-preset="technical-architecture" data-style-preset="swiss-deck"
          data-design-profile-digest="${'b'.repeat(64)}"
          data-artifact-type="poster" data-navigation-mode="static"
          data-reading-pattern="glance-recognize-explore" data-attention-context="glance"
          data-usage-frequency="one-off" data-input-context="none"
          data-interaction-intent="static" data-min-target-size="0"
          data-human-factors-digest="${'a'.repeat(64)}" data-primary-claim="#claim"
          data-surface-mode="poster-fixed" data-poster-frame-width="1080"
          data-poster-frame-height="1350" data-poster-frame-aspect="0.8"
          style="width:min(100vw,80vh);aspect-ratio:4/5">
          <h1 id="claim" data-poster-region="claim">Primary claim</h1>
          <figure data-poster-region="evidence" data-overlay-scope="legal-caption" style="position:relative;width:240px;height:120px;margin:0">
            <img alt="Evidence" style="width:240px;height:120px"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='120'%3E%3Crect width='240' height='120' fill='black'/%3E%3C/svg%3E">
            <figcaption data-overlay-allow="legal-caption"
              style="position:absolute;left:8px;right:8px;bottom:8px;color:white">Internal use only</figcaption>
          </figure><footer data-poster-region="source">Source</footer></main></body></html>`
      },
      {
        id: 'responsive-ppt',
        expectedStatus: 1,
        expectedCheck: 'ppt-projection-surface',
        expectedEvidence: /responsive-preview/,
        html: `<!doctype html><html lang="en"><body class="ppt-handoff-static"><main
          data-design-id="responsive-ppt" data-primary-preset="executive-strategy"
          data-style-preset="swiss-deck" data-design-profile-digest="${'b'.repeat(64)}"
          data-artifact-type="ppt-handoff" data-navigation-mode="external-player"
          data-reading-pattern="scan-decide-verify" data-attention-context="projected"
          data-usage-frequency="one-off" data-input-context="keyboard"
          data-interaction-intent="navigate" data-min-target-size="0"
          data-human-factors-digest="${'a'.repeat(64)}" data-surface-mode="responsive-preview">
          <section class="slide" style="width:296px;height:320px"><h1>Decision</h1></section>
          </main></body></html>`
      },
      {
        id: 'below-fold-poster-claim',
        expectedStatus: 1,
        expectedCheck: 'poster-primary-claim',
        expectedEvidence: /"fully_visible":false/,
        html: `<!doctype html><html lang="en"><body><main data-design-id="claim-poster"
          data-primary-preset="technical-architecture" data-style-preset="swiss-deck"
          data-design-profile-digest="${'b'.repeat(64)}"
          data-artifact-type="poster" data-navigation-mode="static"
          data-reading-pattern="glance-recognize-explore" data-attention-context="glance"
          data-usage-frequency="one-off" data-input-context="none"
          data-interaction-intent="static" data-min-target-size="0"
          data-human-factors-digest="${'a'.repeat(64)}" data-primary-claim="#claim">
          <div style="height:720px"></div><h1 id="claim">Primary claim</h1>
          </main></body></html>`
      }
    ];
    for (const testCase of cases) {
      const htmlPath = join(directory, `${testCase.id}.html`);
      writeFileSync(htmlPath, testCase.html);
      const audit = spawnSync(process.execPath, [
        join(root, 'scripts/audit-human-factors.mjs'),
        htmlPath,
        '--viewports=small-phone'
      ], { cwd: root, encoding: 'utf8', timeout: 120000 });
      assert.equal(audit.status, testCase.expectedStatus, testCase.id);
      const result = JSON.parse(audit.stdout);
      const check = result.observations[0].checks.find(
        (item) => item.id === testCase.expectedCheck
      );
      assert.ok(check, `${testCase.id}: missing ${testCase.expectedCheck}`);
      assert.match(JSON.stringify(check.evidence), testCase.expectedEvidence, testCase.id);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('human-factor audit rejects cross-viewport poster reflow', () => {
  const directory = mkdtempSync(join(tmpdir(), 'design-human-poster-reflow-'));
  const htmlPath = join(directory, 'index.html');
  try {
    writeFileSync(htmlPath, `<!doctype html><html lang="en"><head><style>
      *{box-sizing:border-box}body{margin:0}.poster{width:min(100vw,80vh);aspect-ratio:4/5}
      .stage{display:grid;grid-template-columns:1fr 1fr;height:70%}
      @media(max-width:500px){.stage{grid-template-columns:1fr;grid-template-rows:1fr 1fr}}
    </style></head><body><main class="poster" data-design-id="reflow-poster"
      data-primary-preset="technical-architecture" data-style-preset="swiss-deck"
      data-design-profile-digest="${'b'.repeat(64)}"
      data-artifact-type="poster" data-navigation-mode="static"
      data-reading-pattern="glance-recognize-explore" data-attention-context="glance"
      data-usage-frequency="one-off" data-input-context="none"
      data-interaction-intent="static" data-min-target-size="0"
      data-human-factors-digest="${'a'.repeat(64)}" data-primary-claim="#claim"
      data-surface-mode="poster-fixed" data-poster-frame-width="1080"
      data-poster-frame-height="1350" data-poster-frame-aspect="0.8">
      <header data-poster-region="meta">Poster</header>
      <section class="stage" data-poster-region="stage">
        <h1 id="claim" data-poster-region="claim">Primary claim</h1>
        <p data-poster-region="proof">Evidence</p>
      </section>
    </main></body></html>`);
    const audit = spawnSync(process.execPath, [
      join(root, 'scripts/audit-human-factors.mjs'),
      htmlPath,
      '--viewports=desktop,small-phone'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.notEqual(audit.status, 0, audit.stdout);
    const result = JSON.parse(audit.stdout);
    const reflow = result.observations[1].checks.find(
      (check) => check.id === 'poster-fixed-composition'
    );
    assert.equal(reflow?.passed, false);
    assert.match(JSON.stringify(reflow.evidence), /changed from/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('materialized Swiss template passes the strict human-factor surface', () => {
  const fixture = createSwissTemplateFixture();
  try {
    const result = spawnSync(process.execPath, [
      join(root, 'scripts/render-smoke.mjs'),
      fixture.htmlPath,
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('PPT handoff exposes static slides and never loads web navigation', async () => {
  const fixture = createSwissTemplateFixture('ppt-handoff');
  const { chromium } = await loadPlaywrightRuntime({ packageRoot: root });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 320, height: 700 }
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      try {
        await page.goto(pathToFileURL(fixture.htmlPath).href);
        assert.equal(await page.locator('[data-design-deck-runtime]').count(), 0);
        assert.equal(await page.locator(
          '.deck-human-controls,.progress-bar,.overview,.notes-overlay'
        ).count(), 0);
        const slides = page.locator('main[data-artifact-type="ppt-handoff"] > .slide');
        assert.equal(await slides.count(), 3);
        for (let index = 0; index < await slides.count(); index += 1) {
          const slide = slides.nth(index);
          const state = await slide.evaluate((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return {
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              width: rect.width,
              height: rect.height
            };
          });
          assert.equal(
            await slide.isVisible(),
            true,
            `slide ${index + 1} hidden at ${viewport.width}px: ${JSON.stringify(state)}`
          );
          assert.notEqual(await slide.evaluate((element) => getComputedStyle(element).opacity), '0');
        }
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true
        );
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.evaluate(() => location.hash), '');
      } finally {
        await context.close();
      }
    }
    const smoke = spawnSync(process.execPath, [
      join(root, 'scripts/render-smoke.mjs'),
      fixture.htmlPath,
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout'
    ], { cwd: root, encoding: 'utf8', timeout: 120000 });
    assert.equal(smoke.status, 0, `${smoke.stdout}\n${smoke.stderr}`);
  } finally {
    await browser.close();
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('representative PPT and Poster artifacts bind their surface-specific habits', async () => {
  const cases = [
    {
      template: 'assets/templates/deck.html',
      artifactType: 'ppt-handoff',
      readerJob: 'executive-decision',
      attention: 'projected',
      input: 'keyboard'
    },
    {
      template: 'assets/templates/poster.html',
      artifactType: 'poster',
      readerJob: 'brand-communication',
      attention: 'glance',
      input: 'none'
    }
  ];
  for (const item of cases) {
    const profile = resolveDesignProfile({
      schema_version: 'design-brief/v1',
      reader_job: item.readerJob,
      primary_relationship: 'decision',
      secondary_relationships: [],
      content_density: 'normal',
      attention_context: item.attention,
      usage_frequency: 'one-off',
      input_context: item.input,
      brand_context: 'none'
    }, item.artifactType, profileAssets);
    const template = readFileSync(join(root, item.template), 'utf8');
    const bound = bindHumanFactorsToHtml(template, profile);
    validateResolvedDesignProfile(profile, item.artifactType, profileAssets);
    assert.match(bound, /data-human-factors-digest="[a-f0-9]{64}"/);
  }

  const { chromium } = await loadPlaywrightRuntime({ packageRoot: root });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 320, height: 700 }
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      try {
        const pptPath = join(root, 'examples/ppt-handoff-pass/index.html');
        await page.goto(pathToFileURL(pptPath).href);
        assert.equal(await page.locator('.deck-human-controls,button,[role="button"]').count(), 0);
        const pptSlides = page.locator('main[data-artifact-type="ppt-handoff"] > .slide');
        assert.equal(await pptSlides.count(), 2);
        for (let index = 0; index < await pptSlides.count(); index += 1) {
          assert.equal(await pptSlides.nth(index).isVisible(), true);
        }
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true
        );

        const posterPath = join(root, 'examples/poster-pass/index.html');
        await page.goto(pathToFileURL(posterPath).href);
        assert.equal(await page.locator('button,[role="button"],[tabindex]').count(), 0);
        assert.equal(await page.locator('main[data-artifact-type="poster"] h1').isVisible(), true);
        const hierarchy = await page.evaluate(() => ({
          heading: Number.parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
          message: Number.parseFloat(getComputedStyle(document.querySelector('.message')).fontSize)
        }));
        assert.ok(hierarchy.heading >= hierarchy.message * 2);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true
        );
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  for (const item of cases) {
    const smokeOutput = mkdtempSync(join(tmpdir(), `design-${item.id}-human-smoke-`));
    try {
      const smoke = spawnSync(process.execPath, [
        join(root, 'scripts/render-smoke.mjs'),
        join(root, 'examples', item.artifactType === 'ppt-handoff'
          ? 'ppt-handoff-pass/index.html'
          : 'poster-pass/index.html'),
        smokeOutput,
        '--viewports=desktop,mobile,small-phone',
        '--strict-layout',
        '--require-human-factors'
      ], { cwd: root, encoding: 'utf8', timeout: 120000 });
      assert.equal(smoke.status, 0, `${item.artifactType}: ${smoke.stdout}\n${smoke.stderr}`);
    } finally {
      rmSync(smokeOutput, { recursive: true, force: true });
    }
  }
});
