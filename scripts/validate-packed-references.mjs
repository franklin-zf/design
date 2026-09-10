#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isSafeRelative(path) {
  if (typeof path !== 'string' || !path || isAbsolute(path)) return false;
  const normalized = normalize(path);
  return normalized !== '..' && !normalized.startsWith(`..${sep}`);
}

function isExternalReference(path) {
  return typeof path === 'string' && /^[a-z][a-z0-9+.-]*:\/\//i.test(path);
}

function isPackaged(path, packageRoots) {
  const normalized = normalize(path).split(sep).join('/');
  return packageRoots.some((root) => normalized === root || normalized.startsWith(`${root}/`));
}

function collectReferences(root) {
  const references = [];
  const templates = readJson(join(root, 'assets/templates/registry.json')).templates;
  for (const template of templates) {
    if (template.thinking_ref) references.push([`template ${template.id} thinking_ref`, template.thinking_ref]);
    if (template.template_path) references.push([`template ${template.id} template_path`, template.template_path]);
    if (template.layout_registry_ref) {
      references.push([
        `template ${template.id} layout_registry_ref`,
        template.layout_registry_ref
      ]);
    }
    for (const path of template.showcase_refs || []) {
      references.push([`template ${template.id} showcase_ref`, path]);
    }
  }

  const components = readJson(join(root, 'assets/components/registry.json')).components;
  for (const component of components) {
    const licenseRef = component.license?.evidence_ref;
    if (licenseRef) references.push([`component ${component.id} license evidence`, licenseRef]);
    for (const path of component.evidence_refs || []) {
      references.push([`component ${component.id} evidence_ref`, path]);
    }
    for (const path of component.implementation?.materialized_files || []) {
      references.push([`component ${component.id} materialized_file`, path]);
    }
  }
  return references;
}

export function validatePackedReferences(root = '.') {
  const resolvedRoot = resolve(root);
  const packageJson = readJson(join(resolvedRoot, 'package.json'));
  const packageRoots = packageJson.files || [];
  const errors = [];
  const references = collectReferences(resolvedRoot).filter(
    ([, path]) => !isExternalReference(path)
  );
  for (const [label, path] of references) {
    if (!isSafeRelative(path)) {
      errors.push(`${label} is not a safe relative path: ${path}`);
      continue;
    }
    if (!existsSync(join(resolvedRoot, path))) errors.push(`${label} is missing: ${path}`);
    if (!isPackaged(path, packageRoots)) errors.push(`${label} is excluded from package files: ${path}`);
  }
  return { errors, referenceCount: references.length };
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] || '.';
  const result = validatePackedReferences(root);
  if (result.errors.length) {
    console.error('Packed reference validation failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Packed reference validation passed: ${result.referenceCount} references.`);
}
