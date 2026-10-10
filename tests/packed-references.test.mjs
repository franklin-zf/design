import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { extractNpmTarball } from '../scripts/lib/skill-identity.mjs';
import { validatePackedReferences } from '../scripts/validate-packed-references.mjs';

const root = resolve('.');
const packageRoots = [
  'SKILL.md', 'agents', 'assets', 'design-systems', 'docs', 'examples', 'references',
  'schemas', 'scripts', 'showcases', 'tests', 'package.json', 'package-lock.json'
];
const scannable = new Set(['.json', '.md', '.mjs', '.js', '.html']);
const pathLikeExtension = /\.(?:json|md|mjs|js|html|css|csv|png|jpe?g|svg|yaml|yml|txt|woff2?|ttf|pdf)(?:[#?].*)?$/i;
const externalPattern = /^(?:[a-z][a-z0-9+.-]*:|#|mailto:|data:)/i;

function posix(value) {
  return value.split(sep).join('/');
}

function walkFiles(scanRoot) {
  const output = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && scannable.has(extname(entry.name).toLowerCase())) {
        output.push(posix(relative(scanRoot, path)));
      }
    }
  }
  walk(scanRoot);
  return output;
}

function cleanCandidate(value) {
  return value.trim()
    .replace(/^[`'"(<]+|[`'">),.;:]+$/g, '')
    .replace(/:[0-9]+(?::[0-9]+)?$/, '');
}

function looksPathLike(value) {
  if (!value || value.length > 500 || /[\n\r]/.test(value) || externalPattern.test(value)) return false;
  if (value.startsWith('./') || value.startsWith('../') || value.startsWith('/')) return true;
  if (packageRoots.some((entry) => value === entry || value.startsWith(`${entry}/`))) return true;
  return value.includes('/') && pathLikeExtension.test(value);
}

function extractReferences(source, text) {
  const references = [];
  const patterns = [
    /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g,
    /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi,
    /\b(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)["']/g,
    /["'`]([^"'`\s]+\/(?:[^"'`\s]+))["'`]/g,
    /`([^`\n]+)`/g
  ];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line))) {
        const raw = cleanCandidate(match[1]);
        if (looksPathLike(raw)) references.push({ source, line: index + 1, raw });
      }
    }
  });
  return [...new Map(references.map((item) => [`${item.source}:${item.line}:${item.raw}`, item])).values()];
}

function resolveReference(scanRoot, item) {
  const raw = item.raw.replace(/[?#].*$/, '');
  const sourceDirectory = dirname(item.source);
  const sourceParts = posix(item.source).split('/');
  const designSystemRoot = sourceParts[0] === 'design-systems'
    && sourceParts.length >= 3
    ? sourceParts.slice(0, 2).join('/')
    : null;
  const designSystemLocal = designSystemRoot && (
    raw.startsWith('assets/')
    || raw.startsWith('preview/')
    || raw.startsWith('qa/')
    || raw.startsWith('source/')
    || [
      'manifest.json',
      'DESIGN.md',
      'USAGE.md',
      'tokens.css',
      'design-tokens.json',
      'components.html',
      'components.manifest.json',
      'layouts.css'
    ].includes(raw)
  );
  let target;
  if (raw.startsWith('/')) target = raw.slice(1);
  else if (raw.startsWith('./') || raw.startsWith('../')) target = posix(normalize(join(sourceDirectory, raw)));
  else if (designSystemLocal) target = posix(normalize(join(designSystemRoot, raw)));
  else if (packageRoots.some((entry) => raw === entry || raw.startsWith(`${entry}/`))) target = posix(normalize(raw));
  else target = posix(normalize(join(sourceDirectory, raw)));

  const escaped = target === '..' || target.startsWith('../') || isAbsolute(target);
  const embedded = item.raw.replace(/^--[^=]+=/, '');
  const fixtureOrTest = embedded === 'examples' || embedded.startsWith('examples/')
    || embedded === 'tests' || embedded.startsWith('tests/')
    || embedded === 'design-knowledge' || embedded.startsWith('design-knowledge/');
  const repositoryHarness = [
    'scripts/design.mjs',
    'scripts/test-data-provenance-negative.mjs',
    'scripts/capture-component-pilot-states.mjs',
    'scripts/build-production-design-systems.mjs',
    'scripts/validate-schemas.mjs',
    'scripts/validate-showcase-registry.mjs',
    'scripts/validate-design-skill.mjs'
  ].includes(item.source);
  const repositoryOnly = fixtureOrTest
    || repositoryHarness
    || item.raw.includes('${')
    || item.raw.startsWith('/usr/')
    || item.raw.startsWith('/Library/')
    || item.raw.startsWith('.design/')
    || item.source === 'scripts/validate-design-system-package.mjs'
    || item.source === 'scripts/test-data-provenance-negative.mjs'
    || item.source.endsWith('/PROVENANCE.json');
  return {
    ...item,
    target,
    escaped,
    exists: !escaped && existsSync(resolve(scanRoot, target)),
    classification: repositoryOnly ? 'repository-only' : 'runtime-required'
  };
}

function scanPackage(scanRoot) {
  const references = walkFiles(scanRoot).flatMap((source) =>
    extractReferences(source, readFileSync(join(scanRoot, source), 'utf8'))
      .map((item) => resolveReference(scanRoot, item))
  );
  return {
    runtimeDangling: references.filter((item) => !item.escaped && !item.exists && item.classification === 'runtime-required'),
    rootEscapes: references.filter((item) => item.escaped),
    showcaseReferences: references.filter((item) =>
      item.classification === 'runtime-required'
      && (item.raw === 'showcases' || item.raw.startsWith('showcases/'))
    )
  };
}

function packAndExtract(tempRoot) {
  const result = spawnSync('npm', ['pack', '--json', '--pack-destination', tempRoot], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: join(tempRoot, 'npm-cache') }
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  const records = Array.isArray(parsed) ? parsed : Object.values(parsed);
  assert.equal(records.length, 1, 'npm pack must return exactly one record');
  const extractRoot = join(tempRoot, 'extract');
  mkdirSync(extractRoot);
  extractNpmTarball(join(tempRoot, records[0].filename), extractRoot);
  return join(extractRoot, 'package');
}

test('real npm tarball has a closed local runtime reference graph', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-packed-refs-test-'));
  try {
    const packedRoot = packAndExtract(tempRoot);
    assert.deepEqual(validatePackedReferences(packedRoot).errors, []);
    const scan = scanPackage(packedRoot);
    assert.deepEqual(scan.runtimeDangling, []);
    assert.deepEqual(scan.rootEscapes, []);
    assert.deepEqual(scan.showcaseReferences, []);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('package-root escape fails closed', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-packed-escape-test-'));
  try {
    const packedRoot = packAndExtract(tempRoot);
    writeFileSync(join(packedRoot, 'references/root-escape-fixture.md'), '[escape](../../outside.md)\n');
    const scan = scanPackage(packedRoot);
    assert.equal(scan.rootEscapes.length, 1);
    assert.equal(scan.rootEscapes[0].target, '../outside.md');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});


test('legacy, missing, escaping, and package-external document references fail closed', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'design-packed-negative-test-'));
  try {
    const packedRoot = packAndExtract(tempRoot);
    const skillPath = join(packedRoot, 'SKILL.md');
    const recipePath = join(packedRoot, 'references/visual-recipes.md');
    writeFileSync(
      recipePath,
      `${readFileSync(recipePath, 'utf8')}\nLegacy: \`references/tasteful-prompt-library.md\`.\n`
    );
    mkdirSync(join(packedRoot, 'docs'));
    writeFileSync(join(packedRoot, 'docs/research-note.md'), 'repository only\n');
    writeFileSync(
      skillPath,
      `${readFileSync(skillPath, 'utf8')}\n`
        + '[missing](references/missing.md)\n'
        + '[escape](../../outside.md)\n'
        + '[package external](docs/research-note.md)\n'
    );

    const scan = scanPackage(packedRoot);
    assert.ok(scan.runtimeDangling.some((item) =>
      item.raw === 'references/tasteful-prompt-library.md'
    ));
    assert.ok(scan.rootEscapes.some((item) => item.raw === '../../outside.md'));

    const validation = spawnSync(process.execPath, ['scripts/validate-design-skill.mjs', '.'], {
      cwd: packedRoot,
      encoding: 'utf8'
    });
    const output = `${validation.stdout}\n${validation.stderr}`;
    assert.notEqual(validation.status, 0);
    assert.match(output, /contains legacy reference: references\/tasteful-prompt-library\.md/);
    assert.match(output, /missing or unknown path: references\/missing\.md/);
    assert.match(output, /escapes package root: \.\.\/\.\.\/outside\.md/);
    assert.match(output, /outside package files: docs\/research-note\.md/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
