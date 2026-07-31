#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { loadPlaywrightRuntime } from './lib/playwright-runtime.mjs';

const modulePath = fileURLToPath(import.meta.url);
const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/render-smoke.mjs <artifact-index.html> [output-png-or-dir] [--viewports=desktop,mobile,small-phone] [--strict-layout] [--spec=<json>] [--profile-out=<json>] [--artifact-digest=<sha256>] [--plan-digest=<sha256>]');
  process.exit(2);
}

const viewportMap = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
  'small-phone': { width: 320, height: 700 }
};
const nameByWidth = new Map(Object.entries(viewportMap).map(([name, value]) => [value.width, name]));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

const strictLayout = process.argv.includes('--strict-layout');
const viewportArg = process.argv.find((arg) => arg.startsWith('--viewports='));
const requestedNames = (viewportArg?.split('=')[1] || 'desktop').split(',').map((name) => name.trim()).filter(Boolean);
for (const name of requestedNames) if (!viewportMap[name]) throw new Error(`Unknown viewport "${name}". Use desktop,mobile,small-phone.`);
const profileOut = process.argv.find((arg) => arg.startsWith('--profile-out='))?.slice('--profile-out='.length);
const specRef = process.argv.find((arg) => arg.startsWith('--spec='))?.slice('--spec='.length);
const artifactDigest = process.argv.find((arg) => arg.startsWith('--artifact-digest='))?.slice('--artifact-digest='.length);
const planDigest = process.argv.find((arg) => arg.startsWith('--plan-digest='))?.slice('--plan-digest='.length);
const digestPattern = /^[a-f0-9]{64}$/;
if (profileOut && (!specRef || !digestPattern.test(artifactDigest || '') || !digestPattern.test(planDigest || ''))) {
  throw new Error('--profile-out requires --spec, --artifact-digest, and --plan-digest.');
}

let renderSpec = null;
if (specRef) {
  renderSpec = JSON.parse(readFileSync(resolve(specRef), 'utf8'));
  const digestPayload = {
    schema_version: renderSpec.schema_version,
    viewports: renderSpec.viewports,
    segments: renderSpec.segments,
    states: renderSpec.states,
    remote_policy: renderSpec.remote_policy
  };
  if (renderSpec.schema_version !== 'design-render-spec/v2' || sha256(stable(digestPayload)) !== renderSpec.spec_digest) throw new Error('render spec digest mismatch');
  if (renderSpec.artifact_digest !== artifactDigest || renderSpec.resolved_plan_digest !== planDigest) throw new Error('render spec artifact/plan digest mismatch');
  const declaredNames = renderSpec.viewports.map((width) => nameByWidth.get(width));
  if (declaredNames.some((name) => !name) || stable([...declaredNames].sort()) !== stable([...requestedNames].sort())) throw new Error('CLI viewports must exactly match render spec viewports');
}

let chromium;
try { ({ chromium } = await loadPlaywrightRuntime()); }
catch (error) { console.error(error.message); process.exit(2); }

const htmlPath = isAbsolute(target) ? target : resolve(process.cwd(), target);
const outputArg = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null;
const defaultOutputDir = join(dirname(htmlPath), 'qa');
const outputIsFile = outputArg && extname(outputArg).toLowerCase() === '.png';
const outputDir = outputArg && !outputIsFile ? outputArg : defaultOutputDir;
const states = renderSpec?.states || [{ id: 'default', setup: [], assertions: [{ kind: 'visible', selector: 'body' }] }];
const segments = renderSpec?.segments || [{ id: 'full', kind: 'scroll_fraction', fraction: 0 }];
const remotePolicy = renderSpec?.remote_policy || { mode: 'deny_all', allowed_origins: [] };

function remoteRequestRecord(request) {
  if (!/^https?:/i.test(request.url())) return null;
  const origin = new URL(request.url()).origin;
  const authorized = remotePolicy.mode === 'allowlist'
    && remotePolicy.allowed_origins.includes(origin);
  return {
    url: request.url(),
    origin,
    method: request.method(),
    resource_type: request.resourceType(),
    authorized,
    blocked_before_send: !authorized
  };
}

