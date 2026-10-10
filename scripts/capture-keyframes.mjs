#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadPlaywrightRuntime } from './lib/playwright-runtime.mjs';

const modulePath = fileURLToPath(import.meta.url);
const requiredRoles = [
  'critical_state',
  'dense_content',
  'first_viewport',
  'narrow_screen'
];

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function option(argv, name) {
  return argv.find((argument) => argument.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
}

export function validateKeyframeSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    return ['keyframe spec must be an object'];
  }
  if (spec.schema_version !== 'design-keyframe-capture-spec/v1') {
    errors.push('schema_version must be design-keyframe-capture-spec/v1');
  }
  if (!Array.isArray(spec.frames) || spec.frames.length !== 4) {
    errors.push('frames must contain exactly four keyframes');
    return errors;
  }
  const roles = spec.frames.map((frame) => frame?.role).sort();
  if (JSON.stringify(roles) !== JSON.stringify(requiredRoles)) {
    errors.push('frames must contain each required keyframe role exactly once');
  }
  const stateIds = new Set();
  for (const [index, frame] of spec.frames.entries()) {
    const prefix = `frames[${index}]`;
    if (!frame || typeof frame !== 'object' || Array.isArray(frame)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (typeof frame.state_id !== 'string' || !frame.state_id.trim()) {
      errors.push(`${prefix}.state_id is required`);
    } else if (stateIds.has(frame.state_id)) {
      errors.push(`${prefix}.state_id must be unique`);
    } else {
      stateIds.add(frame.state_id);
    }
    if (!Number.isInteger(frame.viewport?.width)
        || !Number.isInteger(frame.viewport?.height)
        || frame.viewport.width < 1
        || frame.viewport.height < 1) {
      errors.push(`${prefix}.viewport requires positive integer width and height`);
    }
    if (frame.role === 'narrow_screen' && frame.viewport?.width > 390) {
      errors.push(`${prefix} narrow_screen width must be at most 390`);
    }
    if (!['viewport', 'selector'].includes(frame.capture)) {
      errors.push(`${prefix}.capture must be viewport or selector`);
    }
    if (frame.capture === 'selector'
        && (typeof frame.selector !== 'string' || !frame.selector.trim())) {
      errors.push(`${prefix}.selector is required for selector capture`);
    }
    if (!Array.isArray(frame.setup)) {
      errors.push(`${prefix}.setup must be an array`);
      continue;
    }
    for (const [setupIndex, action] of frame.setup.entries()) {
      const actionPrefix = `${prefix}.setup[${setupIndex}]`;
      if (!['click', 'fill', 'press', 'check'].includes(action?.action)) {
        errors.push(`${actionPrefix}.action is unsupported`);
      }
      if (typeof action?.selector !== 'string' || !action.selector.trim()) {
        errors.push(`${actionPrefix}.selector is required`);
      }
      if (action?.action === 'fill' && typeof action.value !== 'string') {
        errors.push(`${actionPrefix}.value is required for fill`);
      }
      if (action?.action === 'press'
          && (typeof action.key !== 'string' || !action.key.trim())) {
        errors.push(`${actionPrefix}.key is required for press`);
      }
    }
  }
  return errors;
}

async function applySetup(page, setup) {
  for (const action of setup) {
    const target = page.locator(action.selector);
    if (await target.count() !== 1) {
      throw new Error(
        `setup selector must match exactly one element: ${action.selector}`
      );
    }
    if (action.action === 'click') await target.click();
    if (action.action === 'fill') await target.fill(action.value);
    if (action.action === 'press') await target.press(action.key);
    if (action.action === 'check') await target.check();
  }
}

async function captureFrame(page, frame, outputPath) {
  if (frame.capture === 'viewport') {
    await page.screenshot({ path: outputPath, fullPage: false });
    return { ...frame.viewport, unit: 'px' };
  }
  const target = page.locator(frame.selector);
  if (await target.count() !== 1) {
    throw new Error(
      `capture selector must match exactly one element: ${frame.selector}`
    );
  }
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box || box.width < 1 || box.height < 1) {
    throw new Error(`capture selector has no visible geometry: ${frame.selector}`);
  }
  await target.screenshot({ path: outputPath });
  return {
    width: Math.round(box.width),
    height: Math.round(box.height),
    unit: 'px'
  };
}

async function main(argv) {
  const positional = argv.filter((argument) => !argument.startsWith('--'));
  const htmlPath = positional[0] ? resolve(positional[0]) : null;
  const specPath = option(argv, 'spec') ? resolve(option(argv, 'spec')) : null;
  const outputDir = option(argv, 'out') ? resolve(option(argv, 'out')) : null;
  const validateOnly = argv.includes('--validate-only');
  if (positional.length !== 1 || !specPath || (!outputDir && !validateOnly)) {
    throw new Error(
      'Usage: node scripts/capture-keyframes.mjs <index.html> '
      + '--spec=<spec.json> --out=<dir> [--validate-only]'
    );
  }
  if (!existsSync(htmlPath) || !existsSync(specPath)) {
    throw new Error('target HTML and keyframe spec must exist');
  }
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const errors = validateKeyframeSpec(spec);
  if (errors.length) {
    throw new Error(`invalid keyframe spec:\n- ${errors.join('\n- ')}`);
  }
  if (validateOnly) {
    console.log(`Keyframe capture spec validation passed: ${specPath}`);
    return;
  }

  mkdirSync(outputDir, { recursive: true });
  const { chromium } = await loadPlaywrightRuntime();
  const browser = await chromium.launch({ headless: true });
  const frames = [];
  try {
    for (const frame of spec.frames) {
      const page = await browser.newPage({ viewport: frame.viewport });
      try {
        await page.route(/^https?:\/\//u, (route) => route.abort());
        if (spec.reduced_motion !== false) {
          await page.emulateMedia({ reducedMotion: 'reduce' });
        }
        await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts?.ready);
        await applySetup(page, frame.setup);
        const imagePath = resolve(outputDir, `${frame.role}.png`);
        const measuredFrame = await captureFrame(page, frame, imagePath);
        frames.push({
          role: frame.role,
          state_id: frame.state_id,
          image_ref: basename(imagePath),
          image_sha256: sha256File(imagePath),
          frame: measuredFrame
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(
    resolve(outputDir, 'keyframe-capture.json'),
    `${JSON.stringify({
      schema_version: 'design-keyframe-capture/v1',
      source_ref: basename(htmlPath),
      source_sha256: sha256File(htmlPath),
      spec_ref: basename(specPath),
      spec_sha256: sha256File(specPath),
      reduced_motion: spec.reduced_motion !== false,
      frames
    }, null, 2)}\n`
  );
  console.log(`Keyframes captured: ${htmlPath} -> ${outputDir}`);
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(`Keyframe capture failed: ${error.message}`);
    process.exitCode = 1;
  }
}
