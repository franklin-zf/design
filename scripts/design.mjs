#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const script = (name) => join(root, 'scripts', name);
const supportedProfiles = new Set(['express', 'standard', 'assured']);

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

function checkArtifact(
  artifact,
  profile = 'standard',
  assuranceArgs = [],
  {
    executionPlanPath = null,
    requireCorePlan = false,
    requireCompleteEvaluation = false
  } = {}
) {
  if (!supportedProfiles.has(profile)) throw new Error(`Unsupported profile: ${profile}`);
  const artifactRoot = resolve(artifact);
  const manifest = readManifest(artifactRoot);
  const coreArtifactTypes = new Set(['html-deck', 'ppt-handoff', 'poster']);
  if (requireCorePlan && coreArtifactTypes.has(manifest.artifact_type)
      && !executionPlanPath) {
    throw new Error(
      `${manifest.artifact_type} check requires --execution-plan=<path>`
    );
  }
  const planArgs = executionPlanPath
    ? [`--execution-plan=${resolve(executionPlanPath)}`]
    : [];

  runScript('validate-design-output.mjs', [artifactRoot, ...planArgs]);
  if (existsSync(join(artifactRoot, 'summary-map.json'))) {
    runScript('validate-summary-map.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'claim-map.json'))) {
    runScript('validate-claim-map.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'content-ledger.json'))) {
    runScript('validate-content-ledger.mjs', [join(artifactRoot, 'content-ledger.json')]);
  }
  if (existsSync(join(artifactRoot, 'surface-claims.json'))) {
    runScript('validate-content-chain.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'content-handoff.json'))) {
    runScript('validate-content-handoff.mjs', [join(artifactRoot, 'content-handoff.json')]);
  }
  if (existsSync(join(artifactRoot, 'requirement-verification.json'))
      || manifest.validation?.applicable_gates?.includes(
        'validate-requirement-verification'
      )) {
    runScript('validate-requirement-verification.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'direction-comparison.json'))
      || manifest.validation?.applicable_gates?.includes('validate-direction-evidence')) {
    runScript('validate-direction-evidence.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'design-evaluation.json'))
      || manifest.validation?.applicable_gates?.includes('validate-design-evaluation')) {
    const policyRoot = process.env.DESIGN_KNOWLEDGE_ROOT || root;
    const evaluationArgs = [artifactRoot, `--policy-root=${policyRoot}`];
    if (requireCompleteEvaluation) evaluationArgs.push('--require-complete');
    runScript('validate-design-evaluation.mjs', evaluationArgs);
  }
  if (['data-report', 'dashboard', 'chart-frame'].includes(manifest.artifact_type)
      && manifest.validation?.applicable_gates?.includes('validate-visual-encoding')) {
    runScript('validate-visual-encoding.mjs', [artifactRoot]);
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
    runScript('validate-layout-lock.mjs', [artifactRoot, ...planArgs]);
    runScript('validate-visual-rhythm.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'poster-plan.json'))) {
    runScript('validate-poster-contract.mjs', [artifactRoot, ...planArgs]);
    runScript('validate-poster-anti-ai-slop.mjs', [artifactRoot]);
  }
  if (existsSync(join(artifactRoot, 'reviewer-record.json'))) {
    runScript('validate-visual-review.mjs', [artifactRoot]);
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
  runScript('validate-color-system.mjs', ['.']);
  runScript('validate-design-profile-catalogue.mjs', ['.']);
  runScript('validate-packed-references.mjs', ['.']);
  runScript('validate-component-catalogue.mjs', ['.']);
  runScript('validate-vendor-provenance.mjs', ['.']);
  for (const systemId of [
    'swiss-deck',
    'expressive-web',
    'operational-product',
    'editorial-evidence'
  ]) {
    runScript('validate-design-system-package.mjs', ['.', systemId]);
  }
  if (existsSync(join(root, 'examples'))) {
    runScript('validate-component-pilots.mjs', [
      'examples/component-deck-pilot-pass',
      'examples/component-operational-pilot-pass'
    ]);
    checkArtifact('examples/component-deck-pilot-pass');
    checkArtifact('examples/component-operational-pilot-pass', 'standard');
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
    ['validate-design-output.mjs', 'missing valid status field: artifact_status', 'invalid-false-ready'],
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
    'tests/color-system.test.mjs',
    'tests/design-profile.test.mjs',
    'tests/design-spec-record.test.mjs',
    'tests/distill-spec.test.mjs',
    'tests/extract-primitives.test.mjs',
    'tests/design-knowledge-query.test.mjs',
    'tests/component-usage.test.mjs',
    'tests/component-pilots.test.mjs',
    'tests/json-schema.test.mjs',
    'tests/playwright-runtime.test.mjs',
    'tests/packed-references.test.mjs',
    'tests/execution-plan.test.mjs',
    'tests/execution-runner.test.mjs',
    'tests/evidence-contract.test.mjs',
    'tests/content-ledger.test.mjs',
    'tests/content-chain.test.mjs',
    'tests/content-handoff.test.mjs',
    'tests/requirement-verification.test.mjs',
    'tests/visual-encoding.test.mjs',
    'tests/direction-evidence.test.mjs',
    'tests/keyframe-capture.test.mjs',
    'tests/visual-review.test.mjs',
    'tests/production-design-systems.test.mjs',
    'tests/design-evaluation.test.mjs',
    'tests/source-extraction.test.mjs',
    'tests/install-parity.test.mjs',
    'tests/migration.test.mjs',
    'tests/showcase-registry.test.mjs',
    'tests/validators.test.mjs'
  ], 'node test suites');
  validateRepository();
  validateIntake();
  runScript('validate-data-provenance.mjs', ['examples/swiss-evidence-deck-production-pass']);
  runScript('validate-design-spec.mjs', ['design-knowledge']);
  runScript('validate-content-ledger.mjs', [
    'tests/fixtures/history/content-integrity/content-ledger.json'
  ]);
  runScript('validate-source-extraction.mjs', ['examples/source-extraction-pass']);
  runScript('validate-content-chain.mjs', ['examples/content-chain-pass']);
  runScript('validate-content-handoff.mjs', ['examples/content-handoff-pass/content-handoff.json']);
  for (const fixture of positiveArtifacts) checkArtifact(`examples/${fixture}`);
  validateNegativeFixtures();
  runScript('check-empty-qa.mjs', ['examples']);
}

function runStrictTests() {
  runScript('capability-preflight.mjs', ['--require=browser_launch']);
  runNode(['--test', 'tests/render-spec-browser.test.mjs']);
  runNode(['--test', 'tests/component-pilots-browser.test.mjs']);
  runNode(['--test', 'tests/human-factors-browser.test.mjs']);
  for (const fixture of ['component-deck-pilot-pass', 'component-operational-pilot-pass']) {
    runScript('render-smoke.mjs', [
      `examples/${fixture}/index.html`,
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout'
    ]);
  }
  for (const systemId of [
    'expressive-web',
    'operational-product',
    'editorial-evidence'
  ]) {
    runScript('render-smoke.mjs', [
      `design-systems/${systemId}/components.html`,
      `design-systems/${systemId}/qa`,
      '--viewports=desktop,mobile,small-phone',
      '--strict-layout'
    ]);
    if (systemId === 'operational-product') {
      const renderSpecRef = `design-systems/${systemId}/preview/render-spec.json`;
      const renderSpec = JSON.parse(readFileSync(join(root, renderSpecRef)));
      runScript('render-smoke.mjs', [
        `design-systems/${systemId}/components.html`,
        `design-systems/${systemId}/qa/render-spec`,
        '--viewports=desktop,mobile,small-phone',
        '--strict-layout',
        `--spec=${renderSpecRef}`,
        `--profile-out=design-systems/${systemId}/qa/render-profile.json`,
        `--artifact-digest=${renderSpec.artifact_digest}`,
        `--plan-digest=${renderSpec.resolved_plan_digest}`
      ]);
    }
    runScript('capture-keyframes.mjs', [
      `design-systems/${systemId}/components.html`,
      `--spec=design-systems/${systemId}/preview/keyframes.json`,
      `--out=design-systems/${systemId}/qa/keyframes`
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
    'profile <brief.json> --artifact-type=<ppt-handoff|html-deck|poster> [--out=<path>]',
    'plan <request.json> [--design-profile=<path> --out=<path> --shadow]',
    'check <artifact-dir> [--profile=express|standard|assured] [--execution-plan=<path>] [--require-complete-evaluation] [assurance options]',
    'preflight [capability options]'
  ].map((line) => `  ${line}`).join('\n')}\n\n`
    + 'Debugging and repository-maintenance commands are documented in '
    + 'references/workflow.md.\n');
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
  if (command === 'profile') {
    if (!args[0]) throw new Error('profile requires a brief.json path');
    runScript('resolve-design-profile.mjs', args);
    return;
  }
  if (command === 'check') {
    if (!args[0]) throw new Error('check requires an artifact directory');
    const profileArg = args.find((arg) => arg.startsWith('--profile='));
    const executionPlanArg = args.find(
      (arg) => arg.startsWith('--execution-plan=')
    );
    const requireCompleteEvaluation = args.includes('--require-complete-evaluation');
    const profile = profileArg?.slice(10) || 'standard';
    if (!supportedProfiles.has(profile)) {
      throw new Error(`Unsupported profile: ${profile}`);
    }
    checkArtifact(
      args[0],
      profile,
      args.slice(1).filter(
        (arg) => arg !== profileArg
          && arg !== executionPlanArg
          && arg !== '--require-complete-evaluation'
      ),
      {
        executionPlanPath: executionPlanArg?.slice('--execution-plan='.length),
        requireCorePlan: true,
        requireCompleteEvaluation
      }
    );
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
  if (command === 'directions') {
    if (!args[0]) throw new Error('directions requires an artifact directory');
    runScript('validate-direction-evidence.mjs', args);
    return;
  }
  if (command === 'bind-human-factors') {
    runScript('bind-human-factors.mjs', args);
    return;
  }
  if (command === 'audit-human-factors') {
    runScript('audit-human-factors.mjs', args);
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
