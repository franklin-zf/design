#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-design-output.mjs <artifact-dir>');
  process.exit(2);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(scriptDir, '..');
const errors = [];
const warnings = [];
const requiredFiles = ['index.html', 'manifest.json', 'quality-report.md'];
for (const file of requiredFiles) {
  if (!existsSync(join(dir, file))) errors.push(`Missing required file: ${file}`);
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function normalizeHex(hex) {
  const value = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  if (/^#[0-9a-f]{4}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${value[4]}${value[4]}`;
  }
  return value;
}

function collectHexValues(value, out = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/#[0-9a-f]{3,8}\b/gi)) out.add(normalizeHex(match[0]));
  } else if (Array.isArray(value)) {
    for (const item of value) collectHexValues(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectHexValues(item, out);
  }
  return out;
}

function sourceExists(source) {
  if (typeof source !== 'string') return true;
  return existsSync(source) || existsSync(join(dir, source)) || existsSync(join(process.cwd(), source));
}

const presetsPath = join(skillRoot, 'assets/themes/presets.json');
const presetData = existsSync(presetsPath) ? readJson(presetsPath, 'assets/themes/presets.json') : null;

let manifest = null;
const manifestPath = join(dir, 'manifest.json');
if (existsSync(manifestPath)) {
  manifest = readJson(manifestPath, 'manifest.json');
}

const requiredFields = [
  'schema_version',
  'artifact_type',
  'audience',
  'surface',
  'style_preset',
  'schematic',
  'source_materials',
  'data_sources',
  'metrics',
  'charts',
  'layouts',
  'assumptions',
  'missing_data',
  'unverified_items'
];

const allowedTypes = new Set(['data-report', 'dashboard', 'chart-frame', 'html-deck', 'ppt-handoff', 'screenshot-evidence', 'tweakable-artifact', 'design-system', 'multi-artifact']);
const allowedPresets = new Set(['neutral-analytic', 'editorial-report', 'swiss-deck', 'magazine-deck', 'operational-dashboard', 'tweakable-lab']);
const claimMapRequiredTypes = new Set(['data-report', 'dashboard', 'chart-frame']);
const summaryMapRequiredTypes = new Set(['data-report', 'dashboard', 'chart-frame', 'html-deck', 'ppt-handoff']);
const chartContractTypes = new Set(['data-report', 'dashboard', 'chart-frame']);
const requiredChartFields = ['id', 'family', 'source', 'unit', 'question', 'takeaway', 'grain', 'fields', 'sample_size', 'visual_encoding'];
const requiredEncodingFields = ['mark', 'x', 'y', 'scale_type', 'baseline', 'domain', 'label_policy'];

if (manifest) {
  for (const field of requiredFields) {
    if (!(field in manifest)) errors.push(`manifest.json missing field: ${field}`);
  }
  if (manifest.schema_version !== 'design-artifact/v1') errors.push('manifest.schema_version must be design-artifact/v1.');
  if (!allowedTypes.has(manifest.artifact_type)) errors.push(`Unsupported artifact_type: ${manifest.artifact_type}`);
  if (!allowedPresets.has(manifest.style_preset)) errors.push(`Unsupported style_preset: ${manifest.style_preset}`);
  for (const field of ['source_materials', 'data_sources', 'metrics', 'charts', 'layouts', 'assumptions', 'missing_data', 'unverified_items']) {
    if (field in manifest && !Array.isArray(manifest[field])) errors.push(`manifest.${field} must be an array.`);
  }
  if (manifest.schematic !== true && (!manifest.source_materials || manifest.source_materials.length === 0)) {
    errors.push('Non-schematic artifacts must declare at least one source_material.');
  }
  for (const [idx, source] of (manifest.source_materials || []).entries()) {
    if (!sourceExists(source)) errors.push(`manifest.source_materials[${idx}] is not a readable local source: ${source}`);
  }
  if (manifest.artifact_type === 'screenshot-evidence') {
    if (!manifest.source_materials?.length) errors.push('screenshot-evidence artifacts must declare source screenshots in source_materials.');
    const schematicSource = JSON.stringify(manifest.source_materials).match(/stand-?in|mock|fixture|generated/i);
    if (schematicSource && manifest.schematic !== true) {
      errors.push('screenshot-evidence artifacts using stand-in, mock, fixture, or generated sources must set schematic: true.');
    }
  }
  if (claimMapRequiredTypes.has(manifest.artifact_type) && manifest.schematic !== true && !existsSync(join(dir, 'claim-map.json'))) {
    errors.push(`${manifest.artifact_type} artifacts must include claim-map.json when schematic is false.`);
  }
  if (summaryMapRequiredTypes.has(manifest.artifact_type) && manifest.schematic !== true && !existsSync(join(dir, 'summary-map.json'))) {
    errors.push(`${manifest.artifact_type} artifacts must include summary-map.json when schematic is false.`);
  }
  if (chartContractTypes.has(manifest.artifact_type) && manifest.schematic !== true) {
    if (!manifest.charts?.length) errors.push(`${manifest.artifact_type} artifacts must declare at least one chart in manifest.charts.`);
    for (const [idx, chart] of (manifest.charts || []).entries()) {
      for (const field of requiredChartFields) {
        if (!(field in chart)) errors.push(`manifest.charts[${idx}] missing ${field}.`);
      }
      if ('fields' in chart && (!Array.isArray(chart.fields) || chart.fields.length === 0)) {
        errors.push(`manifest.charts[${idx}].fields must be a non-empty array.`);
      }
      if ('sample_size' in chart && (!Number.isFinite(chart.sample_size) || chart.sample_size < 1)) {
        errors.push(`manifest.charts[${idx}].sample_size must be a positive number.`);
      }
      if (chart.family === 'trend' && Number.isFinite(chart.sample_size) && chart.sample_size < 8) {
        errors.push(`manifest.charts[${idx}] trend charts need at least 8 comparable points or a non-trend fallback.`);
      }
      if (chart.visual_encoding && typeof chart.visual_encoding === 'object') {
        for (const field of requiredEncodingFields) {
          if (!(field in chart.visual_encoding)) errors.push(`manifest.charts[${idx}].visual_encoding missing ${field}.`);
        }
      } else if ('visual_encoding' in chart) {
        errors.push(`manifest.charts[${idx}].visual_encoding must be an object.`);
      }
    }
  }
  if (manifest.artifact_type === 'dashboard' && manifest.schematic !== true) {
    const layouts = new Set(manifest.layouts || []);
    for (const required of ['kpi-strip', 'detail-table']) {
      if (!layouts.has(required)) errors.push(`dashboard artifacts must include ${required} in manifest.layouts.`);
    }
    if ((manifest.charts || []).length < 2) errors.push('dashboard artifacts must declare at least two charts or visual data regions.');
  }
}

const htmlPath = join(dir, 'index.html');
let html = '';
if (existsSync(htmlPath)) {
  html = readFileSync(htmlPath, 'utf8');
  if (!/<!doctype html>/i.test(html)) errors.push('index.html must be a complete HTML document with doctype.');
  if (!/<meta\s+name=["']viewport["']/i.test(html)) errors.push('index.html missing viewport meta.');
  const placeholderRe = /\bTODO\b|\[必填\]|lorem ipsum|placeholder text|sample content|Metric A|Metric B|\{\{[^}]+\}\}|Trend chart region|Driver chart region/i;
  if (placeholderRe.test(html)) errors.push('index.html contains placeholder text, empty chart regions, or unreplaced template tokens.');
  if (!/data-design-id=/.test(html)) warnings.push('index.html has no data-design-id regions.');
  if (manifest && !new RegExp(`data-style-preset=["']${manifest.style_preset}["']`).test(html)) {
    errors.push(`index.html must declare data-style-preset="${manifest.style_preset}" on a visible root container.`);
  }

  const htmlChartIds = [...html.matchAll(/\bdata-chart-id=["']([^"']+)["']/gi)].map((match) => match[1]);
  if (htmlChartIds.length && manifest) {
    const manifestChartIds = new Set((manifest.charts || []).map((chart) => chart.id));
    for (const chartId of htmlChartIds) {
      if (!manifestChartIds.has(chartId)) errors.push(`HTML data-chart-id "${chartId}" has no matching manifest.charts entry.`);
    }
  }
  if (manifest && chartContractTypes.has(manifest.artifact_type) && manifest.schematic !== true) {
    const htmlChartSet = new Set(htmlChartIds);
    for (const chart of manifest.charts || []) {
      if (!htmlChartSet.has(chart.id)) errors.push(`manifest.charts id "${chart.id}" is not rendered by any HTML data-chart-id.`);
      if ((/percent|rate|ratio/i.test(`${chart.unit} ${chart.family} ${chart.question}`)) && !chart.denominator && !JSON.stringify(manifest.missing_data || []).match(/denominator/i)) {
        errors.push(`manifest.charts id "${chart.id}" uses rate/percent semantics and must declare denominator or missing_data.`);
      }
    }
  }
  if (manifest?.artifact_type === 'dashboard' && manifest.schematic !== true && !/<table\b/i.test(html)) {
    errors.push('dashboard artifacts must include a detail table in the default view.');
  }

  if (manifest && manifest.artifact_type !== 'design-system' && presetData?.presets?.[manifest.style_preset]) {
    const allowed = collectHexValues(presetData.presets[manifest.style_preset]);
    collectHexValues(manifest.style_overrides || {}, allowed);
    const used = collectHexValues(html);
    const disallowed = [...used].filter((color) => !allowed.has(color));
    if (disallowed.length) {
      errors.push(`index.html uses colors outside preset ${manifest.style_preset}: ${disallowed.join(', ')}`);
    }
  }
}

if (manifest?.artifact_type === 'html-deck' || manifest?.artifact_type === 'ppt-handoff') {
  const planPath = join(dir, 'slide-plan.json');
  if (!existsSync(planPath)) {
    errors.push('Deck artifacts must include slide-plan.json.');
  } else {
    try {
      const plan = JSON.parse(readFileSync(planPath, 'utf8'));
      if (!Array.isArray(plan.slides) || plan.slides.length === 0) errors.push('slide-plan.json must contain a non-empty slides array.');
      for (const [idx, slide] of (plan.slides || []).entries()) {
        for (const field of ['slide', 'layout_id', 'purpose', 'theme', 'source']) {
          if (!(field in slide)) errors.push(`slide-plan slide ${idx + 1} missing ${field}.`);
        }
      }
    } catch (error) {
      errors.push(`slide-plan.json is invalid JSON: ${error.message}`);
    }
  }

  const slideTags = [...html.matchAll(/<section\b[^>]*class=["'][^"']*\bslide\b[^"']*["'][^>]*>/gi)];
  if (!slideTags.length) errors.push('Deck HTML must contain <section class="slide"> slides.');
  for (const [idx, match] of slideTags.entries()) {
    const tag = match[0];
    if (!/\bdata-layout=["']/.test(tag)) errors.push(`Slide ${idx + 1} missing data-layout.`);
    if (!/\bdata-purpose=["']/.test(tag)) errors.push(`Slide ${idx + 1} missing data-purpose.`);
  }
}

if (manifest?.artifact_type === 'screenshot-evidence') {
  if (!/data-image-slot=/.test(html)) errors.push('screenshot-evidence artifacts must bind images with data-image-slot.');
  if (!/data-screenshot-mode=/.test(html)) errors.push('screenshot-evidence artifacts must declare data-screenshot-mode.');
}

if (manifest?.artifact_type === 'design-system') {
  for (const file of ['DESIGN.md', 'tokens.css']) {
    if (!existsSync(join(dir, file))) errors.push(`design-system artifacts must include ${file}.`);
  }
}

if (manifest?.artifact_type === 'tweakable-artifact') {
  for (const marker of ['data-design-id="tweak-panel"', 'id="accent"', 'id="scale"', 'id="density"', 'id="mode"']) {
    if (!html.includes(marker)) errors.push(`tweakable-artifact missing control marker: ${marker}`);
  }
}

if (manifest?.artifact_type === 'ppt-handoff') {
  const qualityPathForPpt = join(dir, 'quality-report.md');
  if (existsSync(qualityPathForPpt)) {
    const quality = readFileSync(qualityPathForPpt, 'utf8');
    if (!/PPTX Conversion Notes/i.test(quality)) errors.push('ppt-handoff quality-report.md must include PPTX Conversion Notes.');
  }
}

const localImages = [...html.matchAll(/<img\b[^>]*src=["'](?:\.\/)?images\//gi)];
for (const [idx, match] of localImages.entries()) {
  const rest = html.slice(match.index, html.indexOf('>', match.index) + 1);
  if (!/\bdata-image-slot=["']/.test(rest)) errors.push(`Local image ${idx + 1} missing data-image-slot.`);
}

const qualityPath = join(dir, 'quality-report.md');
if (existsSync(qualityPath)) {
  const quality = readFileSync(qualityPath, 'utf8');
  for (const heading of ['## Artifact', '## Sources', '## Assumptions', '## Validation', '## Status', '## Visual QA', '## Data Gaps', '## Remaining Risks']) {
    if (!quality.includes(heading)) errors.push(`quality-report.md missing heading: ${heading}`);
  }
  const statusFields = {
    artifact_status: ['ready', 'partial', 'blocked', 'schematic'],
    claim_assurance: ['local_provenance_only', 'externally_verified', 'unverified', 'schematic'],
    semantic_entailment: ['not_proven', 'manually_reviewed'],
    summary_integrity: ['source_mapped', 'not_applicable', 'not_checked'],
    number_integrity: ['verbatim_checked', 'not_applicable', 'not_checked'],
    plain_language: ['manual_reviewed', 'not_applicable', 'not_checked'],
    visual_qa: ['not_run', 'smoke_passed', 'manual_reviewed', 'blocked'],
    accessibility: ['not_run', 'basic_checked', 'manually_reviewed', 'blocked'],
    'runtime.browser_smoke': ['available', 'missing', 'not_checked', 'not_claimed'],
    'runtime.browser_launch': ['available', 'missing', 'not_checked', 'not_claimed', 'blocked']
  };
  const parsedStatus = {};
  for (const [field, values] of Object.entries(statusFields)) {
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escaped}:\\s*(${values.join('|')})\\s*$`, 'm');
    const match = quality.match(pattern);
    if (!match) {
      errors.push(`quality-report.md missing valid status field: ${field}`);
    } else {
      parsedStatus[field] = match[1];
    }
  }
  if (/TODO|\[必填\]|lorem ipsum/i.test(quality)) errors.push('quality-report.md contains placeholders.');

  if (parsedStatus.artifact_status === 'ready') {
    if (parsedStatus.semantic_entailment !== 'manually_reviewed') {
      errors.push('ready artifacts must set semantic_entailment: manually_reviewed.');
    }
    if (parsedStatus.summary_integrity !== 'source_mapped') {
      errors.push('ready artifacts must set summary_integrity: source_mapped.');
    }
    if (parsedStatus.number_integrity !== 'verbatim_checked') {
      errors.push('ready artifacts must set number_integrity: verbatim_checked.');
    }
    if (parsedStatus.plain_language !== 'manual_reviewed') {
      errors.push('ready artifacts must set plain_language: manual_reviewed.');
    }
    if (!['smoke_passed', 'manual_reviewed'].includes(parsedStatus.visual_qa)) {
      errors.push('ready artifacts must have visual_qa: smoke_passed or manual_reviewed.');
    }
    if (!['basic_checked', 'manually_reviewed'].includes(parsedStatus.accessibility)) {
      errors.push('ready artifacts must have accessibility: basic_checked or manually_reviewed.');
    }
  }

  if (parsedStatus.visual_qa === 'smoke_passed') {
    const qaDir = join(dir, 'qa');
    if (!existsSync(qaDir)) {
      errors.push('visual_qa: smoke_passed requires a qa/ directory with screenshots.');
    } else {
      const qaFiles = readdirSync(qaDir).filter((file) => file.toLowerCase().endsWith('.png'));
      const hasDesktop = qaFiles.some((file) => /desktop/i.test(file));
      const hasMobile = qaFiles.some((file) => /mobile/i.test(file));
      if (!hasDesktop || !hasMobile) {
        errors.push('visual_qa: smoke_passed requires desktop and mobile PNG screenshots in qa/.');
      }
      for (const file of qaFiles) {
        if (statSync(join(qaDir, file)).size === 0) errors.push(`visual QA screenshot is empty: qa/${file}`);
      }
    }
  }

  if (manifest?.schematic === true && parsedStatus.artifact_status === 'ready') {
    errors.push('schematic artifacts should use artifact_status: schematic, not ready.');
  }
}

if (warnings.length) {
  console.warn('Warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error('Design artifact validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Design artifact validation passed: ${dir}`);
