#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || 'examples';
const emptyQaDirs = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name === 'qa' && readdirSync(path).length === 0) {
      emptyQaDirs.push(path);
    }
    walk(path);
  }
}

walk(root);

if (emptyQaDirs.length) {
  console.error('Empty qa directories found:');
  for (const dir of emptyQaDirs) console.error(`- ${dir}`);
  process.exit(1);
}

console.log(`No empty qa directories under ${root}.`);
