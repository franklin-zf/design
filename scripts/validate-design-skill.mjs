#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { validateTemplateLayoutContract } from './lib/layout-registry.mjs';

const root = process.argv[2] || '.';
const designProfileArtifactTypes = new Set([
  'dashboard',
  'html-deck',
  'ppt-handoff',
  'poster'
]);
const topologyIds = new Set([
  'comparison-matrix',
  'timeline',
  'causal-chain',
  'system-map',
  'metric-evidence',
  'decision-frame',
  'narrative-arc'
]);
const requiredReferences = [
  'references/deck-ppt.md',
  'references/color-system.md',
  'references/design-standards.md',
  'references/frontend-styles.md',
  'references/library.md',
  'references/media-design.md',
  'references/poster-design.md',
  'references/quality-bar.md',
  'references/report-dashboard.md',
  'references/source-integrity.md',
  'references/advanced-assurance.md',
  'references/tool-routing.md',
  'references/visual-recipes.md',
  'references/web-interface-standards.md',
  'references/workflow.md'
];
const requiredSkillRoutes = [
  'references/design-standards.md',
  'references/workflow.md',
  'references/advanced-assurance.md',
  'references/web-interface-standards.md'
];
const legacyReferences = ['references/tasteful-prompt-library.md'];
const localPathRoots = [
  'SKILL.md',
  'agents',
  'assets',
  'design-systems',
  'docs',
  'examples',
  'package.json',
  'references',
  'schemas',
  'scripts',
  'showcases',
  'tests'
];
const required = [
  'SKILL.md',
  'package.json',
  'agents/openai.yaml',
  'agents/poster.md',
  'agents/designer.md',
  'agents/reviewer.md',
  ...requiredReferences,
  'schemas/artifact-manifest.schema.json',
  'schemas/component-catalogue.schema.json',
  'schemas/color-contract.schema.json',
  'schemas/design-brief.schema.json',
  'schemas/design-profile-catalogue.schema.json',
  'schemas/design-profile.schema.json',
  'schemas/execution-plan.schema.json',
  'schemas/evidence-contract.schema.json',
  'schemas/accessibility-checks.schema.json',
  'schemas/privacy-checks.schema.json',
  'schemas/reviewer-record.schema.json',
  'schemas/machine-attestation.schema.json',
  'schemas/reviewer-registry.schema.json',
  'schemas/reviewer-attestation.schema.json',
  'schemas/approval-rejection.schema.json',
  'schemas/showcase-case.schema.json',
  'schemas/design-case-record.schema.json',
  'schemas/design-evaluation-policy.schema.json',
  'schemas/design-evaluation-record.schema.json',
  'schemas/render-spec.schema.json',
  'schemas/intake-direction.schema.json',
  'schemas/data-provenance.schema.json',
  'schemas/deck-plan.schema.json',
  'schemas/aesthetic-contract.schema.json',
  'schemas/visual-asset.schema.json',
  'schemas/layout-registry.schema.json',
  'schemas/poster-plan.schema.json',
  'schemas/chart-spec.schema.json',
  'schemas/claim-map.schema.json',
  'schemas/summary-map.schema.json',
  'schemas/content-ledger.schema.json',
  'schemas/surface-claims.schema.json',
  'schemas/content-handoff.schema.json',
  'schemas/source-extraction.schema.json',
  'schemas/source-extraction-capability.schema.json',
  'schemas/style-presets.schema.json',
  'schemas/requirement-verification.schema.json',
  'schemas/direction-comparison.schema.json',
  'schemas/reference-registry.schema.json',
  'assets/templates/report.html',
  'assets/templates/dashboard.html',
  'assets/templates/deck.html',
  'assets/templates/swiss-evidence-deck.html',
  'assets/templates/poster.html',
  'assets/runtime/deck-bootstrap.js',
  'assets/runtime/human-factors.css',
  'assets/runtime/human-factors.js',
  'assets/templates/tweakable-artifact.html',
  'assets/templates/registry.json',
  'assets/templates/layouts/poster.json',
  'assets/templates/layouts/swiss-s01-s22.json',
  'assets/templates/handoffs/poster-handoff.json',
  'assets/templates/handoffs/intake-direction.json',
  'assets/templates/handoffs/designer-handoff.json',
  'assets/templates/handoffs/reviewer-report.json',
  'assets/components/registry.json',
  'assets/themes/presets.json',
  'assets/vendor/open-design-html-ppt/LICENSE',
  'assets/vendor/open-design-html-ppt/PROVENANCE.json',
  'assets/vendor/open-design-html-ppt/base.css',
  'assets/vendor/open-design-html-ppt/runtime.js',
  'design-systems/_schema/design-system-package.schema.json',
  'design-systems/_schema/tokens.schema.json',
  'design-systems/_schema/components-manifest.schema.json',
  'design-systems/defaults/design-profile-catalogue.json',
  'design-systems/swiss-deck/manifest.json',
  'design-systems/swiss-deck/DESIGN.md',
  'design-systems/swiss-deck/USAGE.md',
  'design-systems/swiss-deck/tokens.css',
  'design-systems/swiss-deck/design-tokens.json',
  'design-systems/swiss-deck/components.html',
  'design-systems/swiss-deck/components.manifest.json',
  'design-systems/swiss-deck/layouts.css',
  'design-systems/swiss-deck/preview/colors.html',
  'design-systems/swiss-deck/preview/typography.html',
  'design-systems/swiss-deck/preview/spacing.html',
  'design-systems/swiss-deck/preview/deck.html',
  'design-systems/swiss-deck/source/evidence.md',
  'design-systems/swiss-deck/source/token-contract.report.json',
  ...['expressive-web', 'operational-product', 'editorial-evidence'].flatMap(
    (systemId) => [
      `design-systems/${systemId}/manifest.json`,
      `design-systems/${systemId}/DESIGN.md`,
      `design-systems/${systemId}/USAGE.md`,
      `design-systems/${systemId}/tokens.css`,
      `design-systems/${systemId}/design-tokens.json`,
      `design-systems/${systemId}/layouts.css`,
      `design-systems/${systemId}/components.html`,
      `design-systems/${systemId}/components.manifest.json`,
      `design-systems/${systemId}/preview/colors.html`,
      `design-systems/${systemId}/preview/typography.html`,
      `design-systems/${systemId}/preview/spacing.html`,
      `design-systems/${systemId}/preview/deck.html`,
      `design-systems/${systemId}/preview/keyframes.json`,
      `design-systems/${systemId}/source/evidence.md`,
      `design-systems/${systemId}/source/token-contract.report.json`
    ]
  ),
  'design-systems/expressive-web/assets/stage.jpg',
  'design-systems/operational-product/assets/icons.svg',
  'design-systems/operational-product/preview/render-spec.json',
  'assets/templates/expressive-web-stage.html',
  'assets/templates/operational-product.html',
  'assets/templates/editorial-evidence.html',
  'assets/templates/layouts/expressive-web-v1.json',
  'assets/templates/layouts/editorial-evidence-v1.json',
  'scripts/build-production-design-systems.mjs',
  'scripts/validate-color-system.mjs',
  'scripts/validate-design-system-package.mjs',
  'scripts/validate-aesthetic-contract.mjs',
  'scripts/validate-asset-contract.mjs',
  'scripts/validate-layout-lock.mjs',
  'scripts/validate-visual-rhythm.mjs',
  'scripts/validate-poster-contract.mjs',
  'scripts/validate-poster-anti-ai-slop.mjs',
  'scripts/validate-design-output.mjs',
  'scripts/validate-data-provenance.mjs',
  'scripts/validate-vendor-provenance.mjs',
  'scripts/test-data-provenance-negative.mjs',
  'scripts/capture-deck-slides.mjs',
  'scripts/validate-deck-capture-set.mjs',
  'scripts/capture-deck-contact-sheets.mjs',
  'scripts/capture-component-pilot-states.mjs',
  'scripts/validate-intake-direction.mjs',
  'scripts/compile-execution-plan.mjs',
  'scripts/run-execution-plan.mjs',
  'scripts/migrate-execution-request-v1.mjs',
  'scripts/validate-evidence-contract.mjs',
  'scripts/validate-install-parity.mjs',
  'scripts/validate-component-catalogue.mjs',
  'scripts/validate-component-pilots.mjs',
  'scripts/validate-component-usage.mjs',
  'scripts/validate-design-profile-catalogue.mjs',
  'scripts/validate-packed-references.mjs',
  'scripts/resolve-design-profile.mjs',
  'scripts/validate-showcase-registry.mjs',
  'scripts/lib/component-catalogue.mjs',
  'scripts/lib/design-profile.mjs',
  'scripts/lib/execution-plan-binding.mjs',
  'scripts/lib/layout-registry.mjs',
  'scripts/lib/skill-identity.mjs',
  'scripts/lib/playwright-runtime.mjs',
  'scripts/lib/png.mjs',
  'scripts/lib/human-factors.mjs',
  'scripts/lib/json-schema.mjs',
  'scripts/validate-schemas.mjs',
  'scripts/render-smoke.mjs',
  'scripts/capture-direction-previews.mjs',
  'scripts/capture-keyframes.mjs',
  'scripts/tweakable-smoke.mjs',
  'scripts/capability-preflight.mjs',
  'scripts/validate-claim-map.mjs',
  'scripts/validate-summary-map.mjs',
  'scripts/validate-content-ledger.mjs',
  'scripts/validate-content-chain.mjs',
  'scripts/validate-content-handoff.mjs',
  'scripts/validate-visual-encoding.mjs',
  'scripts/validate-source-extraction.mjs',
  'scripts/validate-requirement-verification.mjs',
  'scripts/validate-direction-evidence.mjs',
  'scripts/validate-design-evaluation.mjs',
  'scripts/validate-visual-review.mjs',
  'scripts/bind-human-factors.mjs',
  'scripts/audit-human-factors.mjs',
  'scripts/design.mjs',
  'scripts/validate-code-style.mjs',
  'scripts/expect-fail.mjs',
  'scripts/check-empty-qa.mjs'
];

