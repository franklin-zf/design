#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const contractSchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/evidence-contract.schema.json'), 'utf8'));
const accessibilitySchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/accessibility-checks.schema.json'), 'utf8'));
const privacySchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/privacy-checks.schema.json'), 'utf8'));
const reviewerSchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/reviewer-record.schema.json'), 'utf8'));
const machineAttestationSchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/machine-attestation.schema.json'), 'utf8'));
const reviewerRegistrySchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/reviewer-registry.schema.json'), 'utf8'));
const reviewerAttestationSchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/reviewer-attestation.schema.json'), 'utf8'));
const approvalRejectionSchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/approval-rejection.schema.json'), 'utf8'));
const renderSpecSchema = JSON.parse(readFileSync(join(skillRoot, 'schemas/render-spec.schema.json'), 'utf8'));
const shaPattern = /^[a-f0-9]{64}$/;

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function inside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function hasVisibleSchematicDisclosure(html) {
  const tags = [...html.matchAll(/<[^>]*\bdata-schematic-disclosure(?:\s*=\s*(?:["'][^"']*["']|[^\s>]+))?[^>]*>/gi)].map((match) => match[0]);
  return tags.some((tag) => {
    if (/\shidden(?:\s|=|>)/i.test(tag)) return false;
    if (/\saria-hidden\s*=\s*["']?true["']?/i.test(tag)) return false;
    const style = tag.match(/\sstyle\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    if (/(?:^|;)\s*display\s*:\s*none\b/i.test(style)) return false;
    if (/(?:^|;)\s*visibility\s*:\s*hidden\b/i.test(style)) return false;
    return true;
  });
}

export function computeArtifactDigest(root) {
  const excluded = new Set([
    'evidence-contract.json', 'reviewer-record.json', 'accessibility-checks.json',
    'privacy-checks.json', 'render-profile.json'
  ]);
  const entries = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      const rel = relative(root, path).split('\\').join('/');
      if (rel.startsWith('.design/') || rel.startsWith('qa/') || excluded.has(rel)) continue;
      const metadata = lstatSync(path);
      if (metadata.isSymbolicLink()) {
        throw new Error(`artifact digest rejects symbolic link: ${rel}`);
      }
      if (metadata.isDirectory()) walk(path);
      else if (metadata.isFile()) {
        entries.push({ path: rel, sha256: sha256(readFileSync(path)) });
      }
    }
  }
  walk(root);
  return sha256(stable(entries.sort((a, b) => a.path.localeCompare(b.path))));
}

export function validateEvidenceContract(directory, options = {}) {
  const errors = [];
  if (!existsSync(directory)) return ['artifact directory does not exist'];
  const root = realpathSync(directory);
  let coreDigest;
  try {
    coreDigest = computeArtifactDigest(root);
  } catch (error) {
    return [`artifact digest failed: ${error.message}`];
  }
  const readJson = (ref, label, required = true) => {
    if (typeof ref !== 'string' || !ref || isAbsolute(ref) || ref.split('/').some((part) => part === '..')) {
      if (required) errors.push(`${label} must be a safe artifact-relative path`);
      return null;
    }
    const path = resolve(root, ref);
    if (!inside(root, path) || !existsSync(path) || lstatSync(path).isSymbolicLink()) {
      if (required) errors.push(`${label} is missing, unsafe, or a symlink: ${ref}`);
      return null;
    }
    const real = realpathSync(path);
    if (!inside(root, real) || !statSync(real).isFile()) {
      errors.push(`${label} must resolve to a regular artifact file: ${ref}`);
      return null;
    }
    try { return { value: JSON.parse(readFileSync(real, 'utf8')), path: real }; }
    catch (error) { errors.push(`${label} is invalid JSON: ${error.message}`); return null; }
  };
  const readExternalJson = (path, label) => {
    if (typeof path !== 'string' || !isAbsolute(path) || !existsSync(path)) {
      errors.push(`${label} requires an existing absolute host-supplied path`);
      return null;
    }
    if (lstatSync(path).isSymbolicLink()) {
      errors.push(`${label} cannot be a symlink`);
      return null;
    }
    const real = realpathSync(path);
    if (inside(root, real) || !statSync(real).isFile()) {
      errors.push(`${label} must be a regular file outside the artifact`);
      return null;
    }
    try {
      return {
        value: JSON.parse(readFileSync(real, 'utf8')),
        path: real,
        sha256: sha256(readFileSync(real))
      };
    } catch (error) {
      errors.push(`${label} is invalid JSON: ${error.message}`);
      return null;
    }
  };

  const manifestFile = readJson('manifest.json', 'manifest');
  const contractFile = readJson('evidence-contract.json', 'evidence contract');
  if (!manifestFile || !contractFile) return errors;
  const manifest = manifestFile.value;
  const contract = contractFile.value;
  errors.push(...validateJsonInstance(contractSchema, contract).map((error) => `evidence-contract ${error}`));
  const htmlPath = join(root, 'index.html');
  const html = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : '';
  if (!html) errors.push('index.html is required');
  if (manifest.schematic === true) {
    if (!hasVisibleSchematicDisclosure(html)) errors.push('schematic artifact requires visible data-schematic-disclosure');
    if (contract.delivery_status === 'candidate_ready') {
      errors.push('schematic artifact cannot use delivery_status candidate_ready');
    }
  }

  const inventoryFile = readJson(contract.source_inventory_ref, 'source inventory');
  const claimFile = readJson(contract.claim_map_ref, 'claim map');
  const contentDigest = inventoryFile && claimFile ? sha256(stable({
    source_inventory_sha256: sha256(readFileSync(inventoryFile.path)),
    claim_map_sha256: sha256(readFileSync(claimFile.path))
  })) : null;
  if (contract.content_digest !== contentDigest) errors.push('evidence contract content_digest mismatch');
  const sourceBacked = manifest.schematic !== true && Array.isArray(manifest.source_materials) && manifest.source_materials.length > 0;
  const inventory = inventoryFile?.value;
  if (sourceBacked && (!inventory || inventory.schema_version !== 'design-source-inventory/v2' || !Array.isArray(inventory.sources) || !inventory.sources.length)) {
    errors.push('source-backed non-schematic artifact requires non-empty design-source-inventory/v2');
  }
  const sourceIds = new Set();
  const sourceFiles = new Map();
  for (const [index, source] of (inventory?.sources || []).entries()) {
    if (!source?.id || sourceIds.has(source.id)) errors.push(`source inventory duplicate or missing id at ${index}`);
    else sourceIds.add(source.id);
    let path = null;
    if (typeof source?.path === 'string') {
      const candidate = resolve(root, source.path);
      if (inside(root, candidate) && existsSync(candidate) && !lstatSync(candidate).isSymbolicLink() && statSync(candidate).isFile()) path = candidate;
    }
    if (!path) errors.push(`source inventory ${source?.id} path is not a readable regular artifact file`);
    if (!shaPattern.test(String(source?.sha256 || ''))) errors.push(`source inventory ${source?.id} requires lowercase SHA-256`);
    else if (path && sha256(readFileSync(path)) !== source.sha256) errors.push(`source inventory ${source.id} SHA-256 mismatch`);
    if (path && source?.id) sourceFiles.set(source.id, { path, text: readFileSync(path, 'utf8') });
  }

  const claims = claimFile?.value?.claims;
  if (sourceBacked && (!Array.isArray(claims) || !claims.length)) errors.push('source-backed non-schematic artifact requires claims');
  const mappedIdList = (claims || []).map((claim) => claim.id).filter(Boolean);
  const visibleIdList = [...html.matchAll(/data-claim-id=["']([^"']+)["']/gi)].map((match) => match[1]);
  const mappedIds = new Set(mappedIdList);
  const visibleIds = new Set(visibleIdList);
  for (const id of mappedIds) if (mappedIdList.filter((value) => value === id).length !== 1) errors.push(`claim id ${id} must be mapped exactly once`);
  for (const id of visibleIds) if (visibleIdList.filter((value) => value === id).length !== 1) errors.push(`data-claim-id ${id} must be visible exactly once`);
  for (const id of mappedIds) if (!visibleIds.has(id)) errors.push(`claim ${id} has no visible data-claim-id`);
  for (const id of visibleIds) if (!mappedIds.has(id)) errors.push(`visible data-claim-id ${id} has no claim-map entry`);
  for (const [index, claim] of (claims || []).entries()) {
    for (const sourceId of claim.source_ids || []) if (!sourceIds.has(sourceId)) errors.push(`claims[${index}] references unknown source id ${sourceId}`);
    if (claim.claim_class !== 'source_fact') continue;
    if (!Array.isArray(claim.numeric_facts)) errors.push(`source_fact claim ${claim.id} requires numeric_facts array`);
    const element = html.match(new RegExp(`<[^>]+data-claim-id=["']${String(claim.id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'))?.[1] || '';
    const visibleText = element.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const [factIndex, fact] of (claim.numeric_facts || []).entries()) {
      for (const field of ['value', 'unit', 'metric', 'entity', 'period', 'denominator', 'grain', 'sign', 'currency']) {
        if (typeof fact?.[field] !== 'string' || !fact[field]) errors.push(`claim ${claim.id} numeric_facts[${factIndex}] missing ${field}`);
      }
      if (!Number.isInteger(fact?.occurrence_count) || fact.occurrence_count < 1) errors.push(`claim ${claim.id} numeric_facts[${factIndex}] requires positive occurrence_count`);
      if (!fact?.source_id || !sourceIds.has(fact.source_id)) errors.push(`claim ${claim.id} numeric_facts[${factIndex}] requires known source_id`);
      if (typeof fact?.evidence_text !== 'string' || !fact.evidence_text) {
        errors.push(`claim ${claim.id} numeric_facts[${factIndex}] requires evidence_text`);
      } else {
        const source = sourceFiles.get(fact.source_id);
        if (!source?.text.includes(fact.evidence_text)) errors.push(`claim ${claim.id} numeric evidence_text is not present in source ${fact.source_id}`);
        const signedValue = ['+', '-'].includes(fact.sign) ? `${fact.sign}${fact.value}` : fact.value;
        const contextFields = ['metric', 'entity', 'period', 'unit', 'denominator', 'grain'];
        if (fact.currency !== 'none') contextFields.push('currency');
        for (const field of contextFields) {
          if (fact[field] && !visibleText.includes(fact[field])) errors.push(`claim ${claim.id} visible numeric context mismatch: ${field}=${fact[field]}`);
          if (fact[field] && !fact.evidence_text.includes(fact[field])) errors.push(`claim ${claim.id} source numeric context mismatch: ${field}=${fact[field]}`);
        }
        const count = (text, token) => token ? text.split(token).length - 1 : 0;
        if (signedValue && count(visibleText, signedValue) !== fact.occurrence_count) errors.push(`claim ${claim.id} visible occurrence_count mismatch for ${signedValue}`);
        if (signedValue && count(fact.evidence_text, signedValue) !== fact.occurrence_count) errors.push(`claim ${claim.id} source occurrence_count mismatch for ${signedValue}`);
      }
    }
  }

  function validateCheckSidecar(ref, kind) {
    const file = readJson(ref, `${kind} check sidecar`);
    const sidecar = file?.value;
    const schema = kind === 'accessibility' ? accessibilitySchema : privacySchema;
    if (!sidecar || sidecar.schema_version !== `design-${kind}-checks/v2`) {
      errors.push(`${kind} requires a non-empty check-level sidecar`);
      return false;
    }
    errors.push(...validateJsonInstance(schema, sidecar).map((error) => `${kind} sidecar ${error}`));
    if (Number.isNaN(Date.parse(sidecar.checked_at))) errors.push(`${kind} sidecar checked_at must be an ISO timestamp`);
    const requiredIds = kind === 'accessibility'
      ? ['document-title', 'html-lang', 'main-landmark', 'heading-order', 'keyboard-focus', 'color-contrast', 'reduced-motion']
      : ['remote-requests', 'sensitive-data-exposure', 'redaction-review', 'retention-policy', 'deletion-policy'];
    const checkIds = (sidecar.checks || []).map((check) => check.id);
    for (const id of requiredIds) if (checkIds.filter((value) => value === id).length !== 1) errors.push(`${kind} sidecar requires exactly one ${id} check`);
    if (sidecar.artifact_digest !== coreDigest) errors.push(`${kind} sidecar artifact_digest mismatch`);
    if (sidecar.resolved_plan_digest !== contract.resolved_plan_digest) errors.push(`${kind} sidecar resolved_plan_digest mismatch`);
    let passed = true;
    for (const check of sidecar.checks || []) {
      if (check.status !== 'passed') {
        errors.push(`${kind} mandatory check ${check.id || '<missing>'} must be passed`);
        passed = false;
      }
      if (!check.id || !check.evidence_ref || !shaPattern.test(String(check.evidence_sha256 || ''))) {
        errors.push(`${kind} check requires id, evidence_ref, status, and evidence_sha256`);
        passed = false;
        continue;
      }
      const evidencePath = resolve(root, check.evidence_ref);
      if (!inside(root, evidencePath) || !existsSync(evidencePath) || lstatSync(evidencePath).isSymbolicLink() || sha256(readFileSync(evidencePath)) !== check.evidence_sha256) {
        errors.push(`${kind} check ${check.id} evidence is missing or hash-mismatched`);
        passed = false;
      }
    }
    return passed;
  }
  const a11yPassed = validateCheckSidecar(contract.accessibility_check_ref, 'accessibility');
  const privacyPassed = validateCheckSidecar(contract.privacy_check_ref, 'privacy');

  const renderSpecFile = readJson(contract.render_spec_ref, 'render spec');
  const renderSpec = renderSpecFile?.value;
  if (renderSpec) errors.push(...validateJsonInstance(renderSpecSchema, renderSpec).map((error) => `render spec ${error}`));
  const renderSpecPayload = renderSpec ? {
    schema_version: renderSpec.schema_version,
    viewports: renderSpec.viewports,
    segments: renderSpec.segments,
    states: renderSpec.states,
    remote_policy: renderSpec.remote_policy
  } : null;
  if (renderSpecPayload && sha256(stable(renderSpecPayload)) !== renderSpec.spec_digest) errors.push('render spec digest mismatch');
  if (renderSpec?.artifact_digest !== coreDigest) errors.push('render spec artifact_digest mismatch');
  if (renderSpec?.resolved_plan_digest !== contract.resolved_plan_digest) errors.push('render spec resolved_plan_digest mismatch');
  const renderFile = readJson(contract.render_profile_ref, 'render profile');
  const render = renderFile?.value;
  const surfaceDigest = renderFile ? sha256(readFileSync(renderFile.path)) : null;
  if (contract.surface_digest !== surfaceDigest) errors.push('evidence contract surface_digest mismatch');
  if (!render || render.schema_version !== 'design-render-profile/v2') errors.push('render profile must be design-render-profile/v2');
  if (render?.artifact_digest !== coreDigest) errors.push('render profile artifact_digest mismatch');
  if (render?.resolved_plan_digest !== contract.resolved_plan_digest) errors.push('render profile resolved_plan_digest mismatch');
  if (render?.render_spec_digest !== renderSpec?.spec_digest) errors.push('render profile render_spec_digest mismatch');
  const profiles = render?.profiles || [];
  const expectedWidths = renderSpec?.viewports || [1440, 390, 320];
  if (stable(profiles.map((profile) => profile.width).sort((a, b) => b - a)) !== stable([...expectedWidths].sort((a, b) => b - a))) errors.push('render profile viewport ids do not exactly match render spec');
  for (const width of expectedWidths) {
    const profile = profiles.find((item) => item.width === width);
    if (!profile) { errors.push(`render profile missing width ${width}`); continue; }
    if (profile.strict_success !== true) errors.push(`render profile ${width} strict_success must be true`);
    if (profile.reduced_motion !== 'passed') errors.push(`render profile ${width} reduced_motion must pass`);
    const reducedEvidence = profile.reduced_motion_evidence;
    if (!reducedEvidence || reducedEvidence.preference_matches !== true) {
      errors.push(`render profile ${width} reduced-motion preference evidence must pass`);
    }
    if (reducedEvidence?.static_text_equivalent !== true) {
      errors.push(`render profile ${width} reduced-motion text must match the default state`);
    }
    if (reducedEvidence?.active_animation_count !== 0) {
      errors.push(`render profile ${width} reduced-motion active_animation_count must be zero`);
    }
    if (!shaPattern.test(String(reducedEvidence?.visible_text_sha256 || ''))) {
      errors.push(`render profile ${width} reduced-motion visible_text_sha256 is required`);
    }
    const remoteRequests = Array.isArray(profile.remote_requests) ? profile.remote_requests : [];
    for (const request of remoteRequests) if (request.authorized !== true) errors.push(`render profile ${width} has unauthorized remote request: ${request.url}`);
    const stateIds = (profile.states || []).map((state) => state.id);
    const expectedStateIds = (renderSpec?.states || []).map((state) => state.id);
    if (stable([...stateIds].sort()) !== stable([...expectedStateIds].sort())) errors.push(`render profile ${width} state ids do not match render spec`);
    for (const state of profile.states || []) {
      if ((state.assertions || []).some((assertion) => assertion.passed !== true)) errors.push(`render profile ${width}/${state.id} has failed assertion`);
      const segmentIds = (state.segments || []).map((segment) => segment.id);
      const expectedSegmentIds = (renderSpec?.segments || []).map((segment) => segment.id);
      if (stable([...segmentIds].sort()) !== stable([...expectedSegmentIds].sort())) errors.push(`render profile ${width}/${state.id} segment ids do not match render spec`);
      for (const segment of state.segments || []) {
        const screenshotPath = resolve(root, segment.screenshot_ref || '');
        if (!inside(root, screenshotPath) || !existsSync(screenshotPath) || !shaPattern.test(String(segment.screenshot_sha256 || '')) || sha256(readFileSync(screenshotPath)) !== segment.screenshot_sha256) errors.push(`render profile ${width}/${state.id}/${segment.id} screenshot is missing or hash-mismatched`);
      }
      if (manifest.schematic === true && !(state.schematic_disclosure || []).some((item) => item.visible === true && item.geometry?.width > 0 && item.geometry?.height > 0)) {
        errors.push(`render profile ${width}/${state.id} has no computed visible schematic disclosure`);
      }
    }
  }

  const privacy = readJson(contract.privacy_check_ref, 'privacy check sidecar', false)?.value;
  const allowedOrigins = new Set(privacy?.authorized_remote_origins || []);
  for (const profile of profiles) for (const request of profile.remote_requests || []) if (!allowedOrigins.has(request.origin)) errors.push(`privacy sidecar does not authorize remote origin ${request.origin}`);

  if (contract.delivery_status === 'candidate_ready') {
    const reviewerFile = readJson(contract.reviewer_record_ref, 'reviewer record');
    const reviewer = reviewerFile?.value;
    const digest = coreDigest;
    if (!reviewer || reviewer.schema_version !== 'design-reviewer-record/v3' || reviewer.review_status !== 'approved') {
      errors.push('candidate_ready requires approved reviewer record');
    }
    if (reviewer) errors.push(...validateJsonInstance(reviewerSchema, reviewer).map((error) => `reviewer record ${error}`));
    if (reviewer && Number.isNaN(Date.parse(reviewer.reviewed_at))) errors.push('reviewer record reviewed_at must be an ISO timestamp');
    if (reviewer?.reviewer_id === reviewer?.artifact_author_id) {
      errors.push('reviewer record reviewer_id must differ from artifact_author_id');
    }
    const reviewerChecks = (reviewer?.checks || []).map((check) => check.id);
    for (const id of ['source-identity', 'claim-semantics', 'numeric-semantics', 'accessibility', 'privacy', 'render', 'visual-review']) {
      if (reviewerChecks.filter((value) => value === id).length !== 1) errors.push(`reviewer record requires exactly one ${id} check`);
    }
    for (const check of reviewer?.checks || []) {
      if (check.status !== 'passed') {
        errors.push(`approved candidate_ready reviewer check ${check.id || '<missing>'} must be passed`);
      }
    }
    if ((reviewer?.findings || []).some((finding) => finding.status === 'open' && ['major', 'blocking'].includes(finding.severity))) {
      errors.push('approved candidate_ready reviewer record cannot contain unresolved major or blocking findings');
    }
    if ((privacy?.findings || []).some((finding) => finding.status === 'open')) {
      errors.push('candidate_ready delivery cannot contain unresolved privacy findings');
    }
    if (reviewer?.artifact_digest !== digest) errors.push('reviewer record artifact_digest mismatch');
    if (reviewer?.content_digest !== contentDigest) errors.push('reviewer record content_digest mismatch');
    if (reviewer?.surface_digest !== surfaceDigest) errors.push('reviewer record surface_digest mismatch');
    if (reviewer?.resolved_plan_digest !== contract.resolved_plan_digest) errors.push('reviewer record resolved_plan_digest mismatch');
    if (!a11yPassed || !privacyPassed) {
      errors.push('candidate_ready requires passed accessibility and privacy evidence');
    }

    if (options.requireHostEvidence === false) return errors;

    const machineFile = readExternalJson(options.machineAttestationPath, 'runner machine attestation');
    const registryFile = readExternalJson(options.reviewerRegistryPath, 'host reviewer registry');
    const attestationFile = readExternalJson(options.reviewerAttestationPath, 'host reviewer attestation');
    const rejectionFile = options.rejectionEventPath
      ? readExternalJson(options.rejectionEventPath, 'host approval rejection event')
      : null;
    const machine = machineFile?.value;
    const registry = registryFile?.value;
    const attestation = attestationFile?.value;
    if (machine) {
      errors.push(...validateJsonInstance(machineAttestationSchema, machine).map((error) => `runner machine attestation ${error}`));
      if (Number.isNaN(Date.parse(machine.produced_at))) errors.push('runner machine attestation produced_at must be an ISO timestamp');
      if (machine.artifact_digest !== coreDigest) errors.push('runner machine attestation artifact_digest mismatch');
      if (machine.resolved_plan_digest !== contract.resolved_plan_digest) errors.push('runner machine attestation resolved_plan_digest mismatch');
      const checkIds = (machine.checks || []).map((check) => check.id);
      for (const id of ['render-smoke', 'remote-policy-pre-send', 'reduced-motion']) {
        if (checkIds.filter((value) => value === id).length !== 1) {
          errors.push(`runner machine attestation requires exactly one passed ${id} check`);
        }
      }

      const eventPath = machine.execution_event?.path;
      if (typeof eventPath !== 'string' || !isAbsolute(eventPath) || !existsSync(eventPath)
          || lstatSync(eventPath).isSymbolicLink()) {
        errors.push('runner execution event snapshot must be an existing absolute non-symlink file');
      } else {
        const realEventPath = realpathSync(eventPath);
        if (inside(root, realEventPath) || !statSync(realEventPath).isFile()) {
          errors.push('runner execution event snapshot must be outside the artifact');
        } else if (sha256(readFileSync(realEventPath)) !== machine.execution_event.sha256) {
          errors.push('runner execution event snapshot SHA-256 mismatch');
        } else {
          let events = [];
          try {
            events = readFileSync(realEventPath, 'utf8').trim().split('\n')
              .filter(Boolean).map((line) => JSON.parse(line));
          } catch (error) {
            errors.push(`runner execution event snapshot is invalid NDJSON: ${error.message}`);
          }
          if (events.some((event) => event.schema_version !== 'design-execution-event/v2'
              || event.plan_digest !== contract.resolved_plan_digest)) {
            errors.push('runner execution event snapshot has a schema or plan digest mismatch');
          }
          if (!events.some((event) => event.event === 'gate_finished'
              && event.gate_id === 'render-smoke'
              && event.status === 'passed'
              && event.artifact_digest === coreDigest)) {
            errors.push('runner execution event snapshot lacks a passed render-smoke event bound to the artifact digest');
          }
        }
      }
      const boundRenderPath = machine.render_profile?.path;
      if (typeof boundRenderPath !== 'string' || !isAbsolute(boundRenderPath)
          || !existsSync(boundRenderPath) || lstatSync(boundRenderPath).isSymbolicLink()
          || realpathSync(boundRenderPath) !== realpathSync(renderFile?.path || root)
          || sha256(readFileSync(boundRenderPath)) !== machine.render_profile.sha256) {
        errors.push('runner machine attestation render profile path or SHA-256 mismatch');
      }
    }
    if (registry) {
      errors.push(...validateJsonInstance(reviewerRegistrySchema, registry).map((error) => `host reviewer registry ${error}`));
      const ids = (registry.reviewers || []).map((entry) => entry.id);
      if (new Set(ids).size !== ids.length) errors.push('host reviewer registry reviewer ids must be unique');
    }
    if (attestation) {
      errors.push(...validateJsonInstance(reviewerAttestationSchema, attestation).map((error) => `host reviewer attestation ${error}`));
      if (Number.isNaN(Date.parse(attestation.reviewed_at))) errors.push('host reviewer attestation reviewed_at must be an ISO timestamp');
      if (attestation.review_status !== 'approved') {
        errors.push('candidate_ready requires an approved host reviewer attestation');
      }
      if (attestation.artifact_digest !== coreDigest) errors.push('host reviewer attestation artifact_digest mismatch');
      if (attestation.content_digest !== contentDigest) errors.push('host reviewer attestation content_digest mismatch');
      if (attestation.surface_digest !== surfaceDigest) errors.push('host reviewer attestation surface_digest mismatch');
      if (machineFile && attestation.machine_attestation_sha256 !== machineFile.sha256) {
        errors.push('host reviewer attestation machine_attestation_sha256 mismatch');
      }
      if (attestation.resolved_plan_digest !== contract.resolved_plan_digest) errors.push('host reviewer attestation resolved_plan_digest mismatch');
      if (registryFile && attestation.reviewer_registry_sha256 !== registryFile.sha256) {
        errors.push('host reviewer attestation reviewer_registry_sha256 mismatch');
      }
      const registered = (registry?.reviewers || []).find((entry) => entry.id === attestation.reviewer_id);
      if (!registered || registered.status !== 'active') errors.push('host reviewer attestation reviewer is not active in the supplied registry');
      if (machine && attestation.artifact_author_id !== machine.artifact_author_id) {
        errors.push('host reviewer attestation artifact_author_id mismatch');
      }
      if (attestation.reviewer_id === attestation.artifact_author_id) {
        errors.push('host reviewer must differ from the artifact author');
      }
      if (machine && Date.parse(attestation.reviewed_at) < Date.parse(machine.produced_at)) {
        errors.push('host reviewer attestation predates runner machine evidence');
      }
      const checkIds = (attestation.checks || []).map((check) => check.id);
      for (const id of ['source-identity', 'claim-semantics', 'numeric-semantics', 'accessibility', 'privacy', 'render', 'visual-review']) {
        if (checkIds.filter((value) => value === id).length !== 1) errors.push(`host reviewer attestation requires exactly one ${id} check`);
      }
      for (const check of attestation.checks || []) {
        if (check.status !== 'passed') errors.push(`approved host reviewer check ${check.id || '<missing>'} must be passed`);
      }
      if ((attestation.findings || []).some((finding) => finding.status === 'open'
          && ['major', 'blocking'].includes(finding.severity))) {
        errors.push('approved host reviewer attestation cannot contain unresolved major or blocking findings');
      }
    }
    if (rejectionFile) {
      const rejection = rejectionFile.value;
      errors.push(...validateJsonInstance(approvalRejectionSchema, rejection)
        .map((error) => `host approval rejection event ${error}`));
      if (Number.isNaN(Date.parse(rejection?.rejected_at))) {
        errors.push('host approval rejection event rejected_at must be an ISO timestamp');
      }
      for (const [field, expected] of [
        ['artifact_digest', coreDigest],
        ['content_digest', contentDigest],
        ['surface_digest', surfaceDigest],
        ['resolved_plan_digest', contract.resolved_plan_digest]
      ]) {
        if (rejection?.[field] !== expected) {
          errors.push(`host approval rejection event ${field} mismatch`);
        }
      }
      const rejectedAt = Date.parse(rejection?.rejected_at);
      const reviewedAt = Date.parse(attestation?.reviewed_at);
      if (!Number.isNaN(rejectedAt) && !Number.isNaN(reviewedAt) && rejectedAt < reviewedAt) {
        errors.push('host approval rejection event predates the current reviewer approval');
      } else if (rejection?.event === 'user_rejected' || rejection?.event === 'host_rejected') {
        errors.push(`stale approval: ${rejection.event} invalidates candidate_ready`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node scripts/validate-evidence-contract.mjs <artifact-dir> [--machine-attestation=<path>] [--reviewer-registry=<path>] [--reviewer-attestation=<path>] [--rejection-event=<path>]');
    process.exit(2);
  }
  const option = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const errors = validateEvidenceContract(dir, {
    machineAttestationPath: option('machine-attestation'),
    reviewerRegistryPath: option('reviewer-registry'),
    reviewerAttestationPath: option('reviewer-attestation'),
    rejectionEventPath: option('rejection-event')
  });
  if (errors.length) {
    console.error('Evidence contract validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Evidence contract validation passed: ${dir}`);
}