async function openGuardedPage(browser, options, allRequests) {
  const context = await browser.newContext(options);
  await context.route('**/*', async (route) => {
    const record = remoteRequestRecord(route.request());
    if (!record) {
      await route.continue();
      return;
    }
    allRequests.set(record.url, record);
    if (record.authorized) await route.continue();
    else await route.abort('blockedbyclient');
  });
  return { context, page: await context.newPage() };
}

function unauthorizedRequests(allRequests) {
  return [...allRequests.values()].filter((request) => !request.authorized);
}

function assertNoUnauthorizedRequests(allRequests, scope) {
  const blocked = unauthorizedRequests(allRequests);
  if (!blocked.length) return;
  const evidence = blocked
    .map((request) => (
      `${request.method} ${request.url} `
      + `resource=${request.resource_type} blocked_before_send=${request.blocked_before_send}`
    ))
    .join(' | ');
  throw new Error(`${scope}: unauthorized remote request blocked before send: ${evidence}`);
}

async function applySetup(page, setup) {
  for (const action of setup || []) {
    if (!action?.selector || !['click', 'fill', 'select', 'check', 'uncheck', 'press', 'wait_for'].includes(action.action)) throw new Error(`unsupported state setup action: ${action?.action}`);
    const locator = page.locator(action.selector);
    if (action.action === 'click') await locator.click();
    if (action.action === 'fill') await locator.fill(String(action.value ?? ''));
    if (action.action === 'select') await locator.selectOption(String(action.value));
    if (action.action === 'check') await locator.check();
    if (action.action === 'uncheck') await locator.uncheck();
    if (action.action === 'press') await locator.press(String(action.value));
    if (action.action === 'wait_for') await locator.waitFor({ state: action.value || 'visible' });
  }
}

async function runAssertions(page, assertions) {
  const results = [];
  for (const assertion of assertions || []) {
    if (!assertion?.selector || !['visible', 'hidden', 'text', 'attribute', 'count'].includes(assertion.kind)) throw new Error(`unsupported render assertion: ${assertion?.kind}`);
    const locator = page.locator(assertion.selector);
    let passed = false;
    let actual;
    if (assertion.kind === 'visible') { actual = await locator.first().isVisible(); passed = actual === true; }
    if (assertion.kind === 'hidden') { actual = await locator.first().isHidden(); passed = actual === true; }
    if (assertion.kind === 'text') { actual = (await locator.first().innerText()).trim(); passed = actual.includes(String(assertion.expected)); }
    if (assertion.kind === 'attribute') { actual = await locator.first().getAttribute(assertion.attribute); passed = actual === String(assertion.expected); }
    if (assertion.kind === 'count') { actual = await locator.count(); passed = actual === Number(assertion.expected); }
    results.push({ ...assertion, actual, passed });
    if (!passed) throw new Error(`render assertion failed for ${assertion.selector}: ${assertion.kind}`);
  }
  return results;
}

