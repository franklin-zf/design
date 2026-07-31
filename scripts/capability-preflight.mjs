#!/usr/bin/env node
import { loadPlaywrightRuntime } from './lib/playwright-runtime.mjs';
const required = new Set();
const requireArg = process.argv.find((arg) => arg.startsWith('--require='));
if (requireArg) {
  for (const item of requireArg.split('=')[1].split(',')) {
    if (item.trim()) required.add(item.trim());
  }
}
const shouldCheckBrowserLaunch = process.argv.includes('--check-launch') || required.has('browser_launch');

const capabilities = {
  html_artifact: {
    status: 'available',
    evidence: 'This package ships HTML templates and artifact validators.'
  },
  browser_smoke: {
    status: 'missing',
    evidence: 'Playwright Chromium executable not checked yet.'
  },
  browser_launch: {
    status: shouldCheckBrowserLaunch ? 'missing' : 'not_checked',
    evidence: shouldCheckBrowserLaunch
      ? 'Playwright Chromium launch not checked yet.'
      : 'Pass --check-launch or --require=browser_launch to verify actual Chromium launch.'
  },
  native_pptx: {
    status: 'not_claimed',
    evidence: 'Use ppt-handoff unless a native presentation runtime is explicitly available and verified.'
  },
  pdf_export: {
    status: 'not_claimed',
    evidence: 'No PDF export runtime is bundled in this skill.'
  },
  figma: {
    status: 'not_claimed',
    evidence: 'No Figma plugin or auth/runtime adapter is bundled in this skill.'
  },
  live_connector: {
    status: 'not_claimed',
    evidence: 'No live data connector runtime is bundled in this skill.'
  },
  open_design_daemon: {
    status: 'not_claimed',
    evidence: 'No Open Design desktop daemon is bundled in this skill.'
  }
};

try {
  const runtime = await loadPlaywrightRuntime();
  const { chromium, executablePath: executable } = runtime;
  capabilities.browser_smoke = { status: 'available', evidence: runtime.evidence };
  if (shouldCheckBrowserLaunch) {
    let browser = null;
    try {
      browser = await chromium.launch();
      capabilities.browser_launch = { status: 'available', evidence: `Chromium launched successfully from ${executable}` };
    } catch (error) {
      capabilities.browser_launch = { status: 'missing', evidence: `Chromium launch failed from ${executable}: ${error.message}` };
    } finally {
      if (browser) await browser.close();
    }
  }
} catch (error) {
  capabilities.browser_smoke = { status: 'missing', evidence: `Playwright unavailable: ${error.message}` };
  if (shouldCheckBrowserLaunch) {
    capabilities.browser_launch = { status: 'missing', evidence: `Chromium launch unavailable: ${error.message}` };
  }
}

const missingRequired = [];
for (const capability of required) {
  const status = capabilities[capability]?.status;
  if (status !== 'available') missingRequired.push(`${capability}:${status || 'unknown'}`);
}

console.log(JSON.stringify({ schema_version: 'design-capability-preflight/v1', capabilities }, null, 2));

if (missingRequired.length) {
  console.error(`Required capability unavailable: ${missingRequired.join(', ')}`);
  process.exit(1);
}
