import { createHash } from 'node:crypto';
import {
  lstatSync,
  readFileSync,
  readdirSync
} from 'node:fs';
import { join, relative } from 'node:path';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${stable(value[key])}`
    ).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function computeArtifactDigest(root) {
  const excluded = new Set([
    'evidence-contract.json',
    'reviewer-record.json',
    'accessibility-checks.json',
    'privacy-checks.json',
    'render-profile.json',
    'requirement-verification.json',
    'inspiration-binding.json',
    'browser-test-evidence.json'
  ]);
  const entries = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const ref = relative(root, path).split('\\').join('/');
      if (ref.startsWith('.design/') || ref.startsWith('qa/') || excluded.has(ref)) {
        continue;
      }
      const metadata = lstatSync(path);
      if (metadata.isSymbolicLink()) {
        throw new Error(`artifact digest rejects symbolic link: ${ref}`);
      }
      if (metadata.isDirectory()) walk(path);
      else if (metadata.isFile()) {
        entries.push({ path: ref, sha256: sha256(readFileSync(path)) });
      }
    }
  }
  walk(root);
  return sha256(stable(entries.sort((left, right) => (
    left.path.localeCompare(right.path)
  ))));
}
