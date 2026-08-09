#!/usr/bin/env node
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  computeSkillIdentity,
  extractNpmTarball,
  validateInstallParity
} from './lib/skill-identity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
mkdirSync(distDir, { recursive: true });
const tempRoot = mkdtempSync(join(tmpdir(), 'design-pack-'));

try {
  const result = spawnSync(
    'npm',
    ['pack', '--json', '--pack-destination', tempRoot],
    {
      cwd: root,
      env: {
        ...process.env,
        npm_config_cache: join(tempRoot, 'npm-cache')
      },
      encoding: 'utf8',
      stdio: 'pipe'
    }
  );
  if (result.status !== 0) {
    const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
    throw new Error(`npm pack failed${output ? `:\n${output}` : ''}`);
  }
  const records = JSON.parse(result.stdout);
  if (records.length !== 1 || typeof records[0].filename !== 'string') {
    throw new Error('npm pack did not return exactly one package filename');
  }

  const tarballPath = join(tempRoot, records[0].filename);
  const extractRoot = join(tempRoot, 'extract');
  extractNpmTarball(tarballPath, extractRoot);
  const errors = validateInstallParity(root, join(extractRoot, 'package'));
  if (errors.length) {
    throw new Error(`packed skill parity failed:\n- ${errors.join('\n- ')}`);
  }

  const destinationPath = join(distDir, records[0].filename);
  copyFileSync(tarballPath, destinationPath);
  const identity = computeSkillIdentity(root);
  console.log(`Packed skill validated: ${destinationPath}`);
  console.log(`Skill identity: ${identity.digest} (${identity.entry_count} files)`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
