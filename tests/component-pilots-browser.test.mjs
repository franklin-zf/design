import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import {
  loadPlaywrightRuntime
} from '../scripts/lib/playwright-runtime.mjs';

const root = resolve('.');
const pilotDirectories = [
  join(root, 'examples/component-deck-pilot-pass'),
  join(root, 'examples/component-operational-pilot-pass')
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-phone', width: 320, height: 700 }
];

async function contentEntries(page) {
  return page.locator('[data-content-id]').evaluateAll((elements) => (
    elements.map((element) => ({
      id: element.getAttribute('data-content-id'),
      text: element.textContent.replace(/\s+/g, ' ').trim()
    }))
  ));
}

async function loadPage(browser, path, viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion
  });
  const page = await context.newPage();
  const remoteRequests = [];
  page.on('request', (request) => {
    if (/^https?:/i.test(request.url())) remoteRequests.push(request.url());
  });
  await page.goto(pathToFileURL(path).href, { waitUntil: 'load' });
  return { context, page, remoteRequests };
}

test('component pilots preserve content across responsive and reduced states', async () => {
  const { chromium } = await loadPlaywrightRuntime({ packageRoot: root });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const directory of pilotDirectories) {
      const contract = JSON.parse(
        readFileSync(join(directory, 'pilot-contract.json'), 'utf8')
      );
      for (const viewport of viewports) {
        const baseline = await loadPage(
          browser,
          join(directory, contract.baseline_html),
          viewport
        );
        const enhanced = await loadPage(
          browser,
          join(directory, contract.enhanced_html),
          viewport
        );
        try {
          assert.deepEqual(
            await contentEntries(enhanced.page),
            await contentEntries(baseline.page),
            `${contract.id} ${viewport.name} content parity`
          );
          assert.deepEqual(enhanced.remoteRequests, []);
          const layout = await enhanced.page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            document: document.documentElement.scrollWidth,
            body: document.body.scrollWidth
          }));
          assert.ok(
            layout.document <= layout.viewport + 1
              && layout.body <= layout.viewport + 1,
            `${contract.id} ${viewport.name} horizontal overflow`
          );
        } finally {
          await baseline.context.close();
          await enhanced.context.close();
        }

        const reduced = await loadPage(
          browser,
          join(directory, contract.enhanced_html),
          viewport,
          'reduce'
        );
        try {
          await reduced.page.waitForTimeout(750);
          assert.deepEqual(reduced.remoteRequests, []);
          assert.deepEqual(
            await contentEntries(reduced.page),
            await (async () => {
              const baseline = await loadPage(
                browser,
                join(directory, contract.baseline_html),
                viewport
              );
              try {
                return await contentEntries(baseline.page);
              } finally {
                await baseline.context.close();
              }
            })()
          );
          assert.equal(
            await reduced.page.evaluate(() => document.getAnimations().length),
            0,
            `${contract.id} reduced motion must be static`
          );
        } finally {
          await reduced.context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});

test('deck motion is finite and operational feedback is keyboard operable', async () => {
  const { chromium } = await loadPlaywrightRuntime({ packageRoot: root });
  const browser = await chromium.launch({ headless: true });
  try {
    const deck = await loadPage(
      browser,
      join(pilotDirectories[0], 'index.html'),
      viewports[0]
    );
    try {
      await deck.page.waitForTimeout(80);
      assert.ok(
        await deck.page.evaluate(() => document.getAnimations().length) > 0,
        'deck enhancement must exercise one finite semantic animation'
      );
      await deck.page.waitForTimeout(1600);
      assert.equal(
        await deck.page.evaluate(() => (
          document.getAnimations().filter(
            (animation) => animation.playState === 'running'
          ).length
        )),
        0,
        'deck animation must finish'
      );
    } finally {
      await deck.context.close();
    }

    const operational = await loadPage(
      browser,
      join(pilotDirectories[1], 'index.html'),
      viewports[0]
    );
    try {
      const control = operational.page.locator(
        '[data-design-component] input[type="checkbox"]'
      ).first();
      await control.focus();
      assert.equal(
        await operational.page.evaluate(() => (
          document.activeElement?.matches(':focus-visible')
        )),
        true,
        'operational control must expose visible keyboard focus'
      );
      const before = await control.isChecked();
      await control.press('Space');
      assert.notEqual(await control.isChecked(), before);
      assert.deepEqual(operational.remoteRequests, []);
    } finally {
      await operational.context.close();
    }
  } finally {
    await browser.close();
  }
});
