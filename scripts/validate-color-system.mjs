#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(modulePath), '..');
const textUsages = new Set([
  'body-text',
  'supporting-text',
  'interactive-text',
  'status-text',
  'inverse-text'
]);

function readJson(path, label, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function normalizeHex(value) {
  return typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

function linearChannel(value) {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`invalid six-digit hex color: ${String(hex)}`);
  const channels = [1, 3, 5].map(
    (offset) => linearChannel(Number.parseInt(normalized.slice(offset, offset + 2), 16))
  );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground, background) {
  const values = [
    relativeLuminance(foreground),
    relativeLuminance(background)
  ].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function validateFoundation(contract, colors, label, errors) {
  const surface = normalizeHex(colors.surface);
  if (!surface || contract.foundation === 'mixed') return;
  const luminance = relativeLuminance(surface);
  if (contract.foundation === 'light' && luminance < 0.6) {
    errors.push(`${label} declares a light foundation but surface luminance is ${luminance.toFixed(3)}`);
  }
  if (contract.foundation === 'dark' && luminance > 0.2) {
    errors.push(`${label} declares a dark foundation but surface luminance is ${luminance.toFixed(3)}`);
  }
}

export function validateColorContract(
  contract,
  colors,
  {
    label = 'color contract',
    schema = null
  } = {}
) {
  const errors = [];
  if (schema) {
    errors.push(...validateJsonInstance(schema, contract).map(
      (error) => `${label} ${error}`
    ));
  }
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return errors.length ? errors : [`${label} must be an object`];
  }
  if (!colors || typeof colors !== 'object' || Array.isArray(colors)) {
    return [...errors, `${label} colors must be an object`];
  }

  for (const [role, value] of Object.entries(colors)) {
    if (!normalizeHex(value)) errors.push(`${label} color role ${role} must be a six-digit hex value`);
  }
  validateFoundation(contract, colors, label, errors);

  if (!normalizeHex(colors.accent)) {
    errors.push(`${label} requires an accent color role`);
  }
  if (contract.paradigm === 'operational-state') {
    const accent = normalizeHex(colors.accent);
    for (const role of ['positive', 'negative', 'warning', 'danger']) {
      const semantic = normalizeHex(colors[role]);
      if (accent && semantic && accent === semantic) {
        errors.push(
          `${label} operational accent must remain distinct from semantic role ${role}`
        );
      }
    }
  }
  if (contract.max_focal_hues === 2 && contract.paradigm !== 'subject-led') {
    errors.push(`${label} may declare two focal hues only for subject-led work`);
  }
  if (contract.secondary_accent_mode === 'marker-only'
      && !normalizeHex(colors.accent_2) && !normalizeHex(colors.secondary)) {
    errors.push(`${label} marker-only mode requires accent_2 or secondary`);
  }
  if (['semantic-support', 'bounded-series'].includes(contract.secondary_accent_mode)
      && !normalizeHex(colors.accent_2)
      && !normalizeHex(colors.secondary)
      && !(contract.semantic_exception_roles || []).some((role) => normalizeHex(colors[role]))) {
    errors.push(`${label} ${contract.secondary_accent_mode} mode has no declared supporting color role`);
  }
  for (const role of contract.semantic_exception_roles || []) {
    if (!normalizeHex(colors[role])) {
      errors.push(`${label} semantic exception references missing color role ${role}`);
    }
  }

  const pairKeys = new Set();
  let bodyPairings = 0;
  let supportingPairings = 0;
  let focalPairings = 0;
  for (const pairing of contract.required_pairings || []) {
    const key = `${pairing.foreground}/${pairing.background}/${pairing.usage}`;
    if (pairKeys.has(key)) errors.push(`${label} repeats pairing ${key}`);
    pairKeys.add(key);
    const foreground = normalizeHex(colors[pairing.foreground]);
    const background = normalizeHex(colors[pairing.background]);
    if (!foreground) {
      errors.push(`${label} pairing ${key} references missing foreground role ${pairing.foreground}`);
      continue;
    }
    if (!background) {
      errors.push(`${label} pairing ${key} references missing background role ${pairing.background}`);
      continue;
    }
    const declaredMinimum = Number(pairing.minimum_ratio);
    const usageMinimum = textUsages.has(pairing.usage) ? 4.5 : 3;
    if (declaredMinimum < usageMinimum) {
      errors.push(
        `${label} pairing ${key} declares ${declaredMinimum}:1 below the `
        + `${usageMinimum}:1 floor for ${pairing.usage}`
      );
    }
    const actual = contrastRatio(foreground, background);
    if (actual + 0.005 < declaredMinimum) {
      errors.push(
        `${label} pairing ${key} contrast ${actual.toFixed(2)}:1 `
        + `is below declared ${declaredMinimum}:1`
      );
    }
    if (pairing.usage === 'body-text') bodyPairings += 1;
    if (pairing.usage === 'supporting-text') supportingPairings += 1;
    if (pairing.foreground === 'accent') focalPairings += 1;
  }
  if (bodyPairings === 0) errors.push(`${label} requires a body-text pairing`);
  if (supportingPairings === 0) errors.push(`${label} requires a supporting-text pairing`);
  if (focalPairings === 0) errors.push(`${label} requires a pairing for the primary accent`);
  return errors;
}

function validateStylePresets(root, colorSchema, errors) {
  const styleSchema = readJson(
    join(root, 'schemas/style-presets.schema.json'),
    'style-presets.schema.json',
    errors
  );
  const registry = readJson(
    join(root, 'assets/themes/presets.json'),
    'assets/themes/presets.json',
    errors
  );
  if (!styleSchema || !registry) return;
  errors.push(...validateJsonInstance(styleSchema, registry).map(
    (error) => `assets/themes/presets.json ${error}`
  ));
  for (const [presetId, preset] of Object.entries(registry.presets || {})) {
    const colors = Object.fromEntries(
      Object.entries(preset).filter(([, value]) => Boolean(normalizeHex(value)))
    );
    errors.push(...validateColorContract(
      preset.color_contract,
      colors,
      { label: `style preset ${presetId}`, schema: colorSchema }
    ));
    if (preset.chart_palette?.axis !== preset.muted) {
      errors.push(`style preset ${presetId} chart axis must reuse muted`);
    }
    if (preset.chart_palette?.grid !== preset.line) {
      errors.push(`style preset ${presetId} chart grid must reuse line`);
    }
    if (preset.a11y?.color_alone !== false) {
      errors.push(`style preset ${presetId} must forbid color-only meaning`);
    }
  }
}

function validateDesignSystems(root, colorSchema, errors) {
  const systemsRoot = join(root, 'design-systems');
  if (!existsSync(systemsRoot)) return;
  for (const entry of readdirSync(systemsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name === 'defaults') continue;
    const tokensPath = join(systemsRoot, entry.name, 'design-tokens.json');
    const manifestPath = join(systemsRoot, entry.name, 'manifest.json');
    if (!existsSync(tokensPath) || !existsSync(manifestPath)) continue;
    const tokens = readJson(tokensPath, `${entry.name}/design-tokens.json`, errors);
    const manifest = readJson(manifestPath, `${entry.name}/manifest.json`, errors);
    if (!tokens || !manifest) continue;
    errors.push(...validateColorContract(
      tokens.color_contract,
      tokens.colors,
      { label: `design system ${entry.name}`, schema: colorSchema }
    ));
    if (manifest.contracts?.color_policy !== tokens.color_contract?.paradigm) {
      errors.push(
        `design system ${entry.name} manifest color_policy must match `
        + 'design-tokens color_contract.paradigm'
      );
    }
  }
}

export function validateColorSystemRoot(rootPath = packageRoot) {
  const root = resolve(rootPath);
  const errors = [];
  const colorSchema = readJson(
    join(root, 'schemas/color-contract.schema.json'),
    'color-contract.schema.json',
    errors
  );
  if (!colorSchema) return errors;
  validateStylePresets(root, colorSchema, errors);
  validateDesignSystems(root, colorSchema, errors);
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const root = resolve(process.argv[2] || packageRoot);
  const errors = validateColorSystemRoot(root);
  if (errors.length) {
    console.error('Color system validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('Color system validation passed.');
}
