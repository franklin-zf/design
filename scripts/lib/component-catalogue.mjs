import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateJsonInstance } from './json-schema.mjs';

const allowedComponentGateIds = new Set([
  'render-smoke',
  'validate-aesthetic-contract',
  'validate-component-usage'
]);
const allowedArtifactTypes = new Set([
  'chart-frame',
  'dashboard',
  'data-report',
  'design-system',
  'html-deck',
  'multi-artifact',
  'poster',
  'ppt-handoff',
  'screenshot-evidence',
  'tweakable-artifact'
]);
const admittedCheckStatuses = new Set(['required', 'not_applicable']);
const admittedFallbackStatuses = new Set(['required', 'not_applicable']);
const sha256Pattern = /^[a-f0-9]{64}$/;

export function stableCatalogueStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableCatalogueStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableCatalogueStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

export function catalogueSha256(value) {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : stableCatalogueStringify(value))
    .digest('hex');
}

export function componentSpecification(component) {
  return {
    id: component.id,
    name: component.name,
    technical_class: component.technical_class,
    semantics: component.semantics
  };
}

function componentPrefix(component, index) {
  return component?.id ? `component ${component.id}` : `components[${index}]`;
}

function validateAdmittedComponent(component, errors) {
  const prefix = `component ${component.id}`;
  if (component.ownership !== 'design_owned') {
    errors.push(`${prefix}: admitted components must be Design-owned`);
  }
  if (component.technical_class === 'native_react') {
    errors.push(`${prefix}: native_react is project-local and cannot be admitted`);
  }
  if (component.provenance?.source_kind !== 'design_owned') {
    errors.push(`${prefix}: admitted provenance must be Design-owned`);
  }
  if (component.provenance?.hash_status !== 'verified') {
    errors.push(`${prefix}: admitted provenance hash must be verified`);
  }
  const expectedHash = catalogueSha256(componentSpecification(component));
  if (component.provenance?.source_sha256 !== expectedHash) {
    errors.push(`${prefix}: source hash does not match the Design-owned specification`);
  }
  if (component.license?.status !== 'known') {
    errors.push(`${prefix}: admitted license status must be known`);
  }
  if (['unknown', 'forbidden'].includes(component.license?.redistribution)) {
    errors.push(`${prefix}: admitted redistribution cannot be unknown or forbidden`);
  }
  if (component.license?.notice_requirement === 'unknown') {
    errors.push(`${prefix}: admitted notice requirement cannot be unknown`);
  }
  if (component.implementation?.runtime_dependencies?.length) {
    errors.push(`${prefix}: runtime dependencies are forbidden`);
  }
  if (component.implementation?.remote_origins?.length) {
    errors.push(`${prefix}: runtime network origins are forbidden`);
  }
  for (const [name, fallback] of Object.entries(component.fallback || {})) {
    if (!admittedFallbackStatuses.has(fallback?.status)) {
      errors.push(`${prefix}: ${name} fallback is not verified`);
    }
  }
  for (const [name, status] of Object.entries(component.accessibility || {})) {
    if (!admittedCheckStatuses.has(status)) {
      errors.push(`${prefix}: accessibility check ${name} is not passed`);
    }
  }
  if (component.performance?.status !== 'bounded') {
    errors.push(`${prefix}: performance policy must be bounded`);
  }
  for (const field of [
    'max_js_bytes',
    'max_css_bytes',
    'max_asset_bytes',
    'max_dom_nodes',
    'max_continuous_loops'
  ]) {
    if (!Number.isInteger(component.performance?.[field])) {
      errors.push(`${prefix}: performance.${field} must be measured`);
    }
  }
  if (component.performance?.max_continuous_loops !== 0) {
    errors.push(`${prefix}: continuous loops are forbidden`);
  }
}