async function strictIssues(page) {
  return page.evaluate(() => {
    const tolerance = 2;
    const issues = [];
    const viewportWidth = innerWidth;
    const viewportHeight = innerHeight;
    const isDeck = Boolean(document.querySelector('.slide[data-layout], main[data-design-id="html-deck"]'));

    function selectorFor(element) {
      if (element.id) return `#${element.id}`;
      for (const attribute of ['data-design-id', 'data-chart-id', 'data-image-slot']) {
        const value = element.getAttribute(attribute);
        if (value) return `[${attribute}="${value}"]`;
      }
      const classes = String(element.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
      return classes ? `${element.tagName.toLowerCase()}.${classes}` : element.tagName.toLowerCase();
    }

    function isVisibleRect(rect) {
      return rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
    }

    if (!isDeck && document.documentElement.scrollWidth > viewportWidth + tolerance) {
      issues.push(`document horizontal overflow: scrollWidth=${document.documentElement.scrollWidth}, viewport=${viewportWidth}`);
    }
    const critical = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,th,td,button,label,select,img,svg,canvas,table,[data-chart-id],[data-image-slot]')]
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) !== 0 && isVisibleRect(element.getBoundingClientRect());
      });
    for (const element of critical) {
      const rect = element.getBoundingClientRect();
      if (!isDeck && (rect.left < -tolerance || rect.right > viewportWidth + tolerance)) {
        issues.push(`element outside viewport horizontally: ${selectorFor(element)} left=${Math.round(rect.left)} right=${Math.round(rect.right)} viewport=${viewportWidth}`);
      }
      if (element instanceof HTMLImageElement && (!element.complete || element.naturalWidth === 0)) issues.push(`broken image: ${selectorFor(element)}`);
      const style = getComputedStyle(element);
      const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + tolerance;
      const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + tolerance;
      if ((clipsX || clipsY) && element.textContent.trim()) issues.push(`possible clipped text: ${selectorFor(element)}`);
    }
    const textElements = critical
      .filter((element) => element.textContent.trim().length >= 3)
      .filter((element) => !['IMG', 'SVG', 'CANVAS', 'TABLE', 'SELECT'].includes(element.tagName))
      .map((element) => ({ element, rect: element.getBoundingClientRect(), text: element.textContent.trim().slice(0, 32) }));
    for (let first = 0; first < textElements.length; first += 1) {
      for (let second = first + 1; second < textElements.length; second += 1) {
        const a = textElements[first];
        const b = textElements[second];
        if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
        const x = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
        const y = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
        const intersection = x * y;
        const smaller = Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height);
        if (intersection > 0 && smaller > 0 && intersection / smaller > 0.35) {
          issues.push(`obvious text overlap: ${selectorFor(a.element)} "${a.text}" with ${selectorFor(b.element)} "${b.text}"`);
        }
      }
    }
    return issues.slice(0, 8);
  });
}

async function disclosureEvidence(page) {
  return page.locator('[data-schematic-disclosure]').evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const visible = !element.hidden && element.getAttribute('aria-hidden') !== 'true' && style.display !== 'none'
      && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && element.getClientRects().length > 0;
    return {
      visible,
      text: element.textContent.trim(),
      computed_style: { display: style.display, visibility: style.visibility, opacity: style.opacity },
      geometry: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    };
  }));
}

function normalizeVisibleText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

async function collectMotionEvidence(page) {
  const snapshot = () => page.evaluate(() => document.getAnimations().map((animation) => {
    const target = animation.effect?.target;
    return {
      current_time: Number(animation.currentTime || 0),
      play_state: animation.playState,
      target: target instanceof Element
        ? target.id || target.getAttribute('data-design-id') || target.tagName.toLowerCase()
        : 'unknown'
    };
  }));
  const before = await snapshot();
  await page.waitForTimeout(120);
  const after = await snapshot();
  const active = after.filter((animation, index) => {
    const prior = before[index];
    return animation.play_state === 'running'
      && (!prior || animation.current_time > prior.current_time);
  });
  return {
    sampled_ms: 120,
    observed_animation_count: after.length,
    active_animation_count: active.length,
    active_targets: [...new Set(active.map((animation) => animation.target))].sort()
  };
}

