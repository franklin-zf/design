#!/usr/bin/env node
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPlaywrightRuntime } from './lib/playwright-runtime.mjs';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/tweakable-smoke.mjs <artifact-index.html>');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await loadPlaywrightRuntime());
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const htmlPath = isAbsolute(target) ? target : resolve(process.cwd(), target);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  const required = ['#accent', '#scale', '#density', '#mode', '#reset'];
  for (const selector of required) {
    if ((await page.locator(selector).count()) !== 1) throw new Error(`Missing tweakable control: ${selector}`);
  }
  await page.evaluate(() => localStorage.clear());
  await page.selectOption('#mode', 'dark');
  await page.selectOption('#scale', '1.12');
  await page.selectOption('#density', '.8');
  await page.selectOption('#accent', '#3d7d6b');
  const state = await page.evaluate(() => {
    const root = document.documentElement;
    const key = 'design-tweaks-' + location.pathname;
    return {
      mode: root.dataset.mode,
      accent: root.style.getPropertyValue('--accent').trim(),
      scale: root.style.getPropertyValue('--scale').trim(),
      density: root.style.getPropertyValue('--density').trim(),
      stored: JSON.parse(localStorage.getItem(key) || 'null')
    };
  });
  if (state.mode !== 'dark') throw new Error(`Expected dark mode, got ${state.mode}`);
  if (state.accent !== '#3d7d6b') throw new Error(`Expected accent #3d7d6b, got ${state.accent}`);
  if (state.scale !== '1.12') throw new Error(`Expected scale 1.12, got ${state.scale}`);
  if (state.density !== '.8') throw new Error(`Expected density .8, got ${state.density}`);
  if (!state.stored || state.stored.mode !== 'dark' || state.stored.accent !== '#3d7d6b') {
    throw new Error('Expected tweak state to be persisted in localStorage.');
  }
  await Promise.all([
    page.waitForLoadState('load'),
    page.click('#reset')
  ]);
  const resetState = await page.evaluate(() => {
    const key = 'design-tweaks-' + location.pathname;
    return {
      mode: document.documentElement.dataset.mode,
      stored: JSON.parse(localStorage.getItem(key) || 'null')
    };
  });
  if (resetState.mode !== 'light') throw new Error(`Expected reset to return to light mode, got ${resetState.mode}`);
  if (resetState.stored && resetState.stored.mode !== 'light') {
    throw new Error('Expected reset to remove the prior dark-mode state.');
  }
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);
  console.log(`Tweakable smoke passed: ${target}`);
} finally {
  await browser.close();
}
