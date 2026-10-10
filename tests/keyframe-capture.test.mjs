import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateKeyframeSpec } from '../scripts/capture-keyframes.mjs';

const root = resolve('.');

function spec() {
  return {
    schema_version: 'design-keyframe-capture-spec/v1',
    reduced_motion: true,
    frames: [
      {
        role: 'first_viewport',
        state_id: 'first-default',
        viewport: { width: 1440, height: 900 },
        capture: 'viewport',
        setup: []
      },
      {
        role: 'dense_content',
        state_id: 'dense-default',
        viewport: { width: 1440, height: 900 },
        capture: 'selector',
        selector: '[data-keyframe="dense"]',
        setup: []
      },
      {
        role: 'critical_state',
        state_id: 'critical-selected',
        viewport: { width: 1440, height: 900 },
        capture: 'selector',
        selector: '[data-keyframe="critical"]',
        setup: [{
          action: 'click',
          selector: '[data-action="select"]'
        }]
      },
      {
        role: 'narrow_screen',
        state_id: 'narrow-default',
        viewport: { width: 390, height: 844 },
        capture: 'viewport',
        setup: []
      }
    ]
  };
}

test('keyframe spec requires the four production review roles', () => {
  assert.deepEqual(validateKeyframeSpec(spec()), []);
  const invalid = spec();
  invalid.frames[3].role = 'first_viewport';
  assert.match(
    validateKeyframeSpec(invalid).join('\n'),
    /each required keyframe role exactly once/
  );
});

test('keyframe spec enforces narrow width and bounded setup actions', () => {
  const invalid = spec();
  invalid.frames[3].viewport.width = 480;
  invalid.frames[2].setup[0].action = 'evaluate';
  const output = validateKeyframeSpec(invalid).join('\n');
  assert.match(output, /narrow_screen width must be at most 390/);
  assert.match(output, /action is unsupported/);
});

test('capture-keyframes CLI validates a real spec without launching a browser', () => {
  const directory = mkdtempSync(join(tmpdir(), 'design-keyframe-spec-'));
  try {
    const htmlPath = join(directory, 'index.html');
    const specPath = join(directory, 'keyframes.json');
    writeFileSync(htmlPath, '<main></main>\n');
    writeFileSync(specPath, `${JSON.stringify(spec(), null, 2)}\n`);
    const result = spawnSync(
      process.execPath,
      [
        join(root, 'scripts/capture-keyframes.mjs'),
        htmlPath,
        `--spec=${specPath}`,
        '--validate-only'
      ],
      { cwd: root, encoding: 'utf8' }
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /validation passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
