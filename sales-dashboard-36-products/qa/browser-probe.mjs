#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(join(root, 'index.html')).href;
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }, { name: 'small-phone', width: 320, height: 740 }];
const results = [];
const browser = await chromium.launch();
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const consoleErrors = [];
    const remoteRequests = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('request', (request) => { if (/^https?:/i.test(request.url())) remoteRequests.push(request.url()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    const baseline = await page.locator('#product-table tr').count();
    const metrics = await page.locator('.metric').count();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    const smallTargets = await page.evaluate(() => [...document.querySelectorAll('button, input, select')].filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    }).map((el) => ({ id: el.id, height: Math.round(el.getBoundingClientRect().height), width: Math.round(el.getBoundingClientRect().width) })));
    await page.locator('#search').fill('Cloud');
    const searchRows = await page.locator('#product-table tr').count();
    await page.locator('#region-filter').selectOption('East');
    const filteredRows = await page.locator('#product-table tr').count();
    await page.locator('#reset-filters').click();
    const resetRows = await page.locator('#product-table tr').count();
    results.push({ viewport: viewport.name, width: viewport.width, baseline_rows: baseline, search_cloud_rows: searchRows, east_after_search_rows: filteredRows, reset_rows: resetRows, metric_cards: metrics, document_horizontal_overflow: overflow, small_interactive_targets: smallTargets, console_errors: consoleErrors, remote_requests: remoteRequests });
    await page.close();
  }
} finally {
  await browser.close();
}

const failures = results.flatMap((result) => [
  result.baseline_rows !== 36 ? `${result.viewport}: baseline rows ${result.baseline_rows}` : null,
  result.reset_rows !== 36 ? `${result.viewport}: reset rows ${result.reset_rows}` : null,
  result.metric_cards !== 4 ? `${result.viewport}: metric cards ${result.metric_cards}` : null,
  result.document_horizontal_overflow ? `${result.viewport}: document horizontal overflow` : null,
  result.small_interactive_targets.length ? `${result.viewport}: small targets ${JSON.stringify(result.small_interactive_targets)}` : null,
  result.console_errors.length ? `${result.viewport}: console errors ${result.console_errors.join(' | ')}` : null,
  result.remote_requests.length ? `${result.viewport}: remote requests ${result.remote_requests.join(' | ')}` : null
].filter(Boolean));
const report = { generated_at: new Date().toISOString(), passed: failures.length === 0, results, failures };
writeFileSync(join(root, 'qa/browser-probe.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error('Browser probe failed:', failures.join('; '));
  process.exit(1);
}
console.log(`Browser probe passed: ${join(root, 'qa/browser-probe.json')}`);
