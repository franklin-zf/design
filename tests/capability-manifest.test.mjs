import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  generateCapabilityManifest
} from '../scripts/generate-capability-manifest.mjs';

test('capability manifest is generated from the current repository', () => {
  const generated = generateCapabilityManifest();
  const current = JSON.parse(readFileSync(
    resolve('docs/skill-inventory/capability-manifest.json'),
    'utf8'
  ));
  assert.deepEqual(current, generated);
  assert.ok(generated.source_digest);
  assert.equal(
    generated.layers[2].packages.find(
      (item) => item.name === 'dribbble-hub-mcp'
    ).mcp_tools.includes('create_inspiration_binding'),
    true
  );
});