export function validateComponentCatalogue(catalogue, schema) {
  const errors = validateJsonInstance(schema, catalogue);
  if (errors.length) return errors;

  const ids = new Set();
  for (const [index, component] of catalogue.components.entries()) {
    const prefix = componentPrefix(component, index);
    if (ids.has(component.id)) errors.push(`${prefix}: duplicate component id`);
    ids.add(component.id);

    if (component.provenance.source_kind !== component.ownership) {
      errors.push(`${prefix}: ownership and provenance source_kind must match`);
    }
    if (component.provenance.hash_status === 'verified'
        && !sha256Pattern.test(component.provenance.source_sha256 || '')) {
      errors.push(`${prefix}: verified provenance requires lowercase SHA-256`);
    }
    if (component.provenance.hash_status === 'unknown'
        && Object.hasOwn(component.provenance, 'source_sha256')) {
      errors.push(`${prefix}: unknown provenance must not provide source_sha256`);
    }
    if (component.implementation.adapter_id !== component.technical_class) {
      errors.push(`${prefix}: adapter_id must match technical_class`);
    }
    if (component.ownership === 'third_party_reference'
        && component.implementation.source_code_included) {
      errors.push(`${prefix}: third-party source code is forbidden`);
    }
    if (component.decision === 'admitted') validateAdmittedComponent(component, errors);
    if (component.decision === 'admitted'
        && !component.required_gate_ids.includes('validate-component-usage')) {
      errors.push(`${prefix}: admitted components require validate-component-usage`);
    }
    if (component.technical_class === 'native_react'
        && component.decision !== 'project_local') {
      errors.push(`${prefix}: native_react must remain project_local`);
    }
    for (const gateId of component.required_gate_ids) {
      if (!allowedComponentGateIds.has(gateId)) {
        errors.push(`${prefix}: unsupported component gate ${gateId}`);
      }
    }
    for (const artifactType of component.compatibility.artifact_types) {
      if (!allowedArtifactTypes.has(artifactType)) {
        errors.push(`${prefix}: unsupported artifact type ${artifactType}`);
      }
    }
  }
  return [...new Set(errors)].sort();
}

export function loadComponentCatalogue(cataloguePath, schemaPath) {
  const catalogue = JSON.parse(readFileSync(resolve(cataloguePath), 'utf8'));
  const schema = JSON.parse(readFileSync(resolve(schemaPath), 'utf8'));
  const errors = validateComponentCatalogue(catalogue, schema);
  if (errors.length) {
    throw new Error(`invalid component catalogue: ${errors.join('; ')}`);
  }
  return catalogue;
}

export function resolveComponentSelection({
  catalogue,
  componentIds,
  templateId,
  artifactType
}) {
  const requestedIds = [...new Set(componentIds || [])].sort();
  if (requestedIds.length !== (componentIds || []).length) {
    throw new Error('component_refs must be unique');
  }
  if (requestedIds.length > 3) {
    throw new Error('component_refs may contain at most three P0 components');
  }

  const byId = new Map(catalogue.components.map((component) => [
    component.id,
    component
  ]));
  const selected = requestedIds.map((componentId) => {
    const component = byId.get(componentId);
    if (!component) throw new Error(`unknown component: ${componentId}`);
    if (component.decision !== 'admitted') {
      throw new Error(`component is not admitted: ${componentId}`);
    }
    if (!component.compatibility.template_ids.includes(templateId)) {
      throw new Error(`component ${componentId} is incompatible with template ${templateId}`);
    }
    if (!component.compatibility.artifact_types.includes(artifactType)) {
      throw new Error(`component ${componentId} is incompatible with ${artifactType}`);
    }
    return {
      component_id: component.id,
      technical_class: component.technical_class,
      record_digest: catalogueSha256(component),
      required_gate_ids: [...component.required_gate_ids].sort()
    };
  });

  return {
    schema_version: 'design-component-resolution/v1',
    catalogue_digest: catalogueSha256(catalogue),
    selected
  };
}
