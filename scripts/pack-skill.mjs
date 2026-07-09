#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const cacheDir = join(root, '.npm-cache');

mkdirSync(distDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

const result = spawnSync('npm', ['pack', '--pack-destination', distDir], {
  cwd: root,
  env: {
    ...process.env,
    npm_config_cache: cacheDir
  },
  encoding: 'utf8',
  stdio: 'pipe'
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
