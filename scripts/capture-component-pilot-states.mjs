#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
  loadPlaywrightRuntime
} from './lib/playwright-runtime.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const artifactRoot = resolve(
  process.argv[2]
    || join(skillRoot, 'examples/component-operational-pilot-pass')
);
const htmlPath = join(artifactRoot, 'index.html');
const outputRoot = join(artifactRoot, 'qa');
const artifactName = basename(artifactRoot);
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-phone', width: 320, height: 700 }
];

const { chromium } = await loadPlaywrightRuntime({ packageRoot: skillRoot });
const browser = await chromium.launch({ headless: true });
const outputs = [];
try {
  mkdirSync(outputRoot, { recursive: true });
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const remoteRequests = [];
    page.on('request', (request) => {
      if (/^https?:/i.test(request.url())) remoteRequests.push(request.url());
    });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    const control = page.locator(
      '[data-design-component] input[type="checkbox"]'
    ).first();
    await control.focus();
    if (!await page.evaluate(() => (
      document.activeElement?.matches(':focus-visible')
    ))) {
      throw new Error(`${viewport.name} control lacks visible keyboard focus`);
    }
    const focusPath = join(
      outputRoot,
      `${artifactName}-${viewport.name}-focus.png`
    );
    await page.screenshot({ path: focusPath, fullPage: true });
    outputs.push(focusPath);

    await control.press('Space');
    if (!await control.isChecked()) {
      throw new Error(`${viewport.name} control did not enter checked state`);
    }
    if (await page.evaluate(() => document.getAnimations().length) !== 0) {
      throw new Error(`${viewport.name} reduced-motion state is not static`);
    }
    if (remoteRequests.length) {
      throw new Error(
        `${viewport.name} requested remote resources: ${remoteRequests.join(', ')}`
      );
    }
    const checkedPath = join(
      outputRoot,
      `${artifactName}-${viewport.name}-checked.png`
    );
    await page.screenshot({ path: checkedPath, fullPage: true });
    outputs.push(checkedPath);
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`Component pilot state captures passed: ${outputs.join(', ')}`);
