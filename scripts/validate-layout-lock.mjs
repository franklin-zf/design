#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadLayoutRegistry } from './lib/layout-registry.mjs';
import {
  selectedTopologyLayouts,
  validateExecutionPlanBinding
} from './lib/execution-plan-binding.mjs';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-layout-lock.mjs <artifact-dir>');
  process.exit(2);
}

const errors = [];
const executionPlanArg = process.argv.find(
  (arg) => arg.startsWith('--execution-plan=')
);
const allowed = loadLayoutRegistry(
  'assets/templates/layouts/swiss-s01-s22.json'
).ids;

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

const manifest = existsSync(join(dir, 'manifest.json')) ? readJson(join(dir, 'manifest.json'), 'manifest.json') : null;
if (manifest?.aesthetic_contract?.layout_lock !== 'swiss-s01-s22') {
  console.log(`Layout lock validation skipped: ${dir}`);
  process.exit(0);
}

const slidePlan = existsSync(join(dir, 'slide-plan.json')) ? readJson(join(dir, 'slide-plan.json'), 'slide-plan.json') : null;
const html = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
let executionPlan = null;
if (executionPlanArg) {
  executionPlan = readJson(
    executionPlanArg.slice('--execution-plan='.length),
    'execution plan'
  );
  if (executionPlan) {
    errors.push(...validateExecutionPlanBinding(executionPlan, {
      artifactType: manifest?.artifact_type,
      templateId: manifest?.template_id
    }));
  }
}

for (const layout of manifest.layouts || []) {
  if (!allowed.has(layout)) errors.push(`unregistered layout in manifest.layouts: ${layout}`);
}

for (const [index, slide] of (slidePlan?.slides || []).entries()) {
  if (!allowed.has(slide.layout_id)) errors.push(`unregistered layout in slide-plan slide ${index + 1}: ${slide.layout_id}`);
  if (slide.layout_id === 'S22' && slide.slot_contract?.slot !== 's22-hero-21x9') {
    errors.push('S22 requires slot_contract.slot s22-hero-21x9.');
  }
}

const planLayouts = (slidePlan?.slides || []).map((slide) => slide.layout_id);
const htmlLayouts = [...html.matchAll(
  /<section\b[^>]*\bdata-layout=["']([^"']+)["'][^>]*>/gi
)].map((match) => match[1]);
for (const layout of htmlLayouts) {
  if (!allowed.has(layout)) errors.push(`unregistered layout in HTML data-layout: ${layout}`);
}
if (planLayouts.length !== htmlLayouts.length) {
  errors.push(
    `slide-plan and HTML slide counts must match: `
    + `${planLayouts.length} != ${htmlLayouts.length}`
  );
}
for (let index = 0; index < Math.min(planLayouts.length, htmlLayouts.length); index += 1) {
  if (planLayouts[index] !== htmlLayouts[index]) {
    errors.push(
      `slide ${index + 1} layout mismatch: slide-plan ${planLayouts[index]} `
      + `!= HTML ${htmlLayouts[index]}`
    );
  }
}
const uniqueHtmlLayouts = [...new Set(htmlLayouts)];
if (JSON.stringify(manifest?.layouts || []) !== JSON.stringify(uniqueHtmlLayouts)) {
  errors.push(
    'manifest.layouts must equal the first-occurrence layout sequence in HTML'
  );
}

if (executionPlan) {
  const actualLayouts = new Set(htmlLayouts);
  for (const [topologyId, selectedLayouts] of Object.entries(
    selectedTopologyLayouts(executionPlan)
  )) {
    if (![...selectedLayouts].some((layoutId) => actualLayouts.has(layoutId))) {
      errors.push(
        `topology ${topologyId} requires at least one selected layout: `
        + [...selectedLayouts].join(', ')
      );
    }
  }
}

if (errors.length) {
  console.error('Layout lock validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Layout lock validation passed: ${dir}`);
