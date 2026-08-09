#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeSkillIdentity, validateInstallParity } from './lib/skill-identity.mjs';

const modulePath = fileURLToPath(import.meta.url);
const defaultSource = resolve(dirname(modulePath), '..');

export function validateCandidateInstall(candidatePath, sourcePath = defaultSource) {
  return validateInstallParity(sourcePath, candidatePath);
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const candidatePath = process.argv[2];
  const sourceArgument = process.argv.find((argument) => argument.startsWith('--source='));
  const sourcePath = sourceArgument ? sourceArgument.slice('--source='.length) : defaultSource;
  if (!candidatePath) {
    console.error('Usage: node scripts/validate-install-parity.mjs <candidate-skill-dir> [--source=<workspace-skill-dir>]');
    process.exit(2);
  }
  const errors = validateCandidateInstall(candidatePath, sourcePath);
  if (errors.length) {
    console.error('Install parity validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  const identity = computeSkillIdentity(sourcePath);
  console.log(`Install parity validation passed: ${identity.digest} (${identity.entry_count} files)`);
}
