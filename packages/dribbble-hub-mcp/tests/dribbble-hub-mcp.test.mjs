import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  executeMcpTool,
  MCP_TOOLS_MANIFEST
} from '../src/index.mjs';

function payload(result) {
  return JSON.parse(result.content[0].text);
}

test('Dribbble Hub MCP exposes five read-only tools', () => {
  assert.deepEqual(
    MCP_TOOLS_MANIFEST.map((tool) => tool.name),
    [
      'search_dribbble_references',
      'get_dribbble_reference',
      'list_dribbble_references',
      'get_dribbble_library_status',
      'create_inspiration_binding'
    ]
  );
});

test('MCP registration manifest uses the packaged stdio entrypoint', () => {
  const manifest = JSON.parse(readFileSync(
    resolve('packages/dribbble-hub-mcp/mcp-server.json'),
    'utf8'
  ));
  assert.equal(manifest.transport, 'stdio');
  assert.deepEqual(manifest.args, [
    'bin/dribbble-hub.mjs',
    'serve'
  ]);
  assert.equal(manifest.writes_external_state, false);
  assert.deepEqual(manifest.tools, MCP_TOOLS_MANIFEST.map((tool) => tool.name));
});

test('library status validates the source and preview bindings', async () => {
  const result = await executeMcpTool('get_dribbble_library_status');
  assert.equal(result.isError, false);
  const status = payload(result);
  assert.equal(status.ready, true);
  assert.equal(status.verified_count, 4);
});

test('search returns scene-relevant source-verified references', async () => {
  const result = await executeMcpTool('search_dribbble_references', {
    query: '商家经营工作台',
    limit: 3
  });
  assert.equal(result.isError, false);
  const data = payload(result);
  assert.ok(data.count >= 1);
  assert.equal(data.references[0].id, 'shot_21235669');
  assert.match(data.references[0].source_url, /^https:\/\/dribbble\.com\/shots\//);
});

test('get returns attribution and do-not-copy boundaries', async () => {
  const result = await executeMcpTool('get_dribbble_reference', {
    id: 'shot_27388009'
  });
  assert.equal(result.isError, false);
  const reference = payload(result);
  assert.equal(reference.author, 'George Railean');
  assert.ok(reference.rights.attribution);
  assert.ok(reference.annotation.do_not_copy.length >= 1);
});

test('binding tool emits plan-bound methods and do-not-copy limits', async () => {
  const result = await executeMcpTool('create_inspiration_binding', {
    artifact_type: 'dashboard',
    status: 'applied',
    trigger_reason: 'Open visual direction requires verified reference methods',
    execution_plan_digest: 'a'.repeat(64),
    selected_references: [{
      id: 'shot_27388009',
      role: 'content_topology'
    }]
  });
  assert.equal(result.isError, false);
  const binding = payload(result);
  assert.equal(binding.schema_version, 'design-inspiration-binding/v1');
  assert.equal(binding.selected_references[0].id, 'shot_27388009');
  assert.equal(
    binding.selected_references[0].rights.distribution,
    'metadata-only'
  );
  assert.ok(binding.selected_references[0].extracted_methods.length >= 1);
  assert.ok(binding.selected_references[0].do_not_copy.length >= 1);
});

test('unknown references and tools fail closed', async () => {
  const missing = await executeMcpTool('get_dribbble_reference', {
    id: 'missing'
  });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /not found/);

  const unknown = await executeMcpTool('unknown_tool');
  assert.equal(unknown.isError, true);
  assert.match(unknown.content[0].text, /Unknown tool/);

  const extra = await executeMcpTool('get_dribbble_library_status', {
    unexpected: true
  });
  assert.equal(extra.isError, true);
  assert.match(extra.content[0].text, /unknown tool arguments/);
});
