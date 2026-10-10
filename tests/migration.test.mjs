import assert from 'node:assert/strict';
import { test } from 'node:test';

test('v1 migration is an explicit non-runnable clarification draft', async () => {
  const { migrateLegacyRequest } = await import('../scripts/migrate-execution-request-v1.mjs');
  const result = migrateLegacyRequest({
    schema_version: 'design-execution-request/v1', artifact_dir: 'artifact', artifact_type: 'poster',
    template_id: 'poster-type-led', changed_paths: [], sensitive_data: false,
    publication_target: false, multi_artifact: false, interactive: false, reversible: true,
    internal_only: true, direction_known: true, requested_profile: 'auto'
  }, { workspaceRoot: '/tmp/workspace' });
  assert.equal(result.status, 'needs_clarification');
  assert.equal(result.execution_allowed, false);
  assert.equal(Object.hasOwn(result, 'plan_id'), false);
  assert.ok(result.missing_fields.includes('goal'));
  assert.match(result.diagnostic, /import-only.*never runnable/i);
});
