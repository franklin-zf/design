#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compileExecutionPlan
} from './compile-execution-plan.mjs';
import {
  loadComponentCatalogue
} from './lib/component-catalogue.mjs';
import {
  computeArtifactDigest
} from './validate-evidence-contract.mjs';
import {
  validateComponentUsage
} from './validate-component-usage.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const templateRegistry = JSON.parse(
  readFileSync(resolve(skillRoot, 'assets/templates/registry.json'), 'utf8')
);
const componentCatalogue = loadComponentCatalogue(
  resolve(skillRoot, 'assets/components/registry.json'),
  resolve(skillRoot, 'schemas/component-catalogue.schema.json')
);

function readJson(path, label, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function normalizeText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function contentSequence(html, label, errors) {
  const matches = [...html.matchAll(
    /<([a-z][a-z0-9-]*)\b([^>]*\bdata-content-id\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*)>([\s\S]*?)<\/\1>/gi
  )];
  const entries = matches.map((match) => ({
    id: match[3] || match[4],
    text: normalizeText(match[5])
  }));
  const ids = entries.map((entry) => entry.id);
  if (entries.length < 4) {
    errors.push(`${label} must expose at least four data-content-id entries`);
  }
  if (new Set(ids).size !== ids.length) {
    errors.push(`${label} data-content-id values must be unique`);
  }
  if (entries.some((entry) => !entry.text)) {
    errors.push(`${label} data-content-id entries must contain text`);
  }
  return entries;
}

function componentMarkers(html) {
  return [...html.matchAll(
    /\bdata-design-component\s*=\s*(?:"([^"]+)"|'([^']+)')/gi
  )].map((match) => match[1] || match[2]);
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function compilePilotPlan(root, manifest, contract) {
  const sourceItems = (manifest.source_materials || []).map((path, index) => {
    const skillPath = resolve(skillRoot, path);
    const artifactPath = resolve(root, path);
    const sourcePath = existsSync(skillPath) ? skillPath : artifactPath;
    return {
      id: `source-${index + 1}`,
      path: relative(skillRoot, sourcePath),
      sha256: sha256File(sourcePath)
    };
  });
  return compileExecutionPlan({
    schema_version: 'design-execution-request/v2',
    goal: contract.reader_job,
    use_scenario: contract.use_scenario,
    audience: [manifest.audience],
    source_materials: sourceItems.length
      ? { mode: 'provided', items: sourceItems }
      : { mode: 'none', claim_scope: 'Controlled component pilot only' },
    output_surface: {
      artifact_dir: relative(skillRoot, root),
      artifact_type: manifest.artifact_type,
      template_id: manifest.template_id,
      component_refs: manifest.component_refs
    },
    constraints: {
      workspace_root: skillRoot,
      changed_paths: [relative(skillRoot, root)],
      sensitive_data: false,
      publication_target: false,
      multi_artifact: false,
      interactive: contract.interactive === true,
      reversible: true,
      internal_only: true,
      direction_known: true
    },
    conditional_policies: {
      derived_data: { mode: 'none' },
      schematic: { enabled: manifest.schematic === true },
      render: {
        viewports: [1440, 390, 320],
        segments: [{ id: 'main', kind: 'selector', selector: 'main' }],
        states: [{
          id: 'default',
          setup: [],
          assertions: [{ kind: 'visible', selector: 'main' }]
        }],
        remote_policy: { mode: 'deny_all', allowed_origins: [] }
      },
      accessibility: { standard: 'WCAG 2.2 AA' },
      privacy: { classification: 'internal' }
    },
    requested_profile: 'standard'
  }, {
    registry: templateRegistry,
    componentCatalogue,
    compilerVersion: 'design-component-pilot/v1',
    shadowMode: true
  });
}

function validateContract(contract, root, errors) {
  const requiredStrings = [
    'schema_version', 'id', 'reader_job', 'use_scenario', 'baseline_html',
    'enhanced_html', 'component_ref', 'rollback'
  ];
  for (const field of requiredStrings) {
    if (typeof contract?.[field] !== 'string' || !contract[field].trim()) {
      errors.push(`pilot-contract.json ${field} must be a non-empty string`);
    }
  }
  if (contract?.schema_version !== 'design-component-pilot/v1') {
    errors.push('pilot-contract.json schema_version must be design-component-pilot/v1');
  }
  for (const field of ['review_tasks', 'parity_fields', 'non_claims']) {
    if (!Array.isArray(contract?.[field]) || contract[field].length === 0) {
      errors.push(`pilot-contract.json ${field} must be a non-empty array`);
    }
  }
  for (const field of ['static_html', 'reduced_motion', 'ppt_handoff']) {
    if (typeof contract?.fallback?.[field] !== 'string'
        || !contract.fallback[field].trim()) {
      errors.push(`pilot-contract.json fallback.${field} is required`);
    }
  }
  for (const field of ['baseline_html', 'enhanced_html']) {
    const value = contract?.[field];
    if (typeof value === 'string' && !existsSync(resolve(root, value))) {
      errors.push(`pilot-contract.json ${field} does not exist: ${value}`);
    }
  }
}

export function validateComponentPilot(directory) {
  const root = resolve(directory);
  const errors = [];
  const manifest = readJson(resolve(root, 'manifest.json'), 'manifest.json', errors);
  const contract = readJson(
    resolve(root, 'pilot-contract.json'),
    'pilot-contract.json',
    errors
  );
  if (!manifest || !contract) return { errors, evidence: null };
  validateContract(contract, root, errors);

  const baselinePath = resolve(root, contract.baseline_html || 'baseline.html');
  const enhancedPath = resolve(root, contract.enhanced_html || 'index.html');
  if (!existsSync(baselinePath) || !existsSync(enhancedPath)) {
    return { errors: [...new Set(errors)].sort(), evidence: null };
  }
  const baselineHtml = readFileSync(baselinePath, 'utf8');
  const enhancedHtml = readFileSync(enhancedPath, 'utf8');
  const baselineContent = contentSequence(baselineHtml, 'baseline.html', errors);
  const enhancedContent = contentSequence(enhancedHtml, 'index.html', errors);
  if (JSON.stringify(baselineContent) !== JSON.stringify(enhancedContent)) {
    errors.push('baseline and enhanced data-content-id text/order must match exactly');
  }

  const markers = componentMarkers(enhancedHtml);
  if (JSON.stringify(markers) !== JSON.stringify([contract.component_ref])) {
    errors.push('enhanced HTML must contain exactly the declared component marker');
  }
  if (componentMarkers(baselineHtml).length) {
    errors.push('baseline HTML must not contain a component marker');
  }
  if (JSON.stringify(manifest.component_refs || [])
      !== JSON.stringify([contract.component_ref])) {
    errors.push('manifest.component_refs must exactly match the pilot component_ref');
  }
  if (!/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(enhancedHtml)) {
    errors.push('enhanced HTML must declare a reduced-motion fallback');
  }
  if (!/@media\s+print/i.test(enhancedHtml)) {
    errors.push('enhanced HTML must declare a print/PPT fallback');
  }
  if (/<script\b/i.test(enhancedHtml)) {
    errors.push('P1 pilot enhanced HTML must not contain scripts');
  }

  let plan = null;
  try {
    plan = compilePilotPlan(root, manifest, contract);
    if (!plan.component_resolution) {
      errors.push('compiler did not emit a component resolution');
    } else {
      const resolution = {
        ...plan.component_resolution,
        plan_digest: plan.plan_id,
        artifact_digest: computeArtifactDigest(root)
      };
      errors.push(...validateComponentUsage({
        artifactRoot: root,
        catalogue: componentCatalogue,
        resolution
      }));
    }
  } catch (error) {
    errors.push(`pilot compiler validation failed: ${error.message}`);
  }

  const evidence = {
    pilot_id: contract.id,
    artifact: basename(root),
    component_ref: contract.component_ref,
    content_entries: enhancedContent.length,
    parity_digest: createHash('sha256')
      .update(JSON.stringify(enhancedContent))
      .digest('hex'),
    artifact_digest: computeArtifactDigest(root),
    plan_digest: plan?.plan_id || null,
    profile: plan?.profile || null,
    component_gate_ids: plan?.component_resolution?.selected?.[0]
      ?.required_gate_ids || []
  };
  return { errors: [...new Set(errors)].sort(), evidence };
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const directories = process.argv.slice(2);
  if (!directories.length) {
    console.error(
      'Usage: node scripts/validate-component-pilots.mjs <artifact-dir> [...]'
    );
    process.exitCode = 2;
  } else {
    const allEvidence = [];
    const allErrors = [];
    for (const directory of directories) {
      const result = validateComponentPilot(directory);
      allEvidence.push(result.evidence);
      allErrors.push(...result.errors.map((error) => `${directory}: ${error}`));
    }
    if (allErrors.length) {
      console.error('Component pilot validation failed:');
      for (const error of allErrors) console.error(`- ${error}`);
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({
        schema_version: 'design-component-pilot-validation/v1',
        status: 'passed',
        pilots: allEvidence
      }, null, 2));
    }
  }
}
