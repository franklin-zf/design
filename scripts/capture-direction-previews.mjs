#!/usr/bin/env node
// Capture same-size direction previews from real target surfaces. Use two
// independent HTML structures for composition decisions; the legacy CSS mode
// remains available for bounded material or palette comparison.

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  resolve
} from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { loadPlaywrightRuntime } from './lib/playwright-runtime.mjs';

const modulePath = fileURLToPath(import.meta.url);
const target = process.argv[2];
const option = (name) => process.argv.find(
  (arg) => arg.startsWith(`--${name}=`)
)?.slice(name.length + 3);

const variantCssOption = option('variant-css');
const directionBOption = option('direction-b');
if (!target || !option('target') || !option('out')
    || Boolean(variantCssOption) === Boolean(directionBOption)) {
  console.error(
    'Usage: node scripts/capture-direction-previews.mjs <direction-a.html> '
    + '--target=<selector> '
    + '(--direction-b=<direction-b.html> | --variant-css=<file>) --out=<dir> '
    + '[--hash=1 --width=1440 --height=810 --reduced-motion]'
  );
  process.exit(2);
}

const htmlPath = resolve(target);
const directionBPath = directionBOption ? resolve(directionBOption) : null;
const variantCssPath = variantCssOption ? resolve(variantCssOption) : null;
const outputDir = resolve(option('out'));
const selector = option('target');
const hash = option('hash');
const width = Number(option('width') || 1440);
const height = Number(option('height') || 810);
if (!existsSync(htmlPath)
    || (variantCssPath && !existsSync(variantCssPath))
    || (directionBPath && !existsSync(directionBPath))) {
  throw new Error('direction HTML and selected alternative input must exist');
}
if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
  throw new Error('--width and --height must be positive integers');
}

const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const variantCss = variantCssPath ? readFileSync(variantCssPath, 'utf8') : null;
const reducedMotion = process.argv.includes('--reduced-motion');
const { chromium } = await loadPlaywrightRuntime();
mkdirSync(outputDir, { recursive: true });

async function captureSurface(page, outputPath) {
  const surface = page.locator(selector);
  if (await surface.count() !== 1) {
    throw new Error(`--target must match exactly one element: ${selector}`);
  }
  await surface.scrollIntoViewIfNeeded();
  const box = await surface.boundingBox();
  if (!box || box.width < 1 || box.height < 1) {
    throw new Error(`--target has no visible geometry: ${selector}`);
  }
  await surface.screenshot({ path: outputPath });
  return { width: Math.round(box.width), height: Math.round(box.height) };
}

async function loadSurface(page, path) {
  const url = pathToFileURL(path);
  if (hash) url.hash = hash.startsWith('#') ? hash : `/${hash}`;
  await page.goto(url.href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(150);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height } });
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadSurface(page, htmlPath);
  const baselinePath = resolve(outputDir, 'direction-a.png');
  const alternativePath = resolve(outputDir, 'direction-b.png');
  const baselineFrame = await captureSurface(page, baselinePath);
  if (directionBPath) {
    await loadSurface(page, directionBPath);
  } else {
    await page.addStyleTag({ content: variantCss });
    await page.waitForTimeout(150);
  }
  const alternativeFrame = await captureSurface(page, alternativePath);
  if (baselineFrame.width !== alternativeFrame.width
      || baselineFrame.height !== alternativeFrame.height) {
    throw new Error('baseline and alternative previews must have identical frames');
  }
  writeFileSync(
    resolve(outputDir, 'capture-manifest.json'),
    `${JSON.stringify({
      schema_version: directionBPath
        ? 'design-direction-capture/v2'
        : 'design-direction-capture/v1',
      capture_mode: directionBPath ? 'independent-structure' : 'css-variant',
      direction_a_ref: basename(htmlPath),
      direction_a_sha256: sha256File(htmlPath),
      direction_b_ref: directionBPath ? basename(directionBPath) : null,
      direction_b_sha256: directionBPath ? sha256File(directionBPath) : null,
      target_selector: selector,
      hash: hash || null,
      viewport: { width, height },
      reduced_motion: reducedMotion,
      variant_css_ref: variantCssPath ? basename(variantCssPath) : null,
      variant_css_sha256: variantCssPath ? sha256File(variantCssPath) : null,
      frame: { ...baselineFrame, unit: 'px' },
      previews: [
        { id: 'direction-a', ref: 'direction-a.png', sha256: sha256File(baselinePath) },
        { id: 'direction-b', ref: 'direction-b.png', sha256: sha256File(alternativePath) }
      ]
    }, null, 2)}\n`
  );
} finally {
  await browser.close();
}

console.log(`Direction previews captured: ${dirname(htmlPath)} -> ${outputDir}`);