function toPosix(value) {
  return value.split(sep).join('/');
}

function isPackaged(path, packageRoots) {
  const normalized = toPosix(normalize(path));
  return packageRoots.some((entry) =>
    normalized === entry || normalized.startsWith(`${entry}/`)
  );
}

function cleanLocalPath(value) {
  return value.trim()
    .replace(/^[`'"(<]+|[`'">),.;:]+$/g, '')
    .replace(/[?#].*$/, '');
}

function extractDocumentPaths(text) {
  const paths = new Set();
  const add = (value, allowBare = false) => {
    const candidate = cleanLocalPath(value);
    if (!candidate || /^(?:[a-z][a-z0-9+.-]*:|#|mailto:|data:)/i.test(candidate)) return;
    const rooted = isAbsolute(candidate)
      || candidate.startsWith('./')
      || candidate.startsWith('../')
      || localPathRoots.some((entry) =>
        candidate === entry || candidate.startsWith(`${entry}/`)
      );
    if (rooted || (allowBare && /\.[A-Za-z0-9]+$/.test(candidate))) paths.add(candidate);
  };

  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) {
    add(match[1], true);
  }
  for (const match of text.matchAll(/`([^`\n]+)`/g)) add(match[1]);
  return [...paths];
}

function resolveDocumentPath(source, rawPath) {
  let target;
  if (isAbsolute(rawPath)) target = rawPath;
  else if (rawPath.startsWith('./') || rawPath.startsWith('../')) {
    target = toPosix(normalize(join(dirname(source), rawPath)));
  } else {
    target = toPosix(normalize(rawPath));
  }
  const rootPath = resolve(root);
  const absolute = resolve(rootPath, target);
  const escaped = isAbsolute(target)
    || target === '..'
    || target.startsWith('../')
    || (relative(rootPath, absolute) !== '' && relative(rootPath, absolute).startsWith(`..${sep}`));
  return { target, escaped, absolute };
}

const errors = [];
for (const file of required) {
  if (!existsSync(join(root, file))) errors.push(`Missing required file: ${file}`);
}

const referencesPath = join(root, 'references');
if (existsSync(referencesPath)) {
  const actualReferences = readdirSync(referencesPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => `references/${entry.name}`)
    .sort();
  const expectedReferences = [...requiredReferences].sort();
  if (JSON.stringify(actualReferences) !== JSON.stringify(expectedReferences)) {
    errors.push(
      `references/ must contain exactly the ${expectedReferences.length}-reference SSOT: ${expectedReferences.join(', ')}`
    );
  }
}

let packageRoots = [];
const packagePath = join(root, 'package.json');
if (existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    if (!Array.isArray(packageJson.files) || packageJson.files.some((entry) => typeof entry !== 'string')) {
      errors.push('package.json files must be an array of package-root paths.');
    } else {
      packageRoots = packageJson.files.map((entry) => toPosix(normalize(entry)));
    }
  } catch (error) {
    errors.push(`Invalid package.json: ${error.message}`);
  }
}

for (const source of ['SKILL.md', ...requiredReferences]) {
  const sourcePath = join(root, source);
  if (!existsSync(sourcePath)) continue;
  const text = readFileSync(sourcePath, 'utf8');
  for (const legacyReference of legacyReferences) {
    if (text.includes(legacyReference)) {
      errors.push(`${source} contains legacy reference: ${legacyReference}`);
    }
  }
  for (const rawPath of extractDocumentPaths(text)) {
    const resolvedPath = resolveDocumentPath(source, rawPath);
    if (resolvedPath.escaped) {
      errors.push(`${source} reference escapes package root: ${rawPath}`);
      continue;
    }
    if (!existsSync(resolvedPath.absolute)) {
      errors.push(`${source} references a missing or unknown path: ${rawPath}`);
      continue;
    }
    if (!isPackaged(resolvedPath.target, packageRoots)) {
      errors.push(`${source} references a path outside package files: ${rawPath}`);
    }
  }
}

const skillPath = join(root, 'SKILL.md');
if (existsSync(skillPath)) {
  const skill = readFileSync(skillPath, 'utf8');
  if (!/^---\nname: design\n/m.test(skill)) errors.push('SKILL.md frontmatter must name the skill design.');
  if (!/description: .{80,}/m.test(skill)) errors.push('SKILL.md description is too short to trigger reliably.');
  if (/\[TODO\]|\[TODO:/.test(skill)) errors.push('SKILL.md still contains TODO placeholders.');

  for (const reference of requiredSkillRoutes) {
    if (!skill.includes(`\`${reference}\``)) {
      errors.push(`SKILL.md progressive loading route is missing: ${reference}`);
    }
  }
  for (const reference of legacyReferences) {
    if (skill.includes(reference)) errors.push(`SKILL.md contains legacy reference: ${reference}`);
  }
  const routedReferences = new Set(skill.match(/references\/[A-Za-z0-9._/-]+\.md/g) || []);
  for (const reference of routedReferences) {
    if (!requiredReferences.includes(reference) || !existsSync(join(root, reference))) {
      errors.push(`SKILL.md routes to an unknown or missing reference: ${reference}`);
    }
  }
}

const agentPath = join(root, 'agents/openai.yaml');
if (existsSync(agentPath)) {
  const agentConfig = readFileSync(agentPath, 'utf8');
  for (const marker of [
    'interface:',
    'display_name:',
    'short_description:',
    'default_prompt:',
    'policy:',
    'allow_implicit_invocation: true'
  ]) {
    if (!agentConfig.includes(marker)) errors.push(`agents/openai.yaml missing marker: ${marker}`);
  }
  if (!agentConfig.includes('$design')) errors.push('agents/openai.yaml default_prompt must mention $design.');
}

const presetsPath = join(root, 'assets/themes/presets.json');
if (existsSync(presetsPath)) {
  try {
    const presets = JSON.parse(readFileSync(presetsPath, 'utf8'));
    for (const id of ['neutral-analytic', 'editorial-report', 'swiss-deck', 'magazine-deck', 'operational-dashboard', 'tweakable-lab']) {
      if (!presets.presets?.[id]) errors.push(`Missing style preset: ${id}`);
    }
  } catch (error) {
    errors.push(`Invalid presets JSON: ${error.message}`);
  }
}

const templateRegistryPath = join(root, 'assets/templates/registry.json');
if (existsSync(templateRegistryPath)) {
  try {
    const registry = JSON.parse(readFileSync(templateRegistryPath, 'utf8'));
    const knownGateIds = new Set([
      'validate-design-brief',
      'validate-data-provenance',
      'validate-evidence-contract',
      'validate-claim-map',
      'validate-summary-map',
      'validate-source-extraction',
      'validate-content-ledger',
      'validate-content-chain',
      'validate-content-handoff',
      'validate-requirement-verification',
      'validate-direction-evidence',
      'validate-visual-encoding',
      'validate-aesthetic-contract',
      'validate-accessibility',
      'validate-privacy',
      'validate-render-spec',
      'validate-design-output',
      'validate-poster-plan',
      'validate-poster-contract',
      'validate-poster-anti-ai-slop',
      'validate-asset-contract',
      'validate-layout-lock',
      'validate-visual-rhythm',
      'validate-design-system-package',
      'render-smoke',
      'tweakable-smoke',
      'manual-reviewer-pass'
    ]);
    if (registry.schema_version !== 'design-template-registry/v1') {
      errors.push('assets/templates/registry.json schema_version must be design-template-registry/v1.');
    }
    if (!Array.isArray(registry.templates) || registry.templates.length === 0) {
      errors.push('assets/templates/registry.json must include a non-empty templates array.');
    }
    const ids = new Set();
    for (const [index, entry] of (registry.templates || []).entries()) {
      for (const field of ['id', 'name', 'artifact_types', 'style_presets', 'source', 'best_for', 'avoid_when', 'required_assets', 'validation_gates', 'thinking_ref']) {
        if (!(field in entry)) errors.push(`assets/templates/registry.json templates[${index}] missing ${field}.`);
      }
      for (const field of ['validation_gates', 'validation_gate_ids', 'conditional_validation_gates']) {
        if (field in entry && (!Array.isArray(entry[field]) || entry[field].some((gate) => typeof gate !== 'string' || !gate.trim()))) {
          errors.push(`Template ${entry.id || index} ${field} must be an array of non-empty strings.`);
        }
      }
      for (const field of ['validation_gate_ids', 'conditional_validation_gates']) {
        for (const rawGate of entry[field] || []) {
          if (!knownGateIds.has(rawGate)) errors.push(`Template ${entry.id || index} references unknown gate: ${rawGate}`);
        }
      }
      if (entry.id) {
        if (ids.has(entry.id)) errors.push(`Duplicate template id: ${entry.id}`);
        ids.add(entry.id);
      }
      if (entry.thinking_ref && !existsSync(join(root, entry.thinking_ref))) {
        errors.push(`Template ${entry.id || index} thinking_ref does not exist: ${entry.thinking_ref}`);
      }
      const supportsProfileSurface = (entry.artifact_types || []).some(
        (artifactType) => designProfileArtifactTypes.has(artifactType)
      );
      if (supportsProfileSurface) {
        if (!entry.layout_registry_ref) {
          errors.push(`Template ${entry.id || index} must declare layout_registry_ref.`);
        }
        if (!entry.topology_support || typeof entry.topology_support !== 'object') {
          errors.push(`Template ${entry.id || index} must declare topology_support.`);
        }
        for (const [topologyId, layouts] of Object.entries(entry.topology_support || {})) {
          if (!topologyIds.has(topologyId)) {
            errors.push(`Template ${entry.id || index} has unknown topology: ${topologyId}`);
          }
          if (!Array.isArray(layouts) || layouts.length === 0
              || layouts.some((layout) => typeof layout !== 'string' || !layout)) {
            errors.push(
              `Template ${entry.id || index} topology ${topologyId} needs layout ids.`
            );
          }
        }
        errors.push(...validateTemplateLayoutContract(entry, root));
      }
    }
  } catch (error) {
    errors.push(`Invalid template registry JSON: ${error.message}`);
  }
}

if (errors.length) {
  console.error('Design skill validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Design skill validation passed.');
