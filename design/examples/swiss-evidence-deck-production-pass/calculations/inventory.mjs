#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const inputPath = join(root, 'source/layout-inventory.csv');
const outputPath = join(root, 'derived/inventory.json');
const lines = readFileSync(inputPath, 'utf8').trim().split('\n');
const headers = lines.shift().split(',');
const rows = lines.map((line) => Object.fromEntries(line.split(',').map((value, index) => [headers[index], value])));
const result = {
  slide_count: rows.length,
  unique_layout_count: new Set(rows.map((row) => row.layout_id)).size,
  source_backed_slide_count: rows.filter((row) => row.source_id).length,
  visual_weights: rows.map((row) => row.visual_weight)
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
