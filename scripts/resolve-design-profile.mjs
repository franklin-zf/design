#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadDesignProfileAssets,
  resolveDesignProfile
} from './lib/design-profile.mjs';

function parseArgs(argv) {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const artifactTypeArg = argv.find((arg) => arg.startsWith('--artifact-type='));
  const outArg = argv.find((arg) => arg.startsWith('--out='));
  if (positional.length !== 1 || !artifactTypeArg) {
    throw new Error(
      'Usage: node scripts/resolve-design-profile.mjs '
      + '<brief.json> --artifact-type=<ppt-handoff|html-deck|poster> [--out=<path>]'
    );
  }
  return {
    artifactType: artifactTypeArg.slice('--artifact-type='.length),
    briefPath: resolve(positional[0]),
    outPath: outArg ? resolve(outArg.slice('--out='.length)) : null
  };
}

export function run(argv) {
  const args = parseArgs(argv);
  const brief = JSON.parse(readFileSync(args.briefPath, 'utf8'));
  const profile = resolveDesignProfile(brief, args.artifactType, loadDesignProfileAssets());
  const output = `${JSON.stringify(profile, null, 2)}\n`;
  if (args.outPath) {
    mkdirSync(dirname(args.outPath), { recursive: true });
    writeFileSync(args.outPath, output);
    process.stdout.write(`Resolved design profile: ${args.outPath}\n`);
  } else {
    process.stdout.write(output);
  }
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(`Design profile resolution failed: ${error.message}`);
    process.exit(1);
  }
}
