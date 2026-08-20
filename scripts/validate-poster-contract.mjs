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
  console.error('Usage: node scripts/validate-poster-contract.mjs <artifact-dir>');
  process.exit(2);
}

const errors = [];
const executionPlanArg = process.argv.find(
  (arg) => arg.startsWith('--execution-plan=')
);
const allowedGoals = new Set(['announcement', 'concept', 'data-hero', 'event', 'product', 'quote', 'campaign']);
const allowedLayouts = loadLayoutRegistry(
  'assets/templates/layouts/poster.json'
).ids;
const allowedImageStrategies = new Set(['real-image', 'generated-image', 'typography-only', 'diagram', 'none']);
const allowedClaimIntegrity = new Set(['source-backed', 'schematic', 'creative']);

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

const manifest = existsSync(join(dir, 'manifest.json')) ? readJson(join(dir, 'manifest.json'), 'manifest.json') : null;
const plan = existsSync(join(dir, 'poster-plan.json')) ? readJson(join(dir, 'poster-plan.json'), 'poster-plan.json') : null;
const html = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
const posterRootTag = html.match(
  /<[^>]*\bdata-poster-id=["'][^"']+["'][^>]*>/i
)?.[0] || '';
const htmlLayout = posterRootTag.match(
  /\bdata-layout=["']([^"']+)["']/i
)?.[1] || null;
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

if (manifest?.artifact_type !== 'poster') {
  errors.push('poster contract requires manifest.artifact_type poster.');
}
if (!plan) {
  errors.push('poster-plan.json is required for poster artifacts.');
} else {
  if (plan.schema_version !== 'design-poster-plan/v1') errors.push('poster-plan schema_version must be design-poster-plan/v1.');
  for (const field of [
    'poster_goal',
    'audience',
    'single_message',
    'visual_hook',
    'layout_lock',
    'design_system',
    'source_materials',
    'image_strategy',
    'claim_integrity',
    'anti_ai_slop_checks'
  ]) {
    if (!(field in plan)) errors.push(`poster-plan missing ${field}.`);
  }
  if (!allowedGoals.has(plan.poster_goal)) errors.push(`poster-plan poster_goal is unsupported: ${plan.poster_goal}`);
  if (!allowedLayouts.has(plan.layout_lock)) errors.push(`poster-plan layout_lock is unsupported: ${plan.layout_lock}`);
  if (!htmlLayout) {
    errors.push('poster HTML root must declare data-layout.');
  } else if (htmlLayout !== plan.layout_lock) {
    errors.push(
      `HTML poster layout ${htmlLayout} must match poster-plan layout_lock `
      + plan.layout_lock
    );
  }
  if (JSON.stringify(manifest?.layouts || [])
      !== JSON.stringify([plan.layout_lock])) {
    errors.push('manifest.layouts must contain exactly poster-plan layout_lock.');
  }
  if (!allowedImageStrategies.has(plan.image_strategy)) errors.push(`poster-plan image_strategy is unsupported: ${plan.image_strategy}`);
  if (!allowedClaimIntegrity.has(plan.claim_integrity)) errors.push(`poster-plan claim_integrity is unsupported: ${plan.claim_integrity}`);
  if (typeof plan.single_message === 'string' && plan.single_message.length > 80) {
    errors.push('poster-plan single_message must stay direct and under 80 characters.');
  }
  if (!Array.isArray(plan.anti_ai_slop_checks) || plan.anti_ai_slop_checks.length === 0) {
    errors.push('poster-plan anti_ai_slop_checks must be non-empty.');
  }
  if (executionPlan) {
    for (const [topologyId, selectedLayouts] of Object.entries(
      selectedTopologyLayouts(executionPlan)
    )) {
      if (!selectedLayouts.has(plan.layout_lock)) {
        errors.push(
          `poster layout ${plan.layout_lock} is incompatible with topology `
          + `${topologyId}; choose one of: ${[...selectedLayouts].join(', ')}`
        );
      }
    }
  }
}

if (!/data-poster-id=/.test(html)) errors.push('poster HTML must include data-poster-id.');
if (!/<h1\b/i.test(html)) errors.push('poster HTML must include one primary h1.');
if ((html.match(/<h1\b/gi) || []).length > 1) errors.push('poster HTML must include only one primary h1.');

if (errors.length) {
  console.error('Poster contract validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Poster contract validation passed: ${dir}`);
