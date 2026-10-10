#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const modulePath = fileURLToPath(import.meta.url);

export function migrateLegacyRequest(legacy, options = {}) {
  if (!legacy || legacy.schema_version !== 'design-execution-request/v1') throw new Error('input must be design-execution-request/v1');
  const workspaceRoot = options.workspaceRoot;
  const draft = {
    output_surface: {
      artifact_dir: legacy.artifact_dir,
      artifact_type: legacy.artifact_type,
      template_id: legacy.template_id
    },
    constraints: {
      ...(workspaceRoot ? { workspace_root: workspaceRoot } : {}),
      changed_paths: Array.isArray(legacy.changed_paths) ? legacy.changed_paths : [],
      sensitive_data: legacy.sensitive_data,
      publication_target: legacy.publication_target,
      multi_artifact: legacy.multi_artifact,
      interactive: legacy.interactive,
      reversible: legacy.reversible,
      internal_only: legacy.internal_only,
      direction_known: legacy.direction_known
    },
    requested_profile: legacy.requested_profile
  };
  const missing = ['goal', 'use_scenario', 'audience', 'source_materials', 'conditional_policies'];
  if (!workspaceRoot) missing.push('constraints.workspace_root');
  return {
    schema_version: 'design-execution-request-migration/v1',
    status: 'needs_clarification',
    legacy_request_sha256: createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),
    execution_allowed: false,
    diagnostic: 'Legacy v1 requests are import-only. Complete the missing v2 facts, then compile a new design-execution-request/v2; this migration output is never runnable.',
    missing_fields: missing.sort(),
    v2_request_draft: draft
  };
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
    if (positional.length !== 1) throw new Error('Usage: node scripts/migrate-execution-request-v1.mjs <v1-request.json> [--workspace-root=<abs>] [--out=<json>]');
    const legacy = JSON.parse(readFileSync(resolve(positional[0]), 'utf8'));
    const workspaceRoot = process.argv.find((arg) => arg.startsWith('--workspace-root='))?.slice('--workspace-root='.length);
    const outputValue = migrateLegacyRequest(legacy, { workspaceRoot });
    const output = `${JSON.stringify(outputValue, null, 2)}\n`;
    const out = process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);
    if (out) writeFileSync(resolve(out), output);
    else process.stdout.write(output);
    process.exitCode = 3;
  } catch (error) {
    console.error(`Legacy request migration failed: ${error.message}`);
    process.exitCode = 2;
  }
}
