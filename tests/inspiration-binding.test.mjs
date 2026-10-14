import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  createInspirationBinding
} from '../packages/dribbble-hub-mcp/src/index.mjs';
import {
  validateInspirationBinding
} from '../scripts/validate-inspiration-binding.mjs';

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture(status = 'applied') {
  const directory = mkdtempSync(join(tmpdir(), 'inspiration-binding-'));
  const digest = 'a'.repeat(64);
  writeJson(join(directory, 'manifest.json'), {
    artifact_type: 'dashboard'
  });
  const input = {
    artifact_type: 'dashboard',
    status,
    trigger_reason: 'Open visual direction requires verified reference methods',
    execution_plan_digest: digest,
    ...(status === 'applied'
      ? {
          selected_references: [{
            id: 'shot_27388009',
            role: 'content_topology'
          }]
        }
      : {
          skip_reason: 'Existing approved product system controls the direction'
        })
  };
  writeJson(
    join(directory, 'inspiration-binding.json'),
    createInspirationBinding(input)
  );
  const planPath = join(directory, 'execution-plan.json');
  writeJson(planPath, {
    resolved_gate_plan_digest: digest,
    artifact: { artifact_type: 'dashboard' },
    evidence_contract: {
      inspiration_binding_ref: 'inspiration-binding.json'
    }
  });
  return { directory, planPath };
}

test('inspiration binding validates against MCP records and plan', () => {
  const { directory, planPath } = fixture();
  try {
    assert.deepEqual(validateInspirationBinding(directory, {
      executionPlanPath: planPath
    }), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('skipped inspiration requires an explicit reason and no references', () => {
  const { directory, planPath } = fixture('skipped');
  try {
    assert.deepEqual(validateInspirationBinding(directory, {
      executionPlanPath: planPath
    }), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('inspiration binding rejects source, method, and plan drift', () => {
  const { directory, planPath } = fixture();
  try {
    const path = join(directory, 'inspiration-binding.json');
    const binding = JSON.parse(readFileSync(path, 'utf8'));
    binding.execution_plan_digest = 'b'.repeat(64);
    binding.selected_references[0].source_url =
      'https://dribbble.com/shots/99999999-fake';
    binding.selected_references[0].extracted_methods = [
      'invented method not present in the verified record'
    ];
    writeJson(path, binding);
    const output = validateInspirationBinding(directory, {
      executionPlanPath: planPath
    }).join('\n');
    assert.match(output, /execution_plan_digest mismatch/);
    assert.match(output, /source_url drift/);
    assert.match(output, /unverified method/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
