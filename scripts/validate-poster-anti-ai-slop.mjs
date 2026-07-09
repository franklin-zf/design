#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-poster-anti-ai-slop.mjs <artifact-dir>');
  process.exit(2);
}

const errors = [];
const html = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
const planText = existsSync(join(dir, 'poster-plan.json')) ? readFileSync(join(dir, 'poster-plan.json'), 'utf8') : '';
const combined = `${html}\n${planText}`;
const aiIndigo = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#8b5cf6', '#7c3aed', '#a855f7'];

function withoutRootBlocks(text) {
  return text.replace(/:root\s*\{[\s\S]*?\}/g, '');
}

const body = withoutRootBlocks(combined).toLowerCase();
for (const hex of aiIndigo) {
  if (body.includes(hex)) errors.push(`anti-ai-slop violation: default AI indigo ${hex} used outside tokens.`);
}

if (/linear-gradient\([^)]*(#6366f1|#4f46e5|#7c3aed|purple|indigo)[^)]*(#06b6d4|#38bdf8|cyan|blue|pink)/i.test(body)) {
  errors.push('anti-ai-slop violation: trust gradient detected.');
}

if (/[✨🚀🎯⚡🔥💡]/u.test(combined)) {
  errors.push('anti-ai-slop violation: emoji icon or poster hook detected.');
}

if (/\b(lorem ipsum|placeholder|sample content|feature one|metric a|metric b)\b/i.test(combined)) {
  errors.push('anti-ai-slop violation: placeholder or filler copy detected.');
}

if (/(赋能|焕新|重塑|颠覆|革新未来|极致体验)/.test(combined)) {
  errors.push('anti-ai-slop violation: inflated poster language detected.');
}

const rawHex = new Set([...body.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0]));
if (rawHex.size > 12) {
  errors.push(`anti-ai-slop violation: too many raw hex values outside tokens (${rawHex.size}).`);
}

if (errors.length) {
  console.error('Poster anti-ai-slop validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Poster anti-ai-slop validation passed: ${dir}`);
