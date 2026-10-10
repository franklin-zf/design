#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadDesignProfileAssets,
  validateResolvedDesignProfile
} from './lib/design-profile.mjs';
import { bindHumanFactorsToHtml } from './lib/human-factors.mjs';

function parseArgs(argv) {
  const input = argv.find((arg) => !arg.startsWith('--'));
  const profileArg = argv.find((arg) => arg.startsWith('--design-profile='));
  const outArg = argv.find((arg) => arg.startsWith('--out='));
  if (!input || !profileArg || !outArg) {
    throw new Error(
      'Usage: node scripts/bind-human-factors.mjs <template.html> '
      + '--design-profile=<profile.json> --out=<index.html>'
    );
  }
  const inputPath = resolve(input);
  const outputPath = resolve(outArg.slice('--out='.length));
  if (inputPath === outputPath) {
    throw new Error('human-factor binding output must not overwrite the input template');
  }
  return {
    inputPath,
    outputPath,
    profilePath: resolve(profileArg.slice('--design-profile='.length))
  };
}

export function run(argv) {
  const args = parseArgs(argv);
  const profile = JSON.parse(readFileSync(args.profilePath, 'utf8'));
  const errors = validateResolvedDesignProfile(
    profile,
    profile?.surface?.artifact_type,
    loadDesignProfileAssets()
  );
  if (errors.length) {
    throw new Error(`design profile is invalid:\n- ${errors.join('\n- ')}`);
  }
  const html = bindHumanFactorsToHtml(
    readFileSync(args.inputPath, 'utf8'),
    profile
  );
  mkdirSync(dirname(args.outputPath), { recursive: true });
  writeFileSync(args.outputPath, html);
  process.stdout.write(`Bound human factors: ${args.outputPath}\n`);
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(`Human-factor binding failed: ${error.message}`);
    process.exit(1);
  }
}
