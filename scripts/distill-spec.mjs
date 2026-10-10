#!/usr/bin/env node
// Distill a candidate design-spec record from a delivered artifact or design-system.
// Values (colors / typography / spacing / radius) are extracted deterministically
// from the bound tokens source and cross-checked by validate-design-spec.
// Subjective judgment (why_it_works / tags / signature_move) is NEVER generated:
// the record is emitted as `candidate` and stays so until a reviewer confirms it.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve, basename } from 'node:path';
import { loadDesignTokens } from './lib/design-tokens.mjs';
import { validateRecord } from './validate-design-spec.mjs';

const ARTIFACT_TYPES = new Set([
  'data-report', 'dashboard', 'chart-frame', 'poster', 'html-deck', 'ppt-handoff',
  'screenshot-evidence', 'tweakable-artifact', 'design-system', 'multi-artifact'
]);

const ALLOWED = 'abcdefghijklmnopqrstuvwxyz0123456789';
export function slug(name) {
  let out = '';
  let prevDash = false;
  for (const ch of String(name).toLowerCase()) {
    if (ALLOWED.includes(ch)) { out += ch; prevDash = false; }
    else if (out && !prevDash) { out += '-'; prevDash = true; }
  }
  while (out.startsWith('-')) out = out.slice(1);
  while (out.endsWith('-')) out = out.slice(0, -1);
  return out;
}

function toPosix(p) {
  return p.split('\\').join('/');
}

function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

