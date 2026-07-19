#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const separator = process.argv.indexOf('--');
if (separator < 0 || separator === process.argv.length - 1) {
  console.error('Usage: node scripts/expect-fail.mjs [--contains=text] [--not-contains=text] -- <command> [args...]');
  process.exit(2);
}

const expected = process.argv
  .slice(2, separator)
  .filter((arg) => arg.startsWith('--contains='))
  .map((arg) => arg.slice('--contains='.length));
const forbidden = process.argv
  .slice(2, separator)
  .filter((arg) => arg.startsWith('--not-contains='))
  .map((arg) => arg.slice('--not-contains='.length));
const [command, ...args] = process.argv.slice(separator + 1);
const result = spawnSync(command, args, {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});

if (result.error) {
  console.error(`Expected command to fail, but it could not run: ${result.error.message}`);
  process.exit(2);
}

if (result.status === 0) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  console.error(`Expected command to fail, but it passed: ${command} ${args.join(' ')}`);
  process.exit(1);
}

const output = `${result.stdout || ''}${result.stderr || ''}`;
for (const text of expected) {
  if (!output.includes(text)) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    console.error(`Expected failing command output to contain "${text}".`);
    process.exit(1);
  }
}

for (const text of forbidden) {
  if (output.includes(text)) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    console.error(`Expected failing command output not to contain "${text}".`);
    process.exit(1);
  }
}

console.log(`Expected failure observed: ${command} ${args.join(' ')}`);
