import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  validateComponentPilot
} from '../scripts/validate-component-pilots.mjs';

const root = resolve('.');
const pilots = [
  'examples/component-deck-pilot-pass',
  'examples/component-operational-pilot-pass'
];

test('component pilots preserve content and bind admitted components', () => {
  for (const pilot of pilots) {
    const result = validateComponentPilot(join(root, pilot));
    assert.deepEqual(result.errors, [], `${pilot}: ${result.errors.join('; ')}`);
    assert.match(result.evidence.plan_digest, /^[a-f0-9]{64}$/);
    assert.match(result.evidence.artifact_digest, /^[a-f0-9]{64}$/);
    assert.ok(result.evidence.content_entries >= 4);
  }
});

test('component pilot parity fails on visible content drift', () => {
  const source = join(root, pilots[0]);
  const temp = mkdtempSync(join(tmpdir(), 'design-component-pilot-'));
  try {
    for (const file of [
      'baseline.html', 'index.html', 'manifest.json', 'pilot-contract.json',
      'quality-report.md', 'source-notes.txt', 'summary-map.json'
    ]) {
      writeFileSync(join(temp, file), readFileSync(join(source, file)));
    }
    const indexPath = join(temp, 'index.html');
    writeFileSync(
      indexPath,
      readFileSync(indexPath, 'utf8').replace(
        'Evidence follows',
        'Evidence may follow'
      )
    );
    const result = validateComponentPilot(temp);
    assert.ok(result.errors.some((error) => /must match exactly/.test(error)));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
