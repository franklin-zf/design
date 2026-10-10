#!/usr/bin/env node
// Reverse-extract reusable design primitives (atomic color roles, factual color
// pairings, typography roles, spacing scale, radius, structural facts) from a
// design system or artifact bound to design tokens.
//
// Everything emitted is deterministic: every hex / font / spacing / radius value
// is read from the bound tokens source and cross-checked by validatePrimitives.
// Pairings record only that two roles coexist as tokens (basis:
// token-role-cooccurrence) — they do NOT claim the pairing was used in a product.
// Subjective labels (why-it-works, style tags) are never emitted here; they belong
// to reviewer-confirmed design-spec records.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve, basename } from 'node:path';
import { loadDesignTokens } from './lib/design-tokens.mjs';
import { slug } from './distill-spec.mjs';
import { validatePrimitives } from './validate-design-spec.mjs';

const CHROMATIC = new Set(['accent', 'accent_2', 'success', 'warning', 'error', 'brand', 'primary']);
const NEUTRAL = new Set(['surface', 'panel', 'panel_alt', 'text', 'muted', 'line']);
const PX_RE = /^([0-9.]+)px$/;
const ZERO_RE = /^0(?:\.0+)?(?:px|rem|em)?$/;

function toPosix(p) {
  return p.split('\\').join('/');
}

function roleHex(colors, role) {
  const entry = colors[role];
  return entry ? entry.value : null;
}

// Deterministic role-cooccurrence pairings: only when BOTH roles exist as tokens.
function buildPairings(colors) {
  const has = (r) => Boolean(colors[r]);
  const out = [];
  const add = (id, fgRole, bgRole) => {
    const fg = roleHex(colors, fgRole);
    const bg = roleHex(colors, bgRole);
    if (!fg || !bg) return;
    out.push({ id, fg_role: fgRole, bg_role: bgRole, fg, bg, basis: 'token-role-cooccurrence' });
  };
  add('accent-on-surface', 'accent', 'surface');
  add('accent-on-panel', 'accent', 'panel');
  add('marker-on-accent', 'accent_2', 'accent');
  add('text-on-surface', 'text', 'surface');
  add('text-on-panel', 'text', 'panel');
  add('muted-on-surface', 'muted', 'surface');
  add('line-on-surface', 'line', 'surface');
  add('error-on-surface', 'error', 'surface');
  add('success-on-surface', 'success', 'surface');
  return out;
}

function buildSpacingScale(spacing) {
  const entries = Object.entries(spacing).map(([role, value]) => {
    const m = PX_RE.exec(String(value).trim());
    return { role, value: String(value), px: m ? Number(m[1]) : null };
  });
  const px = entries.filter((e) => e.px !== null).sort((a, b) => a.px - b.px);
  const rest = entries.filter((e) => e.px === null);
  return [...px, ...rest];
}

