#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/render-smoke.mjs <artifact-index.html> [output-png-or-dir] [--viewports desktop,mobile] [--strict-layout]');
  process.exit(2);
}

const strictLayout = process.argv.includes('--strict-layout');
const viewportArg = process.argv.find((arg) => arg.startsWith('--viewports='));
const requestedViewports = (viewportArg?.split('=')[1] || 'desktop')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const viewportMap = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 }
};

for (const viewportName of requestedViewports) {
  if (!viewportMap[viewportName]) {
    console.error(`Unknown viewport "${viewportName}". Use desktop,mobile.`);
    process.exit(2);
  }
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed in this environment. Install or provide a host browser smoke tool before claiming visual smoke coverage.');
  process.exit(2);
}

const htmlPath = isAbsolute(target) ? target : resolve(process.cwd(), target);
const outputArg = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null;
const defaultOutputDir = join(dirname(htmlPath), 'qa');
const outputIsFile = outputArg && extname(outputArg).toLowerCase() === '.png';
const outputDir = outputArg && !outputIsFile ? outputArg : defaultOutputDir;

const browser = await chromium.launch();
try {
  const outputs = [];
  for (const viewportName of requestedViewports) {
    const page = await browser.newPage({ viewport: viewportMap[viewportName] });
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    const visibleText = (await page.locator('body').innerText()).trim();
    if (visibleText.length < 8) {
      throw new Error(`${viewportName}: rendered body has too little visible text.`);
    }
    const pageSize = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    }));
    if (pageSize.width < 100 || pageSize.height < 40) {
      throw new Error(`${viewportName}: rendered document is empty or too small.`);
    }
    if (strictLayout) {
      const layoutIssues = await page.evaluate(() => {
        const tolerance = 2;
        const issues = [];
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isDeck = Boolean(document.querySelector('.slide[data-layout], main[data-design-id="html-deck"]'));

        function selectorFor(el) {
          if (el.id) return `#${el.id}`;
          const designId = el.getAttribute('data-design-id');
          if (designId) return `[data-design-id="${designId}"]`;
          const chartId = el.getAttribute('data-chart-id');
          if (chartId) return `[data-chart-id="${chartId}"]`;
          const slot = el.getAttribute('data-image-slot');
          if (slot) return `[data-image-slot="${slot}"]`;
          const tag = el.tagName.toLowerCase();
          const cls = String(el.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
          return cls ? `${tag}.${cls}` : tag;
        }

        function isVisibleRect(rect) {
          return rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
        }

        if (!isDeck && document.documentElement.scrollWidth > viewportWidth + tolerance) {
          issues.push(`document horizontal overflow: scrollWidth=${document.documentElement.scrollWidth}, viewport=${viewportWidth}`);
        }

        const criticalSelector = [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'li', 'th', 'td', 'button', 'label', 'select',
          'img', 'svg', 'canvas', 'table',
          '[data-chart-id]', '[data-image-slot]'
        ].join(',');
        const critical = Array.from(document.querySelectorAll(criticalSelector))
          .filter((el) => {
            const style = getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return isVisibleRect(rect);
          });

        for (const el of critical) {
          const rect = el.getBoundingClientRect();
          if (!isDeck && (rect.left < -tolerance || rect.right > viewportWidth + tolerance)) {
            issues.push(`element outside viewport horizontally: ${selectorFor(el)} left=${Math.round(rect.left)} right=${Math.round(rect.right)} viewport=${viewportWidth}`);
          }
          if (el instanceof HTMLImageElement && (!el.complete || el.naturalWidth === 0)) {
            issues.push(`broken image: ${selectorFor(el)}`);
          }
          const style = getComputedStyle(el);
          const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + tolerance;
          const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY) && el.scrollHeight > el.clientHeight + tolerance;
          if ((clipsX || clipsY) && el.textContent.trim()) {
            issues.push(`possible clipped text: ${selectorFor(el)} scroll=${el.scrollWidth}x${el.scrollHeight} client=${el.clientWidth}x${el.clientHeight}`);
          }
        }

        const textElements = critical
          .filter((el) => el.textContent.trim().length >= 3)
          .filter((el) => !['IMG', 'SVG', 'CANVAS', 'TABLE', 'SELECT'].includes(el.tagName))
          .map((el) => ({ el, rect: el.getBoundingClientRect(), text: el.textContent.trim().slice(0, 32) }))
          .filter((item) => isVisibleRect(item.rect));

        for (let i = 0; i < textElements.length; i += 1) {
          for (let j = i + 1; j < textElements.length; j += 1) {
            const a = textElements[i];
            const b = textElements[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const x = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
            const y = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
            const intersection = x * y;
            if (!intersection) continue;
            const smaller = Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height);
            if (smaller > 0 && intersection / smaller > 0.35) {
              issues.push(`obvious text overlap: ${selectorFor(a.el)} "${a.text}" with ${selectorFor(b.el)} "${b.text}"`);
            }
          }
        }

        return issues.slice(0, 8);
      });
      if (layoutIssues.length) {
        throw new Error(`${viewportName}: strict layout issues: ${layoutIssues.join(' | ')}`);
      }
    }
    if (consoleErrors.length) {
      throw new Error(`${viewportName}: console errors: ${consoleErrors.join(' | ')}`);
    }
    const output = outputIsFile && requestedViewports.length === 1
      ? outputArg
      : join(outputDir, `${basename(dirname(htmlPath))}-${viewportName}.png`);
    mkdirSync(dirname(output), { recursive: true });
    await page.screenshot({ path: output, fullPage: true });
    outputs.push(output);
    await page.close();
  }
  console.log(`Render smoke passed: ${outputs.join(', ')}`);
} finally {
  await browser.close();
}
