import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const identitySchemaVersion = 'design-skill-identity/v1';

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function toPosix(path) {
  return path.split('\\').join('/');
}

function isInside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function assertSafeRelative(path, label) {
  if (typeof path !== 'string' || !path || isAbsolute(path)) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const normalized = toPosix(path);
  if (normalized.includes('\0') || normalized.split('/').some((part) => part === '..')) {
    throw new Error(`${label} escapes the skill root: ${path}`);
  }
  return normalized.replace(/^\.\//, '');
}

function readPackageManifest(root) {
  const packagePath = join(root, 'package.json');
  if (!existsSync(packagePath) || lstatSync(packagePath).isSymbolicLink()) {
    throw new Error(`package.json must be a regular non-symlink file: ${root}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(packagePath, 'utf8'));
  } catch (error) {
    throw new Error(`package.json is invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error('package.json files must be a non-empty array');
  }
  return manifest;
}

function collectPath(root, relativePath, files) {
  const safePath = assertSafeRelative(relativePath, 'package file path');
  const absolutePath = resolve(root, safePath);
  if (!isInside(root, absolutePath) || !existsSync(absolutePath)) {
    throw new Error(`package file path is missing or unsafe: ${safePath}`);
  }
  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(`skill identity rejects symbolic link: ${safePath}`);
  }
  if (metadata.isFile()) {
    files.set(safePath, sha256(readFileSync(absolutePath)));
    return;
  }
  if (!metadata.isDirectory()) {
    throw new Error(`skill identity requires regular files or directories: ${safePath}`);
  }
  for (const entry of readdirSync(absolutePath, { withFileTypes: true })
    .sort((left, right) => comparePaths(left.name, right.name))) {
    collectPath(root, `${safePath}/${entry.name}`, files);
  }
}

function collectAllFiles(root) {
  const files = new Map();
  function walk(directory, prefix = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => comparePaths(left.name, right.name))) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = join(directory, entry.name);
      const metadata = lstatSync(absolutePath);
      if (!prefix && entry.name === 'node_modules' && metadata.isDirectory()) continue;
      if (metadata.isSymbolicLink()) {
        throw new Error(`installed skill rejects symbolic link: ${relativePath}`);
      }
      if (metadata.isDirectory()) {
        walk(absolutePath, relativePath);
      } else if (metadata.isFile()) {
        files.set(relativePath, sha256(readFileSync(absolutePath)));
      } else {
        throw new Error(`installed skill contains a non-regular entry: ${relativePath}`);
      }
    }
  }
  walk(root);
  return files;
}

function identityFromFiles(files) {
  const entries = [...files.entries()]
    .map(([path, digest]) => ({ path, sha256: digest }))
    .sort((left, right) => comparePaths(left.path, right.path));
  return {
    schema_version: identitySchemaVersion,
    digest: sha256(JSON.stringify(entries)),
    entry_count: entries.length,
    files: entries
  };
}

export function computeSkillIdentity(rootPath) {
  const root = resolve(rootPath);
  const manifest = readPackageManifest(root);
  const files = new Map();
  for (const path of ['package.json', ...manifest.files]) {
    collectPath(root, path, files);
  }
  return identityFromFiles(files);
}

export function validateInstallParity(sourcePath, candidatePath) {
  const errors = [];
  let expected;
  let actual;
  try {
    expected = computeSkillIdentity(sourcePath);
  } catch (error) {
    return [`source skill identity failed: ${error.message}`];
  }
  try {
    const candidateRoot = resolve(candidatePath);
    if (!existsSync(candidateRoot) || !lstatSync(candidateRoot).isDirectory()) {
      return [`candidate skill directory does not exist: ${candidateRoot}`];
    }
    actual = identityFromFiles(collectAllFiles(candidateRoot));
  } catch (error) {
    return [`candidate skill identity failed: ${error.message}`];
  }

  const expectedFiles = new Map(expected.files.map((entry) => [entry.path, entry.sha256]));
  const actualFiles = new Map(actual.files.map((entry) => [entry.path, entry.sha256]));
  for (const [path, digest] of expectedFiles) {
    if (!actualFiles.has(path)) {
      errors.push(`missing file in candidate skill: ${path}`);
    } else if (actualFiles.get(path) !== digest) {
      errors.push(`hash mismatch in candidate skill: ${path}`);
    }
  }
  for (const path of actualFiles.keys()) {
    if (!expectedFiles.has(path)) errors.push(`unexpected file in candidate skill: ${path}`);
  }
  if (errors.length === 0 && actual.digest !== expected.digest) {
    errors.push('candidate skill aggregate digest mismatch');
  }
  return errors;
}

function tarString(buffer, start, length) {
  return buffer.subarray(start, start + length).toString('utf8').replace(/\0.*$/, '');
}

function tarSize(buffer, offset) {
  const value = tarString(buffer, offset + 124, 12).trim();
  const size = value ? Number.parseInt(value, 8) : 0;
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new Error(`invalid tar entry size at byte ${offset}`);
  }
  return size;
}

export function extractNpmTarball(tarballPath, destinationPath) {
  const destination = resolve(destinationPath);
  mkdirSync(destination, { recursive: true });
  const archive = gunzipSync(readFileSync(tarballPath));
  const extracted = new Set();
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = tarString(header, 0, 100);
    const prefix = tarString(header, 345, 155);
    const entryPath = assertSafeRelative(prefix ? `${prefix}/${name}` : name, 'tar entry');
    const type = String.fromCharCode(header[156] || 48);
    const size = tarSize(archive, offset);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > archive.length) throw new Error(`truncated tar entry: ${entryPath}`);
    const outputPath = resolve(destination, entryPath);
    if (!isInside(destination, outputPath)) throw new Error(`tar entry escapes destination: ${entryPath}`);
    if (extracted.has(entryPath)) throw new Error(`duplicate tar entry: ${entryPath}`);
    extracted.add(entryPath);

    if (type === '5') {
      mkdirSync(outputPath, { recursive: true });
    } else if (type === '0' || type === '\0') {
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, archive.subarray(dataStart, dataEnd));
    } else {
      throw new Error(`unsupported tar entry type ${JSON.stringify(type)}: ${entryPath}`);
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
}
