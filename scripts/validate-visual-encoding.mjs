#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/validate-visual-encoding.mjs <artifact-dir>');
  process.exit(2);
}

const errors = [];
const manifestPath = join(dir, 'manifest.json');
const htmlPath = join(dir, 'index.html');

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

const manifest = existsSync(manifestPath) ? readJson(manifestPath, 'manifest.json') : null;
const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';
if (!manifest) errors.push('manifest.json is required.');
if (!html) errors.push('index.html is required.');

const chartTypes = new Set(['data-report', 'dashboard', 'chart-frame']);
if (manifest && chartTypes.has(manifest.artifact_type) && manifest.schematic !== true) {
  const charts = Array.isArray(manifest.charts) ? manifest.charts : [];
  const visibleIds = [...html.matchAll(/\bdata-chart-id=["']([^"']+)["']/gi)].map((match) => match[1]);
  const visibleIdSet = new Set(visibleIds);
  for (const [index, chart] of charts.entries()) {
    const prefix = `manifest.charts[${index}]`;
    const encoding = chart?.visual_encoding;
    if (!encoding || typeof encoding !== 'object') {
      errors.push(`${prefix}.visual_encoding must be an object.`);
      continue;
    }
    for (const field of ['mark', 'x', 'y', 'scale_type', 'baseline', 'domain', 'label_policy']) {
      if (typeof encoding[field] !== 'string' || !encoding[field].trim()) {
        errors.push(`${prefix}.visual_encoding.${field} must be non-empty.`);
      }
    }
    const encodingText = JSON.stringify(encoding).toLowerCase();
    if (/\b3d\b|perspective|exploded|depth/.test(encodingText)) {
      errors.push(`${prefix}.visual_encoding contains a misleading depth or perspective cue.`);
    }
    if (/color[- ]only|hover[- ]only|tooltip[- ]only|hidden/.test(encodingText)) {
      errors.push(`${prefix}.visual_encoding cannot make meaning depend on color, hover, tooltip, or hidden state alone.`);
    }
    if (chart?.id && !visibleIdSet.has(chart.id)) {
      errors.push(`${prefix}.id is not rendered by a data-chart-id region.`);
    }
  }
  for (const visibleId of visibleIds) {
    if (!charts.some((chart) => chart?.id === visibleId)) {
      errors.push(`HTML data-chart-id "${visibleId}" has no manifest chart.`);
    }
    if (visibleIds.filter((id) => id === visibleId).length !== 1) {
      errors.push(`HTML data-chart-id "${visibleId}" must occur exactly once.`);
    }
  }
}

if (errors.length) {
  console.error('Visual encoding validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Visual encoding validation passed: ${resolve(dir)}`);
