import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Value } from '../compile-execution-plan.mjs';
import {
  loadDesignProfileAssets,
  resolveSelectedTemplate,
  validateResolvedDesignProfile
} from './design-profile.mjs';
import { validateJsonInstance } from './json-schema.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const executionPlanSchema = JSON.parse(readFileSync(
  join(packageRoot, 'schemas/execution-plan.schema.json'),
  'utf8'
));
const templateRegistry = JSON.parse(readFileSync(
  join(packageRoot, 'assets/templates/registry.json'),
  'utf8'
));
const designProfileAssets = loadDesignProfileAssets(packageRoot);
const coreArtifactTypes = new Set(['html-deck', 'ppt-handoff', 'poster']);

export function validateExecutionPlanBinding(
  plan,
  { artifactType = null, templateId = null } = {}
) {
  const errors = validateJsonInstance(executionPlanSchema, plan);
  if (errors.length) return errors.map((error) => `plan schema: ${error}`);
  const payload = Object.fromEntries(Object.entries(plan).filter(
    ([key]) => key !== 'plan_id' && key !== 'resolved_gate_plan_digest'
  ));
  const digest = sha256Value(payload);
  if (plan.plan_id !== digest || plan.resolved_gate_plan_digest !== digest) {
    errors.push('execution plan digest does not match its canonical payload');
  }
  if (artifactType && plan.artifact.artifact_type !== artifactType) {
    errors.push(
      `execution plan artifact type ${plan.artifact.artifact_type} `
      + `does not match artifact type ${artifactType}`
    );
  }
  if (templateId && plan.artifact.template_id !== templateId) {
    errors.push(
      `execution plan template ${plan.artifact.template_id} `
      + `does not match artifact template ${templateId}`
    );
  }
  if (!coreArtifactTypes.has(plan.artifact.artifact_type)) return errors;

  errors.push(...validateResolvedDesignProfile(
    plan.design_profile,
    plan.artifact.artifact_type,
    designProfileAssets
  ));
  if (errors.length) return errors;
  try {
    const expected = resolveSelectedTemplate(
      plan.design_profile,
      templateRegistry,
      plan.artifact.template_id
    );
    if (JSON.stringify(plan.template_resolution) !== JSON.stringify(expected)) {
      errors.push(
        'template_resolution does not match the current profile, template, '
        + 'topology, and layout registries'
      );
    }
  } catch (error) {
    errors.push(`template_resolution cannot be reproduced: ${error.message}`);
  }
  return errors;
}

export function selectedTopologyLayouts(plan) {
  return Object.fromEntries(Object.entries(
    plan?.template_resolution?.selected_topology_layouts || {}
  ).map(([topologyId, layoutIds]) => [topologyId, new Set(layoutIds)]));
}
