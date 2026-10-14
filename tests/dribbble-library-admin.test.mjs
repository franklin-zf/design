import assert from 'node:assert/strict';
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import {
  ingestReference,
  retireReference,
  verifyFreshness
} from '../scripts/manage-dribbble-library.mjs';

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'dribbble-admin-'));
  const indexPath = join(directory, 'index.json');
  copyFileSync(
    resolve('assets/dribbble-shots/index.json'),
    indexPath
  );
  return { directory, indexPath };
}

function newReference() {
  const source = JSON.parse(readFileSync(
    resolve('assets/dribbble-shots/index.json'),
    'utf8'
  )).shots[0];
  return {
    ...source,
    id: 'shot_29999999',
    source_url: 'https://dribbble.com/shots/29999999-Verified-New-Reference',
    preview_source_url:
      'https://cdn.dribbble.com/userupload/99999999/file/verified.png?resize=1600x1200',
    preview_sha256: 'f'.repeat(64),
    status: undefined,
    last_verified_at: '2026-10-14'
  };
}

test('controlled ingest rejects duplicates and writes a verified record', () => {
  const { directory, indexPath } = fixture();
  try {
    const record = newReference();
    const result = ingestReference(record, { indexPath });
    assert.equal(result.id, record.id);
    assert.equal(result.status, 'active');
    assert.throws(
      () => ingestReference(record, { indexPath }),
      /duplicates id, source URL, or preview digest/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('retirement preserves the minimum active library and records a reason', () => {
  const { directory, indexPath } = fixture();
  try {
    ingestReference(newReference(), { indexPath });
    const retired = retireReference(
      'shot_26628350',
      'Source is no longer eligible for active search',
      { indexPath }
    );
    assert.equal(retired.status, 'inactive');
    assert.match(retired.inactive_reason, /no longer eligible/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('freshness reports stale references without mutating the index', () => {
  const { directory, indexPath } = fixture();
  try {
    const result = verifyFreshness({
      indexPath,
      maxAgeDays: 90,
      now: '2027-01-20T00:00:00.000Z'
    });
    assert.equal(result.ready, false);
    assert.equal(result.stale.length, 4);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
