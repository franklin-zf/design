#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const script = (name) => join(root, 'scripts', name);

const positiveArtifacts = [
  'data-report-pass',
  'dashboard-pass',
  'deck-pass',
  'chart-frame-pass',
  'screenshot-evidence-pass',
  'design-system-pass',
  'tweakable-artifact-pass',
  'ppt-handoff-pass',
  'role-handoff-pass',
  'swiss-deck-pass',
  'swiss-evidence-deck-production-pass',
  'poster-pass'
];

function runNode(args, label = args.join(' ')) {
  process.stdout.write(`\n[design] ${label}\n`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runScript(name, args = []) {
  runNode([script(name), ...args], `${name} ${args.join(' ')}`.trim());
}

function expectFailure(contains, name, args, notContains = null) {
  const options = [`--contains=${contains}`];
  if (notContains) options.push(`--not-contains=${notContains}`);
  runScript('expect-fail.mjs', [
    ...options,
    '--',
    process.execPath,
    script(name),
    ...args
  ]);
}

function readManifest(artifactRoot) {
  const path = join(artifactRoot, 'manifest.json');
  if (!existsSync(path)) throw new Error(`Missing manifest.json: ${artifactRoot}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function checkArtifact(artifact, profile = 'standard', assuranceArgs = []) {
  const artifactRoot = resolve(artifact);
  const manifest = readManifest(artifactRoot);

  runScript('validate-design-output.mjs', [artifactRoot]);
  if (existsSync(join(artifactRoot, 'summary-map.json'))) {
    runScript('validate-summary-map.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'claim-map.json'))) {
    runScript('validate-claim-map.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'data-provenance.json'))) {
    runScript('validate-data-provenance.mjs', [artifactRoot]);
  }
  if (manifest.aesthetic_contract) {
    runScript('validate-aesthetic-contract.mjs', [artifactRoot]);
  }
  if (manifest.visual_assets) {
    runScript('validate-asset-contract.mjs', [artifactRoot]);
  }
  if (manifest.aesthetic_contract?.layout_lock === 'swiss-s01-s22') {
    runScript('validate-layout-lock.mjs', [artifactRoot]);
    runScript('validate-visual-rhythm.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'poster-plan.json'))) {
    runScript('validate-poster-contract.mjs', [artifactRoot]);
    runScript('validate-poster-anti-ai-slop.mjs', [artifactRoot]);
  }
  if (profile === 'assured') {
    runScript('validate-evidence-contract.mjs', [artifactRoot, ...assuranceArgs]);
  }

  process.stdout.write(`\nDesign check passed: ${artifactRoot} (${profile})\n`);
}

function validateRepository() {
  runScript('validate-code-style.mjs', ['.']);
  runScript('validate-design-skill.mjs', ['.']);
  runScript('validate-schemas.mjs', ['.']);
  runScript('validate-component-catalogue.mjs', ['.']);
  runScript('validate-vendor-provenance.mjs', ['.']);
  runScript('validate-design-system-package.mjs', ['.', 'swiss-deck']);
  if (existsSync(join(root, 'examples'))) {
    runScript('validate-component-pilots.mjs', [
      'examples/component-deck-pilot-pass',
      'examples/component-operational-pilot-pass'
    ]);
    checkArtifact('examples/component-deck-pilot-pass');
    checkArtifact('examples/component-operational-pilot-pass', 'assured-fixture');
    runScript('validate-showcase-registry.mjs', ['.']);
    runScript('capability-preflight.mjs', ['--require=browser_smoke']);
  } else {
    process.stdout.write('\n[design] repository fixtures absent; runtime validation only\n');
    runScript('capability-preflight.mjs');
  }
}

function validateIntake() {
  runScript('validate-intake-direction.mjs', ['examples/intake-direction-pass']);
  runScript('validate-intake-direction.mjs', [
    'examples/intake-confirmed-pass',
    '--require-confirmed'
  ]);
  runScript('validate-intake-direction.mjs', [
    'examples/intake-selected-pass',
    '--require-confirmed',
    '--poster=examples/intake-selected-pass/poster-handoff.json'
  ]);

  const cases = [
    ['missing question for use_scenario', 'examples/invalid-intake-direction-missing-scenario', []],
    ['must preserve known.goal', 'examples/invalid-intake-direction-known-drift', []],
    ['selected_direction_id is required', 'examples/invalid-intake-selected-missing-trace', ['--require-confirmed']],
    ['--require-confirmed requires status confirmed', 'examples/intake-direction-pass', ['--require-confirmed']],
    ['requires 2-3 direction options', 'examples/invalid-intake-direction-option-count', []],
    ['exactly one recommended option', 'examples/invalid-intake-direction-multiple-recommended', []],
    ['known must be an object', 'examples/invalid-intake-direction-missing-known', []],
    ['known.artifact_type is unsupported', 'examples/invalid-intake-direction-unsupported-type', ['--require-confirmed']],
    ['Poster role must be poster', 'examples/intake-selected-pass', [
      '--require-confirmed',
      '--poster=examples/invalid-intake-poster-incomplete/poster-handoff.json'
    ], 'Poster goal must match'],
    ['Poster goal must match', 'examples/intake-selected-pass', [
      '--require-confirmed',
      '--poster=examples/invalid-intake-poster-drift/poster-handoff.json'
    ]]
  ];
  for (const [contains, artifact, args, notContains] of cases) {
    expectFailure(
      contains,
      'validate-intake-direction.mjs',
      [artifact, ...args],
      notContains
    );
  }
}

function validateNegativeFixtures() {
  runScript('test-data-provenance-negative.mjs', ['.']);

  const failures = [
    ['validate-claim-map.mjs', 'evidence_quotes', 'invalid-claim-missing-evidence-quote'],
    ['validate-claim-map.mjs', 'quote not found', 'invalid-claim-quote-not-in-source'],
    ['validate-summary-map.mjs', 'not present verbatim', 'invalid-summary-number-drift'],
    ['validate-summary-map.mjs', 'has no matching summary-map entry', 'invalid-summary-unmapped'],
    ['validate-summary-map.mjs', 'forbidden plain-language term', 'invalid-summary-jargon'],
    ['validate-summary-map.mjs', 'summary_text must match visible HTML text', 'invalid-summary-partial-map'],
    ['validate-summary-map.mjs', 'must appear in preserved_numbers', 'invalid-summary-missing-preserved-number'],
    ['validate-asset-contract.mjs', 'SVG text policy violation', 'invalid-swiss-svg-text'],
    ['validate-asset-contract.mjs', 'fake screenshot label', 'invalid-swiss-fake-screenshot'],
    ['validate-aesthetic-contract.mjs', 'accent_2 marker_only', 'invalid-swiss-accent-overuse'],
    ['validate-layout-lock.mjs', 'unregistered layout', 'invalid-swiss-bad-layout'],
    ['validate-visual-rhythm.mjs', 'visual rhythm violation', 'invalid-swiss-rhythm'],
    ['validate-poster-anti-ai-slop.mjs', 'anti-ai-slop violation', 'invalid-poster-ai-slop'],
    ['validate-poster-contract.mjs', 'visual_hook', 'invalid-poster-missing-hook'],
    ['validate-design-output.mjs', 'ready artifacts must set semantic_entailment', 'invalid-false-ready'],
    ['validate-design-output.mjs', 'missing visual_encoding', 'invalid-chart-contract'],
    ['validate-design-output.mjs', 'colors outside preset', 'invalid-style-preset-mismatch'],
    ['validate-design-output.mjs', 'empty chart regions', 'invalid-empty-dashboard-chart'],
    ['validate-design-output.mjs', 'must include summary-map.json', 'invalid-summary-missing-map'],
    ['validate-design-output.mjs', 'missing media_decision', 'invalid-missing-media-decision']
  ];
  for (const [validator, contains, fixture] of failures) {
    expectFailure(contains, validator, [`examples/${fixture}`]);
  }
}

function runStandardTests() {
  runNode([
    '--test',
    'tests/code-style.test.mjs',
    'tests/component-catalogue.test.mjs',
    'tests/component-usage.test.mjs',
    'tests/component-pilots.test.mjs',
    'tests/json-schema.test.mjs',
    'tests/playwright-runtime.test.mjs',
    'tests/execution-plan.test.mjs',
    'tests/execution-runner.test.mjs',
    'tests/evidence-contract.test.mjs',
    'tests/migration.test.mjs',
    'tests/showcase-registry.test.mjs',
    'tests/validators.test.mjs'
  ], 'node test suites');
  validateRepository();
  validateIntake();
  runScript('validate-data-provenance.mjs', ['examples/swiss-evidence-deck-production-pass']);
  for (const fixture of positiveArtifacts) checkArtifact(`examples/${fixture}`);
  validateNegativeFixtures();
  runScript('check-empty-qa.mjs', ['examples']);
}

function runStrictTests() {
  runScript('capability-preflight.mjs', ['--require=browser_launch']);
  runNode(['--test', 'tests/render-spec-browser.test.mjs']);
  runNode(['--test', 'tests/component-pilots-browser.test.mjs']);
  for (const fixture of ['component-deck-pilot-pass', 'component-operational-pilot-pass']) {
    runScript('render-smoke.mjs', [
      `examples/${fixture}/index.html`,
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout'
    ]);
  }
  runScript('capture-component-pilot-states.mjs', ['examples/component-operational-pilot-pass']);
  for (const fixture of positiveArtifacts) {
    runScript('render-smoke.mjs', [
      `examples/${fixture}/index.html`,
      '--viewports=desktop,mobile',
      '--strict-layout'
    ]);
  }
  runScript('capture-deck-slides.mjs', ['examples/swiss-evidence-deck-production-pass/index.html']);
  runScript('capture-deck-slides.mjs', [
    'examples/swiss-evidence-deck-production-pass/index.html',
    '--reduced-motion'
  ]);
  runScript('validate-deck-capture-set.mjs', ['examples/swiss-evidence-deck-production-pass']);
  runScript('capture-deck-contact-sheets.mjs', ['examples/swiss-evidence-deck-production-pass']);
  runScript('tweakable-smoke.mjs', ['examples/tweakable-artifact-pass/index.html']);
  expectFailure('strict layout issues', 'render-smoke.mjs', [
    'examples/invalid-horizontal-overflow/index.html',
    '--strict-layout'
  ]);
  expectFailure('strict layout issues', 'render-smoke.mjs', [
    'examples/invalid-text-overlap/index.html',
    '--strict-layout'
  ]);
  runScript('check-empty-qa.mjs', ['examples']);
}

function usage() {
  process.stdout.write(`Design CLI\n\n${[
    'plan <request.json> [compiler options]',
    'check <artifact-dir> [--profile=express|standard|assured] [assurance options]',
    'render <index.html> [render options]',
    'capture <index.html> [capture options]',
    'preflight [capability options]',
    'validate',
    'test [--strict]'
  ].map((line) => `  ${line}`).join('\n')}\n`);
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help' || command === 'help') {
    usage();
    return;
  }
  if (command === 'plan') {
    if (!args[0]) throw new Error('plan requires a request.json path');
    runScript('compile-execution-plan.mjs', args);
    return;
  }
  if (command === 'check') {
    if (!args[0]) throw new Error('check requires an artifact directory');
    const profileArg = args.find((arg) => arg.startsWith('--profile='));
    const profile = profileArg?.slice(10) || 'standard';
    if (!['express', 'standard', 'assured'].includes(profile)) {
      throw new Error(`Unsupported profile: ${profile}`);
    }
    checkArtifact(args[0], profile, args.slice(1).filter((arg) => arg !== profileArg));
    return;
  }
  if (command === 'render') {
    if (!args[0]) throw new Error('render requires an index.html path');
    runScript('render-smoke.mjs', args);
    return;
  }
  if (command === 'capture') {
    if (!args[0]) throw new Error('capture requires an index.html path');
    runScript('capture-deck-slides.mjs', args);
    return;
  }
  if (command === 'preflight') {
    runScript('capability-preflight.mjs', args);
    return;
  }
  if (command === 'validate') {
    validateRepository();
    return;
  }
  if (command === 'test') {
    if (args.includes('--strict')) runStrictTests();
    else runStandardTests();
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(`Design CLI failed: ${error.message}`);
  process.exit(1);
}
