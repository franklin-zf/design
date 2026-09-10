import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './json-schema.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || isAbsolute(value)) return false;
  const normalized = normalize(value);
  return normalized !== '..' && !normalized.startsWith(`..${sep}`);
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

export function loadLayoutRegistry(reference, root = packageRoot) {
  if (!safeRelativePath(reference)) {
    throw new Error(`layout registry reference must be a safe relative path: ${reference}`);
  }
  const registry = readJson(resolve(root, reference), `layout registry ${reference}`);
  const schema = readJson(
    resolve(root, 'schemas/layout-registry.schema.json'),
    'layout registry schema'
  );
  const errors = validateJsonInstance(schema, registry);
  if (errors.length) {
    throw new Error(`layout registry ${reference} is invalid:\n- ${errors.join('\n- ')}`);
  }
  const ids = registry.layouts.map((layout) => layout.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`layout registry ${reference} contains duplicate layout ids`);
  }
  return { registry, ids: new Set(ids) };
}

export function validateTemplateLayoutContract(template, root = packageRoot) {
  const errors = [];
  if (typeof template?.layout_registry_ref !== 'string') {
    return [`template ${template?.id || '<unknown>'} must declare layout_registry_ref`];
  }
  let layoutIds;
  try {
    layoutIds = loadLayoutRegistry(template.layout_registry_ref, root).ids;
  } catch (error) {
    return [error.message];
  }
  for (const [topologyId, layouts] of Object.entries(
    template.topology_support || {}
  )) {
    for (const layoutId of layouts || []) {
      if (!layoutIds.has(layoutId)) {
        errors.push(
          `template ${template.id} topology ${topologyId} references `
          + `unknown layout ${layoutId} in ${template.layout_registry_ref}`
        );
      }
    }
  }
  return errors;
}
