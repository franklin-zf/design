import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const libraryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const explicitEnvName = 'DESIGN_PLAYWRIGHT_PATH';

function packageEntry(directory) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return null;
  const packageJson = join(directory, 'package.json');
  if (existsSync(packageJson)) {
    try {
      const metadata = JSON.parse(readFileSync(packageJson, 'utf8'));
      if (typeof metadata.main === 'string' && existsSync(join(directory, metadata.main))) return join(directory, metadata.main);
    } catch {
      return null;
    }
  }
  for (const name of ['index.mjs', 'index.js', 'index.cjs']) {
    if (existsSync(join(directory, name))) return join(directory, name);
  }
  return null;
}

function entryFromPath(value) {
  const path = isAbsolute(value) ? value : resolve(value);
  if (!existsSync(path)) return null;
  if (statSync(path).isFile()) return path;
  const candidates = basename(path) === 'node_modules'
    ? [join(path, 'playwright')]
    : [path, join(path, 'playwright'), join(path, 'node_modules', 'playwright')];
  for (const candidate of candidates) {
    const entry = packageEntry(candidate);
    if (entry) return entry;
  }
  return null;
}

function cacheRuntimeRoots(homeDirectory) {
  const root = join(homeDirectory, '.cache', 'codex-runtimes');
  if (!existsSync(root) || !statSync(root).isDirectory()) return [];
  const names = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => {
      if (a === 'codex-primary-runtime') return -1;
      if (b === 'codex-primary-runtime') return 1;
      return a.localeCompare(b);
    });
  return names.map((name) => join(root, name, 'dependencies', 'node', 'node_modules', 'playwright'));
}

export class PlaywrightRuntimeError extends Error {
  constructor(attempts) {
    const evidence = attempts.length ? attempts.join(' | ') : 'no candidates discovered';
    super(`Playwright Chromium runtime unavailable. Set ${explicitEnvName} to a Playwright module, its package directory, or a node_modules root; alternatively install package-local playwright. Attempts: ${evidence}`);
    this.name = 'PlaywrightRuntimeError';
    this.code = 'PLAYWRIGHT_RUNTIME_UNAVAILABLE';
    this.attempts = attempts;
  }
}

export async function loadPlaywrightRuntime(options = {}) {
  const packageRoot = resolve(options.packageRoot || libraryRoot);
  const homeDirectory = resolve(options.homeDir || homedir());
  const explicitPath = options.explicitPath || process.env[explicitEnvName];
  const candidates = [];
  if (explicitPath) candidates.push({ source: 'explicit', requested: explicitPath });
  candidates.push({ source: 'package-local', requested: join(packageRoot, 'node_modules', 'playwright') });
  for (const requested of cacheRuntimeRoots(homeDirectory)) candidates.push({ source: 'codex-bundled-runtime', requested });

  const attempts = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const entry = entryFromPath(candidate.requested);
    if (!entry) {
      attempts.push(`${candidate.source}:${candidate.requested}:module entry missing`);
      continue;
    }
    const canonicalEntry = realpathSync(entry);
    if (seen.has(canonicalEntry)) continue;
    seen.add(canonicalEntry);
    try {
      const loaded = await import(pathToFileURL(canonicalEntry).href);
      const chromium = loaded.chromium || loaded.default?.chromium;
      if (!chromium || typeof chromium.executablePath !== 'function' || typeof chromium.launch !== 'function') {
        attempts.push(`${candidate.source}:${canonicalEntry}:chromium export missing`);
        continue;
      }
      const executable = chromium.executablePath();
      if (typeof executable !== 'string' || !existsSync(executable) || !statSync(executable).isFile()) {
        attempts.push(`${candidate.source}:${canonicalEntry}:Chromium executable missing at ${executable || '<empty>'}`);
        continue;
      }
      return {
        chromium,
        source: candidate.source,
        modulePath: canonicalEntry,
        executablePath: realpathSync(executable),
        evidence: `Playwright source=${candidate.source}; module=${canonicalEntry}; Chromium executable=${realpathSync(executable)}`
      };
    } catch (error) {
      attempts.push(`${candidate.source}:${canonicalEntry}:load failed: ${error.message}`);
    }
  }
  throw new PlaywrightRuntimeError(attempts);
}
