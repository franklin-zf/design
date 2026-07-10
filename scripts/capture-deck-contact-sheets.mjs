#!/usr/bin/env node
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const artifactArg = process.argv[2];
if (!artifactArg) {
  console.error('Usage: node scripts/capture-deck-contact-sheets.mjs <artifact-dir>');
  process.exit(2);
}

const artifactDir = resolve(artifactArg);
const qaDir = join(artifactDir, 'qa');
const sheets = [
  { html: 'contact-sheet.html', output: 'contact-sheet.png', suffix: '-desktop.png' },
  { html: 'contact-sheet-reduced.html', output: 'contact-sheet-reduced.png', suffix: '-desktop-reduced.png' }
];
const errors = [];
const browser = await chromium.launch({ headless: true });

try {
  for (const sheet of sheets) {
    const htmlPath = join(qaDir, sheet.html);
    const outputPath = join(qaDir, sheet.output);
    if (!existsSync(htmlPath)) {
      errors.push(`Missing contact sheet source: ${sheet.html}`);
      continue;
    }
    const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    const imageStatus = await page.evaluate(async () => {
      const images = [...document.images];
      await Promise.all(images.map((image) => image.decode()));
      return images.map((image) => ({ src: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight }));
    });
    if (imageStatus.length !== 9) errors.push(`${sheet.html} must contain exactly 9 slide images.`);
    for (const image of imageStatus) {
      if (!image.width || !image.height) errors.push(`${sheet.html} has an undecoded image: ${image.src}`);
    }
    await page.screenshot({ path: outputPath, fullPage: true });
    await page.close();

    const sourceTimes = imageStatus.map((image) => statSync(join(qaDir, image.src)).mtimeMs);
    if (sourceTimes.length && statSync(outputPath).mtimeMs < Math.max(...sourceTimes)) {
      errors.push(`${sheet.output} is older than one or more source slide captures.`);
    }
  }
} finally {
  await browser.close();
}

if (errors.length) {
  console.error('Deck contact sheet capture failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Deck contact sheets passed: ${artifactDir}`);
