#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const result = JSON.parse(readFileSync(join(root, 'derived/inventory.json'), 'utf8'));

assert.equal(result.slide_count, 9);
assert.equal(result.unique_layout_count, 9);
assert.equal(result.source_backed_slide_count, 9);
for (let index = 1; index < result.visual_weights.length; index += 1) {
  assert.notEqual(result.visual_weights[index], result.visual_weights[index - 1]);
}
