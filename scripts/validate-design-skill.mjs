#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || '.';
const required = [
  '.gitignore',
  '.npmignore',
  'SKILL.md',
  'agents/openai.yaml',
  'references/workflow.md',
  'references/shape-selection.md',
  'references/input-contract.md',
  'references/output-contract.md',
  'references/content-summary.md',
  'references/source-and-claims-policy.md',
  'references/role-architecture.md',
  'references/aesthetic-principles.md',
  'references/capability-map.md',
  'references/multi-agent-protocol.md',
  'references/data-visualization.md',
  'references/report-dashboard.md',
  'references/deck-ppt.md',
  'references/design-system.md',
  'references/image-design.md',
  'references/style-presets.md',
  'references/screenshot-ui-evidence.md',
  'references/validation.md',
  'references/checklist.md',
  'references/template-library.md',
  'references/template-index.md',
  'schemas/artifact-manifest.schema.json',
  'schemas/deck-plan.schema.json',
  'schemas/chart-spec.schema.json',
  'schemas/claim-map.schema.json',
  'schemas/summary-map.schema.json',
  'assets/templates/report.html',
  'assets/templates/dashboard.html',
  'assets/templates/deck.html',
  'assets/templates/tweakable-artifact.html',
  'assets/templates/registry.json',
  'assets/templates/handoffs/poster-handoff.json',
  'assets/templates/handoffs/designer-handoff.json',
  'assets/templates/handoffs/reviewer-report.json',
  'assets/themes/presets.json',
  'scripts/validate-design-output.mjs',
  'scripts/validate-schemas.mjs',
  'scripts/render-smoke.mjs',
  'scripts/tweakable-smoke.mjs',
  'scripts/capability-preflight.mjs',
  'scripts/validate-claim-map.mjs',
  'scripts/validate-summary-map.mjs',
  'scripts/validate-code-style.mjs',
  'scripts/expect-fail.mjs',
  'scripts/check-empty-qa.mjs'
];

const errors = [];
for (const file of required) {
  if (!existsSync(join(root, file))) errors.push(`Missing required file: ${file}`);
}

const skillPath = join(root, 'SKILL.md');
if (existsSync(skillPath)) {
  const skill = readFileSync(skillPath, 'utf8');
  if (!/^---\nname: design\n/m.test(skill)) errors.push('SKILL.md frontmatter must name the skill design.');
  if (!/description: .{80,}/m.test(skill)) errors.push('SKILL.md description is too short to trigger reliably.');
  if (/\[TODO\]|\[TODO:/.test(skill)) errors.push('SKILL.md still contains TODO placeholders.');
}

const agentPath = join(root, 'agents/openai.yaml');
if (existsSync(agentPath)) {
  const agentConfig = readFileSync(agentPath, 'utf8');
  for (const marker of [
    'interface:',
    'display_name:',
    'short_description:',
    'default_prompt:',
    'policy:',
    'allow_implicit_invocation: true'
  ]) {
    if (!agentConfig.includes(marker)) errors.push(`agents/openai.yaml missing marker: ${marker}`);
  }
  if (!agentConfig.includes('$design')) errors.push('agents/openai.yaml default_prompt must mention $design.');
}

const presetsPath = join(root, 'assets/themes/presets.json');
if (existsSync(presetsPath)) {
  try {
    const presets = JSON.parse(readFileSync(presetsPath, 'utf8'));
    for (const id of ['neutral-analytic', 'editorial-report', 'swiss-deck', 'magazine-deck', 'operational-dashboard', 'tweakable-lab']) {
      if (!presets.presets?.[id]) errors.push(`Missing style preset: ${id}`);
    }
  } catch (error) {
    errors.push(`Invalid presets JSON: ${error.message}`);
  }
}

const templateRegistryPath = join(root, 'assets/templates/registry.json');
if (existsSync(templateRegistryPath)) {
  try {
    const registry = JSON.parse(readFileSync(templateRegistryPath, 'utf8'));
    if (registry.schema_version !== 'design-template-registry/v1') {
      errors.push('assets/templates/registry.json schema_version must be design-template-registry/v1.');
    }
    if (!Array.isArray(registry.templates) || registry.templates.length === 0) {
      errors.push('assets/templates/registry.json must include a non-empty templates array.');
    }
    const ids = new Set();
    for (const [index, entry] of (registry.templates || []).entries()) {
      for (const field of ['id', 'name', 'artifact_types', 'style_presets', 'source', 'best_for', 'avoid_when', 'required_assets', 'validation_gates', 'thinking_ref']) {
        if (!(field in entry)) errors.push(`assets/templates/registry.json templates[${index}] missing ${field}.`);
      }
      if (entry.id) {
        if (ids.has(entry.id)) errors.push(`Duplicate template id: ${entry.id}`);
        ids.add(entry.id);
      }
      if (entry.thinking_ref && !existsSync(join(root, entry.thinking_ref))) {
        errors.push(`Template ${entry.id || index} thinking_ref does not exist: ${entry.thinking_ref}`);
      }
    }
  } catch (error) {
    errors.push(`Invalid template registry JSON: ${error.message}`);
  }
}

if (errors.length) {
  console.error('Design skill validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Design skill validation passed.');