function readManifest(absDir) {
  const manifestPath = join(absDir, 'manifest.json');
  if (!existsSync(manifestPath)) return {};
  try { return JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { return {}; }
}

// Pure builder: returns the candidate record. Throws Error on missing tokens or
// failed validation. Never writes.
export function buildSpecRecord(absDir, opts = {}) {
  const skillRoot = opts.skillRoot || process.cwd();
  const root = resolve(skillRoot, absDir);
  if (!existsSync(root)) throw new Error(`directory not found: ${absDir}`);
  const relDir = toPosix(relative(skillRoot, root));

  const loaded = loadDesignTokens(root);
  if (!loaded) {
    throw new Error(
      'no bound design tokens found. Provide a design-tokens.json (design-tokens/v1), '
      + 'a tokens.css with :root custom properties, or an index.html with an inline :root block. '
      + 'Refusing to distill without a deterministic token source (no fabricated values).'
    );
  }
  const { tokens } = loaded;
  if (Object.keys(tokens.colors).length === 0) {
    throw new Error('token source yielded no color values; refusing to distill an empty color set.');
  }
  if (Object.keys(tokens.spacing).length === 0) {
    throw new Error(
      'token source has no spacing tokens (e.g. spacing.page/gap/section). Bind a design-tokens.json '
      + 'with spacing before distilling; spacing rhythm is a required design-spec field.'
    );
  }

  const isDesignSystem = loaded.sourceType === 'json' || relDir.startsWith('design-systems/');
  const kind = isDesignSystem ? 'design-system' : 'artifact';
  const manifest = readManifest(root);

  const id = opts.id || `${slug(basename(root))}-${isDesignSystem ? 'system' : 'artifact'}-v1`;
  const artifactType = isDesignSystem
    ? 'design-system'
    : (ARTIFACT_TYPES.has(manifest.artifact_type) ? manifest.artifact_type : 'html-deck');

  const hasSources = Array.isArray(manifest.source_materials) && manifest.source_materials.length > 0;
  const schematic = manifest.schematic === true;
  const riskLane = (!schematic && hasSources) ? 'standard' : 'express';

  const contentSignals = { tags: [] };
  if (manifest.style_preset) contentSignals.tags.push(String(manifest.style_preset));
  const readerJob = manifest.reader_job || (manifest.template_selection && manifest.template_selection.reader_job) || '';
  if (readerJob) contentSignals.reader_job = String(readerJob);

  const digestTarget = existsSync(join(root, 'index.html'))
    ? join(root, 'index.html')
    : (existsSync(join(root, 'manifest.json')) ? join(root, 'manifest.json') : join(root, loaded.tokensFile));

  const tokensRef = toPosix(join(relDir, loaded.tokensFile));
  const ref = relDir.endsWith('/') ? relDir.slice(0, -1) : relDir;

  const record = {
    schema_version: 'design-spec-record/v1',
    id,
    record_type: 'design_spec_record',
    created_at: new Date().toISOString().slice(0, 10),
    classification: {
      project_type: opts.projectType || 'unclassified-pending-review',
      artifact_type: artifactType,
      experience_mode: 'static',
      risk_lane: riskLane,
      content_signals: contentSignals
    },
    source: {
      kind,
      ref,
      tokens_ref: tokensRef,
      artifact_digest: sha256File(digestTarget)
    },
    extracted: {
      colors: tokens.colors,
      typography: tokens.typography,
      spacing: tokens.spacing,
      ...(Object.keys(tokens.radius).length ? { radius: tokens.radius } : {})
    },
    judgment: { status: 'candidate' },
    non_claims: [
      'Auto-distilled candidate record; values are extracted from the bound token source only.',
      'Why-it-works, tags, and signature move are NOT auto-generated and await independent reviewer confirmation.',
      'No real-user validation or business impact is claimed.'
    ]
  };

  const errors = [];
  validateRecord(record, { recordPath: id, skillRoot, errors });
  if (errors.length) throw new Error(`distilled record failed validation:\n- ${errors.join('\n- ')}`);
  return record;
}

// Writes the record and optionally adds it to design-knowledge/registry.json.
export function writeSpecRecord(record, opts = {}) {
  const skillRoot = opts.skillRoot || process.cwd();
  const outRel = opts.outRel || toPosix(join('design-knowledge/spec-records', `${record.id}.json`));
  const outAbs = resolve(skillRoot, outRel);
  if (existsSync(outAbs) && !opts.force) {
    throw new Error(`refusing to overwrite existing record: ${outRel} (use force)`);
  }
  mkdirSync(join(outAbs, '..'), { recursive: true });
  writeFileSync(outAbs, `${JSON.stringify(record, null, 2)}\n`);

  let registered = false;
  if (opts.register !== false) {
    const registryPath = join(skillRoot, 'design-knowledge/registry.json');
    const registry = existsSync(registryPath)
      ? JSON.parse(readFileSync(registryPath, 'utf8'))
      : { schema_version: 'design-knowledge-registry/v1', record_root: 'design-knowledge/spec-records', spec_records: [] };
    registry.spec_records = registry.spec_records || [];
    if (!registry.spec_records.includes(outRel)) registry.spec_records.push(outRel);
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
    console.error('usage: node scripts/distill-spec.mjs <artifact-or-design-system-dir> [--id=] [--project-type=] [--force] [--no-register] [--out=path]');
    process.exit(2);
  }
  let record, written;
  try {
    record = buildSpecRecord(dir, {
      id: flags.id,
      projectType: flags['project-type'],
      skillRoot: process.cwd()
    });
    written = writeSpecRecord(record, {
      force: flags.force === true,
      register: flags['no-register'] !== true,
      outRel: flags.out,
      skillRoot: process.cwd()
    });
  } catch (err) {
    console.error(`distill-spec: ${err.message}`);
    process.exit(3);
  }
  const { outRel, registered } = written;
  console.log(`Distilled candidate spec record: ${outRel}`);
  console.log(`  kind=${record.source.kind} colors=${Object.keys(record.extracted.colors).length} spacing=${Object.keys(record.extracted.spacing).length} judgment=candidate`);
  console.log(`  registry: ${registered ? 'added' : 'skipped'}`);
  console.log('  next: independent reviewer confirms why_it_works/tags/signature_move, then set judgment.status=reviewer_confirmed.');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
