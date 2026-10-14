#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync
} from 'node:fs';
import {
  dirname,
  resolve
} from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateShotsIndex
} from '../packages/dribbble-hub-mcp/src/index.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const defaultIndexPath = resolve(
  skillRoot,
  'assets',
  'dribbble-shots',
  'index.json'
);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadIndex(indexPath) {
  if (!existsSync(indexPath)) {
    throw new Error(`Dribbble index is missing: ${indexPath}`);
  }
  return JSON.parse(readFileSync(indexPath, 'utf8'));
}

function saveIndex(indexPath, index) {
  const temporaryPath = `${indexPath}.tmp`;
  writeFileSync(
    temporaryPath,
    `${JSON.stringify(index, null, 2)}\n`,
    { mode: 0o600 }
  );
  renameSync(temporaryPath, indexPath);
}

function validateCandidate(index, indexPath) {
  const errors = validateShotsIndex(index, {
    indexPath,
    skillRoot
  });
  if (errors.length) {
    throw new Error(`Dribbble index update rejected:\n- ${errors.join('\n- ')}`);
  }
}

export function ingestReference(record, options = {}) {
  const indexPath = resolve(options.indexPath || defaultIndexPath);
  const index = loadIndex(indexPath);
  if (index.shots.some((shot) => (
    shot.id === record.id
    || shot.source_url === record.source_url
    || shot.preview_sha256 === record.preview_sha256
  ))) {
    throw new Error('Dribbble reference duplicates id, source URL, or preview digest');
  }
  const next = structuredClone(index);
  next.updated_at = new Date().toISOString();
  next.shots.push({
    ...record,
    status: 'active',
    last_verified_at: record.last_verified_at || today()
  });
  validateCandidate(next, indexPath);
  saveIndex(indexPath, next);
  return next.shots.find((shot) => shot.id === record.id);
}

export function retireReference(id, reason, options = {}) {
  if (typeof reason !== 'string' || reason.trim().length < 8) {
    throw new Error('retire requires a reason of at least eight characters');
  }
  const indexPath = resolve(options.indexPath || defaultIndexPath);
  const index = loadIndex(indexPath);
  const next = structuredClone(index);
  const shot = next.shots.find((item) => item.id === id);
  if (!shot) throw new Error(`reference not found: ${id}`);
  shot.status = 'inactive';
  shot.inactive_reason = reason.trim();
  next.updated_at = new Date().toISOString();
  validateCandidate(next, indexPath);
  saveIndex(indexPath, next);
  return shot;
}

export function verifyFreshness(options = {}) {
  const indexPath = resolve(options.indexPath || defaultIndexPath);
  const maxAgeDays = Number.isInteger(options.maxAgeDays)
    ? options.maxAgeDays
    : 90;
  const now = options.now ? new Date(options.now) : new Date();
  const index = loadIndex(indexPath);
  validateCandidate(index, indexPath);
  const stale = index.shots.filter((shot) => {
    const verified = new Date(`${shot.last_verified_at}T00:00:00.000Z`);
    return (now - verified) / 86400000 > maxAgeDays;
  }).map((shot) => ({
    id: shot.id,
    last_verified_at: shot.last_verified_at,
    status: shot.status
  }));
  return {
    ready: stale.length === 0,
    max_age_days: maxAgeDays,
    stale
  };
}

function option(name) {
  return process.argv.find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

if (process.argv[1] === modulePath) {
  try {
    const [command, argument] = process.argv.slice(2).filter(
      (value) => !value.startsWith('--')
    );
    const indexPath = option('--index');
    if (command === 'ingest') {
      if (!argument) throw new Error('ingest requires a record JSON path');
      console.log(JSON.stringify(ingestReference(
        JSON.parse(readFileSync(resolve(argument), 'utf8')),
        { indexPath }
      ), null, 2));
    } else if (command === 'retire') {
      console.log(JSON.stringify(retireReference(
        argument,
        option('--reason'),
        { indexPath }
      ), null, 2));
    } else if (command === 'freshness') {
      const result = verifyFreshness({
        indexPath,
        maxAgeDays: Number.parseInt(option('--max-age-days'), 10) || 90
      });
      console.log(JSON.stringify(result, null, 2));
      if (!result.ready) process.exitCode = 1;
    } else {
      throw new Error('Available commands: ingest, retire, freshness');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
