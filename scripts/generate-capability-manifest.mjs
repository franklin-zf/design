#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  MCP_TOOLS_MANIFEST
} from '../packages/dribbble-hub-mcp/src/index.mjs';

const modulePath = fileURLToPath(import.meta.url);
const root = resolve(dirname(modulePath), '..');
const manifestPath = join(
  root,
  'docs',
  'skill-inventory',
  'capability-manifest.json'
);

function files(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  const output = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...files(path, predicate));
    else if (entry.isFile() && predicate(path)) output.push(path);
  }
  return output.sort();
}

function directories(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function git(args, fallback = 'unknown') {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8'
    }).trim();
  } catch {
    return fallback;
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function inputDigest(paths) {
  const entries = paths.map((path) => ({
    path: relative(root, path).split('\\').join('/'),
    sha256: sha256(readFileSync(path))
  }));
  return sha256(JSON.stringify(entries));
}

export function generateCapabilityManifest() {
  if (!existsSync(manifestPath)) {
    throw new Error(`capability manifest is missing: ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const referenceFiles = files(
    join(root, 'references'),
    (path) => path.endsWith('.md')
  );
  const scriptFiles = files(
    join(root, 'scripts'),
    (path) => path.endsWith('.mjs')
      && !path.includes(`${join('scripts', 'lib')}/`)
  );
  const libraryFiles = files(
    join(root, 'scripts', 'lib'),
    (path) => path.endsWith('.mjs')
  );
  const schemaFiles = files(
    join(root, 'schemas'),
    (path) => path.endsWith('.json')
  );
  const rootTests = files(
    join(root, 'tests'),
    (path) => path.endsWith('.test.mjs')
      && relative(join(root, 'tests'), path).split('/').length === 1
  );
  const packageTests = files(
    join(root, 'packages'),
    (path) => path.includes(`${join('', 'tests')}/`)
      && path.endsWith('.test.mjs')
  );
  const exampleDirs = directories(join(root, 'examples'));
  const packageManifests = files(
    join(root, 'packages'),
    (path) => path.endsWith('package.json')
      || path.endsWith('mcp-server.json')
  );
  const designSystems = directories(join(root, 'design-systems'))
    .filter((name) => name !== '_schema' && name !== 'defaults');
  const inputFiles = [
    join(root, 'package.json'),
    join(root, 'assets', 'templates', 'registry.json'),
    join(root, 'assets', 'components', 'registry.json'),
    join(root, 'design-systems', 'defaults', 'design-profile-catalogue.json'),
    ...referenceFiles,
    ...schemaFiles,
    ...packageManifests
  ].filter((path) => existsSync(path) && statSync(path).isFile());

  manifest.generated_at = new Date().toISOString().slice(0, 10);
  manifest.source_digest = inputDigest(inputFiles);
  manifest.skill.branch = git(['branch', '--show-current']);
  manifest.skill.head_commit = git(['rev-parse', '--short', 'HEAD']);
  manifest.skill.tracked_files_total = Number(
    git(['ls-files'], '').split('\n').filter(Boolean).length
  );
  manifest.skill.workspace_files_total = Number(
    git([
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard'
    ], '').split('\n').filter(Boolean).length
  );

  manifest.layers[1].count = referenceFiles.length;
  manifest.layers[2].packages = manifest.layers[2].packages.map((item) => {
    if (item.name !== 'dribbble-hub-mcp') return item;
    return {
      ...item,
      mcp_tools: MCP_TOOLS_MANIFEST.map((tool) => tool.name),
      tests: rootTests.filter((path) => path.endsWith('dribbble-hub.test.mjs')).length
        + packageTests.filter((path) => path.includes('dribbble-hub-mcp')).length
    };
  });
  manifest.layers[3].design_systems = designSystems;
  manifest.layers[4].executable_scripts = scriptFiles.length;
  manifest.layers[4].shared_libs = libraryFiles.length;
  manifest.layers[4].script_groups.validators = scriptFiles.filter(
    (path) => path.split('/').pop().startsWith('validate-')
  ).length;
  manifest.layers[5].schemas = schemaFiles.length;
  manifest.layers[5].test_suites = rootTests.length;
  manifest.layers[5].package_test_suites = packageTests.length;
  manifest.layers[5].examples = {
    total: exampleDirs.length,
    positive: exampleDirs.filter((name) => name.endsWith('-pass')).length,
    negative: exampleDirs.filter((name) => name.startsWith('invalid-')).length
  };
  return manifest;
}

function stable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

if (process.argv[1] === modulePath) {
  const mode = process.argv.includes('--write') ? 'write' : 'check';
  const generated = stable(generateCapabilityManifest());
  const current = readFileSync(manifestPath, 'utf8');
  if (mode === 'write') {
    writeFileSync(manifestPath, generated);
    console.log(`Capability manifest generated: ${manifestPath}`);
  } else if (current !== generated) {
    console.error(
      'Capability manifest drift detected. Run '
      + 'node scripts/generate-capability-manifest.mjs --write'
    );
    process.exit(1);
  } else {
    console.log('Capability manifest is current.');
  }
}