export function buildPrimitives(absDir, opts = {}) {
  const skillRoot = opts.skillRoot || process.cwd();
  const root = resolve(skillRoot, absDir);
  if (!existsSync(root)) throw new Error(`directory not found: ${absDir}`);
  const relDir = toPosix(relative(skillRoot, root)).replace(/\/+$/, '');

  const loaded = loadDesignTokens(root);
  if (!loaded) {
    throw new Error('no bound design tokens found (design-tokens.json, tokens.css :root, or inline :root). Refusing to extract without a deterministic source.');
  }
  const { tokens } = loaded;
  if (Object.keys(tokens.colors).length === 0) throw new Error('token source yielded no color values.');
  if (Object.keys(tokens.spacing).length === 0) throw new Error('token source has no spacing tokens; a spacing scale is required for primitives.');

  const isDesignSystem = loaded.sourceType === 'json' || relDir.startsWith('design-systems/');
  const colors = tokens.colors;
  const roles = Object.keys(colors);
  const radius = tokens.radius;

  const doc = {
    schema_version: 'design-primitives/v1',
    record_type: 'design_primitives',
    id: opts.id || `${slug(basename(root))}-primitives-v1`,
    created_at: new Date().toISOString().slice(0, 10),
    source: {
      kind: isDesignSystem ? 'design-system' : 'artifact',
      ref: relDir,
      tokens_ref: toPosix(join(relDir, loaded.tokensFile)),
      ...(opts.specRecordId ? { spec_record_id: opts.specRecordId } : {})
    },
    status: 'candidate',
    colors: roles.map((role) => ({ role, value: colors[role].value })),
    color_pairings: buildPairings(colors),
    typography: tokens.typography,
    spacing_scale: buildSpacingScale(tokens.spacing),
    radius,
    structural_facts: {
      zero_radius: Object.values(radius).every((v) => ZERO_RE.test(String(v).trim())),
      chromatic_roles: roles.filter((r) => CHROMATIC.has(r)).sort(),
      neutral_roles: roles.filter((r) => NEUTRAL.has(r)).sort()
    },
    non_claims: [
      'Values are extracted literally from the bound token source; no value is invented.',
      'color_pairings record token-role coexistence only, not verified usage in any artifact.',
      'Style tags and why-it-works judgments are NOT extracted; they require reviewer confirmation on a design-spec-record.'
    ]
  };

  const errors = [];
  validatePrimitives(doc, { skillRoot, errors });
  if (errors.length) throw new Error(`primitives failed validation:\n- ${errors.join('\n- ')}`);
  return doc;
}

export function writePrimitives(doc, opts = {}) {
  const skillRoot = opts.skillRoot || process.cwd();
  const outRel = opts.outRel || toPosix(join('design-knowledge/primitives', `${doc.id}.json`));
  const outAbs = resolve(skillRoot, outRel);
  if (existsSync(outAbs) && !opts.force) throw new Error(`refusing to overwrite existing primitives: ${outRel} (use force)`);
  mkdirSync(join(outAbs, '..'), { recursive: true });
  writeFileSync(outAbs, `${JSON.stringify(doc, null, 2)}\n`);

  let registered = false;
  if (opts.register !== false) {
    const registryPath = join(skillRoot, 'design-knowledge/registry.json');
    const registry = existsSync(registryPath)
      ? JSON.parse(readFileSync(registryPath, 'utf8'))
      : { schema_version: 'design-knowledge-registry/v1', spec_records: [], primitives: [] };
    registry.primitives = registry.primitives || [];
    if (!registry.primitives.includes(outRel)) registry.primitives.push(outRel);
    mkdirSync(join(registryPath, '..'), { recursive: true });
    writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
    registered = true;
  }
  return { outRel, registered };
}

function parseArgs(argv) {
  const flags = {};
  const dir = argv[2];
  for (const a of argv.slice(3)) {
    if (a.startsWith('--')) {
      const kv = a.slice(2).split('=');
      flags[kv[0]] = kv.length > 1 ? kv.slice(1).join('=') : true;
    }
  }
  return { dir, flags };
}

function main() {
  const { dir, flags } = parseArgs(process.argv);
  if (!dir) {
    console.error('usage: node scripts/extract-primitives.mjs <design-system-or-artifact-dir> [--id=] [--spec-record-id=] [--force] [--no-register] [--out=path]');
    process.exit(2);
  }
  let doc, written;
  try {
    doc = buildPrimitives(dir, { id: flags.id, specRecordId: flags['spec-record-id'], skillRoot: process.cwd() });
    written = writePrimitives(doc, {
      force: flags.force === true,
      register: flags['no-register'] !== true,
      outRel: flags.out,
      skillRoot: process.cwd()
    });
  } catch (err) {
    console.error(`extract-primitives: ${err.message}`);
    process.exit(3);
  }
  const { outRel, registered } = written;
  console.log(`Extracted primitives: ${outRel}`);
  console.log(`  colors=${doc.colors.length} pairings=${doc.color_pairings.length} spacing=${doc.spacing_scale.length} zero_radius=${doc.structural_facts.zero_radius}`);
  console.log(`  registry: ${registered ? 'added' : 'skipped'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
