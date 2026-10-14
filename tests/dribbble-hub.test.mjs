import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  getLibraryStatus,
  getShot,
  loadShotsIndex,
  searchShots,
  syncDailyShots,
  validateShotsIndex
} from '../scripts/dribbble-hub.mjs';

test('Dribbble Hub validates four source-bound high-resolution references', () => {
  const index = loadShotsIndex();
  const status = getLibraryStatus();
  assert.equal(index.version, '2.0.0');
  assert.equal(index.shots.length, 4);
  assert.equal(status.ready, true);
  assert.equal(status.verified_count, 4);
  for (const shot of index.shots) {
    assert.match(shot.source_url, /^https:\/\/dribbble\.com\/shots\/\d+-/);
    assert.match(
      shot.preview_source_url,
      /^https:\/\/cdn\.dribbble\.com\/userupload\//
    );
    assert.equal(shot.preview_width, 1600);
    assert.equal(shot.preview_height, 1200);
    assert.equal(shot.rights.distribution, 'metadata-only');
    assert.equal(shot.rights.direct_reuse_allowed, false);
    assert.equal(shot.annotation.basis, 'manual-visual-review');
  }
});

test('Dribbble Hub searches Chinese scenes and visual methods', () => {
  assert.equal(searchShots('商家')[0].id, 'shot_21235669');
  assert.equal(searchShots('商家经营工作台')[0].id, 'shot_21235669');
  assert.equal(searchShots('关系图')[0].id, 'shot_27388009');
  assert.equal(searchShots('POS')[0].id, 'shot_20461079');
});

test('Dribbble Hub resolves a source-bound record by id', () => {
  const shot = getShot('shot_26628350');
  assert.ok(shot);
  assert.equal(
    shot.title,
    'Shopeers - AI-Powered B2B eCommerce Analytics Dashboard'
  );
  assert.equal(shot.author, 'Dipa Inhouse');
  assert.ok(shot.annotation.visual_methods.length >= 3);
});

test('Dribbble Hub fails closed on invalid rights or digest metadata', () => {
  const invalidRights = structuredClone(loadShotsIndex());
  invalidRights.shots[0].rights.distribution = 'redistributable';
  assert.match(
    validateShotsIndex(invalidRights).join('\n'),
    /rights must prohibit direct reuse/
  );

  const drifted = structuredClone(loadShotsIndex());
  drifted.shots[0].preview_sha256 = 'invalid';
  assert.match(
    validateShotsIndex(drifted).join('\n'),
    /preview_sha256 must be a SHA-256/
  );
});

test('Dribbble Hub verifies an optional private cache without packaging it', () => {
  const directory = mkdtempSync(join(tmpdir(), 'dribbble-cache-'));
  try {
    const cacheDir = join(directory, 'cache');
    const indexPath = join(directory, 'index.json');
    const index = structuredClone(loadShotsIndex());
    const bytes = Buffer.alloc(24);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes, 0);
    bytes.writeUInt32BE(1600, 16);
    bytes.writeUInt32BE(1200, 20);
    index.shots[0].preview_sha256 = createHash('sha256')
      .update(bytes)
      .digest('hex');
    writeFileSync(indexPath, `${JSON.stringify(index)}\n`);
    mkdirSync(cacheDir);
    writeFileSync(join(cacheDir, `${index.shots[0].id}.png`), bytes);
    const shot = getShot(index.shots[0].id, { indexPath, cacheDir });
    assert.equal(shot.local_cache.status, 'available');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Dribbble Hub sync is a deprecated alias for verification', () => {
  const result = syncDailyShots({ count: 4 });
  assert.equal(result.success, true);
  assert.equal(result.mode, 'metadata-and-private-cache-check');
  assert.equal(result.verified_count, 4);
  assert.equal(result.deprecated, true);
  assert.equal(result.replacement, 'verify');
});
