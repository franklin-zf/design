import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const root = resolve('.');

function packSkill(destination) {
  const result = spawnSync(
    'npm',
    ['pack', '--json', '--pack-destination', destination],
    {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: join(destination, 'npm-cache')
      }
    }
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const records = JSON.parse(result.stdout);
  assert.equal(records.length, 1);
  return join(destination, records[0].filename);
}

test('npm pack output has deterministic parity and rejects mutation, deletion, and addition', async () => {
  const {
    computeSkillIdentity,
    extractNpmTarball,
    validateInstallParity
  } = await import('../scripts/lib/skill-identity.mjs');
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-install-parity-'));
  try {
    const tarball = packSkill(tempRoot);
    const extractRoot = join(tempRoot, 'extract');
    mkdirSync(extractRoot);
    extractNpmTarball(tarball, extractRoot);
    const packedRoot = join(extractRoot, 'package');

    assert.deepEqual(validateInstallParity(root, packedRoot), []);
    assert.deepEqual(computeSkillIdentity(root), computeSkillIdentity(root));
    assert.equal(
      computeSkillIdentity(root).digest,
      computeSkillIdentity(packedRoot).digest
    );

    const mutatedRoot = join(tempRoot, 'mutated');
    cpSync(packedRoot, mutatedRoot, { recursive: true });
    writeFileSync(
      join(mutatedRoot, 'SKILL.md'),
      `${readFileSync(join(mutatedRoot, 'SKILL.md'), 'utf8')}\nmutation\n`
    );
    assert.match(
      validateInstallParity(root, mutatedRoot).join('\n'),
      /hash mismatch.*SKILL\.md/i
    );

    const deletedRoot = join(tempRoot, 'deleted');
    cpSync(packedRoot, deletedRoot, { recursive: true });
    unlinkSync(join(deletedRoot, 'SKILL.md'));
    assert.match(
      validateInstallParity(root, deletedRoot).join('\n'),
      /missing file.*SKILL\.md/i
    );

    const addedRoot = join(tempRoot, 'added');
    cpSync(packedRoot, addedRoot, { recursive: true });
    writeFileSync(join(addedRoot, 'scripts/unexpected.mjs'), 'export {};\n');
    assert.match(
      validateInstallParity(root, addedRoot).join('\n'),
      /unexpected file.*scripts\/unexpected\.mjs/i
    );

    const runtimeRoot = join(tempRoot, 'runtime-node-modules');
    cpSync(packedRoot, runtimeRoot, { recursive: true });
    mkdirSync(join(runtimeRoot, 'node_modules/runtime-only'), { recursive: true });
    writeFileSync(join(runtimeRoot, 'node_modules/runtime-only/index.js'), 'module.exports = {};\n');
    assert.deepEqual(validateInstallParity(root, runtimeRoot), []);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
