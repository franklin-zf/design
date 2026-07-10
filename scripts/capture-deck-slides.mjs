#!/usr/bin/env node
import { mkdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const htmlArg = process.argv[2];
if (!htmlArg) {
  console.error('Usage: node scripts/capture-deck-slides.mjs <index.html> [--reduced-motion]');
  process.exit(2);
}

const htmlPath = resolve(htmlArg);
const artifactDir = dirname(htmlPath);
const qaDir = join(artifactDir, 'qa');
const name = basename(artifactDir);
const reducedMotion = process.argv.includes('--reduced-motion');
const slidePlanPath = join(artifactDir, 'slide-plan.json');
const expectedSlideCount = JSON.parse(readFileSync(slidePlanPath, 'utf8')).slides.length;
const viewports = [
  { name: 'desktop', width: 1440, height: 810 },
  { name: 'mobile', width: 390, height: 844 }
];
const errors = [];

mkdirSync(qaDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    const slideCount = await page.locator('main.deck > .slide').count();
    if (slideCount !== expectedSlideCount) {
      errors.push(`${viewport.name}: canonical slide count ${slideCount} does not match slide-plan ${expectedSlideCount}`);
    }
    for (let index = 1; index <= slideCount; index += 1) {
      await page.evaluate((slide) => {
        window.location.hash = `#/${slide}`;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }, index);
      await page.waitForTimeout(650);
      const issues = await page.evaluate(() => {
        const active = document.querySelector('main.deck > .slide.is-active');
        if (!active) return ['no active slide'];
        const found = [];
        if (active.scrollWidth > active.clientWidth + 2) found.push('horizontal overflow');
        if (active.scrollHeight > active.clientHeight + 2) found.push('vertical overflow');
        const candidates = active.querySelectorAll('h1,h2,h3,h4,p,li,figcaption,strong,.ds-swiss-number');
        for (const element of candidates) {
          const style = getComputedStyle(element);
          if (style.visibility === 'hidden' || style.display === 'none') continue;
          const box = element.getBoundingClientRect();
          if (box.left < -2 || box.right > innerWidth + 2 || box.top < -2 || box.bottom > innerHeight + 2) {
            found.push(`clipped text: ${element.textContent.trim().slice(0, 32)}`);
          }
          if (Number.parseFloat(style.fontSize) < 14) {
            found.push(`text below 14px: ${element.textContent.trim().slice(0, 32)}`);
          }
        }
        return found;
      });
      if (issues.length) errors.push(`${viewport.name} slide ${index}: ${issues.join(' | ')}`);
      const suffix = reducedMotion ? `${viewport.name}-reduced` : viewport.name;
      const output = join(qaDir, `${name}-slide-${String(index).padStart(2, '0')}-${suffix}.png`);
      await page.screenshot({ path: output, fullPage: false });
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (errors.length) {
  console.error('Per-slide capture validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Per-slide captures passed: ${htmlPath}`);
