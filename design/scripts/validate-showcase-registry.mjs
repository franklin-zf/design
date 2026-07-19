#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function inside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

export function validateShowcaseRegistry(registry, root) {
  const errors = [];
  if (registry?.schema_version !== 'design-showcase-registry/v1') errors.push('registry schema_version must be design-showcase-registry/v1');
  if (!String(registry?.fixture_policy || '').match(/fixtures?.*(not|aren't|are not).*production|not production/i)) errors.push('fixture_policy must state fixtures are not production showcases');
  const gaps = (registry?.coverage_gaps || []).join(' ').toLowerCase();
  for (const type of ['report', 'dashboard', 'poster']) if (!gaps.includes(type)) errors.push(`coverage_gaps must explicitly address ${type}`);
  const ids = new Set();
  for (const [index, item] of (registry?.showcases || []).entries()) {
    if (!item?.id || ids.has(item.id)) errors.push(`showcases[${index}] has missing or duplicate id`);
    ids.add(item?.id);
    if (!['validated_vertical_slice', 'reviewed_production_case'].includes(item?.production_status)) errors.push(`showcase ${item?.id} has ineligible production_status`);
    if (!item?.review_scope) errors.push(`showcase ${item?.id} requires review_scope`);
    if (!Array.isArray(item?.surface_evidence) || item.surface_evidence.length < 2) errors.push(`showcase ${item?.id} requires surface_evidence`);
    for (const ref of [item?.case_ref, ...(item?.surface_evidence || [])]) {
      const path = resolve(root, ref || '');
      if (!ref || !inside(root, path) || !existsSync(path)) errors.push(`showcase ${item?.id} evidence is missing or unsafe: ${ref || '(missing)'}`);
    }
    const casePath = resolve(root, item?.case_ref || '');
    if (inside(root, casePath) && existsSync(casePath)) {
      try {
        const caseRecord = JSON.parse(readFileSync(casePath, 'utf8'));
        if (caseRecord.id !== item.id || caseRecord.artifact_type !== item.artifact_type || caseRecord.template_id !== item.template_id) errors.push(`showcase ${item.id} registry/case identity mismatch`);
        if (caseRecord.assurance?.visually_reviewed === 'not_run') errors.push(`showcase ${item.id} is not visually reviewed`);
        if (!Array.isArray(caseRecord.non_claims) || !caseRecord.non_claims.length) errors.push(`showcase ${item.id} requires explicit non_claims`);
      } catch (error) { errors.push(`showcase ${item.id} case JSON is invalid: ${error.message}`); }
    }
  }
  return errors;
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const root = resolve(process.argv[2] || '.');
  const path = resolve(root, 'showcases/registry.json');
  if (!existsSync(path)) { console.error('Missing showcases/registry.json'); process.exit(1); }
  const errors = validateShowcaseRegistry(JSON.parse(readFileSync(path, 'utf8')), root);
  if (errors.length) {
    console.error('Showcase registry validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('Showcase registry validation passed.');
}