const browser = await chromium.launch();
try {
  const profiles = [];
  const outputs = [];
  for (const viewportName of requestedNames) {
    const viewport = viewportMap[viewportName];
    const profile = { name: viewportName, width: viewport.width, height: viewport.height, strict_success: true, states: [], remote_requests: [], reduced_motion: 'not_run' };
    const allRequests = new Map();
    let defaultTextDigest = null;
    for (const state of states) {
      const { context, page } = await openGuardedPage(
        browser,
        { viewport },
        allRequests
      );
      const consoleErrors = [];
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
      assertNoUnauthorizedRequests(allRequests, `${viewportName}/${state.id}`);
      await applySetup(page, state.setup);
      await page.waitForTimeout(0);
      assertNoUnauthorizedRequests(allRequests, `${viewportName}/${state.id}`);
      const assertions = await runAssertions(page, state.assertions);
      const bodyText = normalizeVisibleText(await page.locator('body').innerText());
      if (bodyText.length < 8) throw new Error(`${viewportName}/${state.id}: rendered body has too little text`);
      const visibleTextDigest = sha256(bodyText);
      if (state.id === 'default' || defaultTextDigest === null) defaultTextDigest = visibleTextDigest;
      const issues = strictLayout ? await strictIssues(page) : [];
      if (issues.length) { profile.strict_success = false; throw new Error(`${viewportName}/${state.id}: strict layout issues: ${issues.join(' | ')}`); }
      if (consoleErrors.length) throw new Error(`${viewportName}/${state.id}: console errors: ${consoleErrors.join(' | ')}`);
      const stateEvidence = {
        id: state.id,
        assertions,
        visible_text_sha256: visibleTextDigest,
        schematic_disclosure: await disclosureEvidence(page),
        segments: []
      };
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      for (const segment of segments) {
        if (segment.kind === 'selector') await page.locator(segment.selector).first().scrollIntoViewIfNeeded();
        else await page.evaluate((fraction) => scrollTo(0, Math.max(0, (document.documentElement.scrollHeight - innerHeight) * fraction)), segment.fraction);
        const output = outputIsFile && requestedNames.length === 1 && states.length === 1 && segments.length === 1
          ? outputArg
          : join(outputDir, renderSpec
            ? `${basename(dirname(htmlPath))}-${viewportName}-${state.id}-${segment.id}.png`
            : `${basename(dirname(htmlPath))}-${viewportName}.png`);
        mkdirSync(dirname(output), { recursive: true });
        await page.screenshot({ path: output, fullPage: !renderSpec });
        const bytes = readFileSync(output);
        stateEvidence.segments.push({
          id: segment.id,
          screenshot_ref: relative(dirname(htmlPath), output).split('\\').join('/'),
          screenshot_sha256: sha256(bytes),
          scroll_y: await page.evaluate(() => scrollY),
          document_height: pageHeight
        });
        outputs.push(output);
      }
      profile.states.push(stateEvidence);
      await context.close();
    }
    profile.remote_requests = [...allRequests.values()].sort((a, b) => a.url.localeCompare(b.url));
    assertNoUnauthorizedRequests(allRequests, viewportName);
    const {
      context: reducedContext,
      page: reducedPage
    } = await openGuardedPage(
      browser,
      { viewport, reducedMotion: 'reduce' },
      allRequests
    );
    const reducedConsoleErrors = [];
    reducedPage.on('console', (message) => {
      if (message.type() === 'error') reducedConsoleErrors.push(message.text());
    });
    await reducedPage.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    assertNoUnauthorizedRequests(allRequests, `${viewportName}/reduced-motion`);
    const preferenceMatches = await reducedPage.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    const reducedTextDigest = sha256(normalizeVisibleText(await reducedPage.locator('body').innerText()));
    const motionEvidence = await collectMotionEvidence(reducedPage);
    const staticTextEquivalent = reducedTextDigest === defaultTextDigest;
    profile.reduced_motion_evidence = {
      preference_matches: preferenceMatches,
      static_text_equivalent: staticTextEquivalent,
      visible_text_sha256: reducedTextDigest,
      ...motionEvidence
    };
    profile.reduced_motion = preferenceMatches
      && staticTextEquivalent
      && motionEvidence.active_animation_count === 0
      && reducedConsoleErrors.length === 0
      ? 'passed'
      : 'failed';
    await reducedContext.close();
    profile.remote_requests = [...allRequests.values()].sort((a, b) => a.url.localeCompare(b.url));
    assertNoUnauthorizedRequests(allRequests, viewportName);
    if (profile.reduced_motion !== 'passed') {
      throw new Error(
        `${viewportName}: reduced-motion behavior failed `
        + `(preference=${preferenceMatches}, static_text_equivalent=${staticTextEquivalent}, `
        + `active_animations=${motionEvidence.active_animation_count}, console_errors=${reducedConsoleErrors.length})`
      );
    }
    profiles.push(profile);
  }
  if (profileOut) {
    const profilePath = isAbsolute(profileOut) ? profileOut : resolve(process.cwd(), profileOut);
    mkdirSync(dirname(profilePath), { recursive: true });
    writeFileSync(profilePath, `${JSON.stringify({
      schema_version: 'design-render-profile/v2',
      artifact_digest: artifactDigest,
      resolved_plan_digest: planDigest,
      render_spec_digest: renderSpec.spec_digest,
      profiles
    }, null, 2)}\n`);
  }
  console.log(`Render smoke passed: ${outputs.join(', ')}`);
} finally {
  await browser.close();
}
