#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './lib/json-schema.mjs';
import { decodePng } from './lib/png.mjs';

const modulePath = fileURLToPath(import.meta.url);
const skillRoot = resolve(dirname(modulePath), '..');
const directionSchema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/direction-comparison.schema.json'),
  'utf8'
));
const referenceSchema = JSON.parse(readFileSync(
  resolve(skillRoot, 'schemas/reference-registry.schema.json'),
  'utf8'
));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function inside(root, path) {
  const value = relative(root, path);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
}

function readArtifactFile(root, ref, label) {
  if (typeof ref !== 'string' || !ref || isAbsolute(ref)
      || ref.split(/[\\/]/).includes('..')) {
    throw new Error(`${label} must be a safe artifact-relative path`);
  }
  const path = resolve(root, ref);
  if (!inside(root, path) || !existsSync(path) || lstatSync(path).isSymbolicLink()) {
    throw new Error(`${label} is missing, unsafe, or a symlink: ${ref}`);
  }
  const real = realpathSync(path);
  if (!inside(root, real) || !statSync(real).isFile()) {
    throw new Error(`${label} must resolve to a regular artifact file: ${ref}`);
  }
  return { path: real, bytes: readFileSync(real) };
}

function colorDistance(pixels, leftOffset, rightOffset) {
  return Math.max(
    Math.abs(pixels[leftOffset] - pixels[rightOffset]),
    Math.abs(pixels[leftOffset + 1] - pixels[rightOffset + 1]),
    Math.abs(pixels[leftOffset + 2] - pixels[rightOffset + 2]),
    Math.abs(pixels[leftOffset + 3] - pixels[rightOffset + 3])
  );
}

function edgeMap(image) {
  const map = new Uint8Array(image.width * image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const pixel = y * image.width + x;
      const offset = pixel * 4;
      const right = x + 1 < image.width
        ? colorDistance(image.visiblePixels, offset, offset + 4)
        : 0;
      const below = y + 1 < image.height
        ? colorDistance(image.visiblePixels, offset, offset + image.width * 4)
        : 0;
      map[pixel] = Math.max(right, below) >= 12 ? 1 : 0;
    }
  }
  return map;
}

function structuralDifference(left, right) {
  if (!left || !right || left.width !== right.width || left.height !== right.height) {
    return null;
  }
  const leftEdges = edgeMap(left);
  const rightEdges = edgeMap(right);
  const pixelCount = left.width * left.height;
  const gridSize = 4;
  const changedRegions = new Set();
  const changedRows = new Set();
  const changedColumns = new Set();
  const regionDiffs = Array.from({ length: gridSize * gridSize }, () => 0);
  const regionAreas = Array.from({ length: gridSize * gridSize }, () => 0);
  let edgeUnion = 0;
  let edgeIntersection = 0;
  let edgeXor = 0;
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const x = pixel % left.width;
    const y = Math.floor(pixel / left.width);
    const column = Math.min(gridSize - 1, Math.floor(x * gridSize / left.width));
    const row = Math.min(gridSize - 1, Math.floor(y * gridSize / left.height));
    const region = row * gridSize + column;
    regionAreas[region] += 1;
    if (leftEdges[pixel] || rightEdges[pixel]) edgeUnion += 1;
    if (leftEdges[pixel] && rightEdges[pixel]) edgeIntersection += 1;
    if (leftEdges[pixel] !== rightEdges[pixel]) {
      edgeXor += 1;
      regionDiffs[region] += 1;
    }
  }
  for (let region = 0; region < regionDiffs.length; region += 1) {
    const ratio = regionDiffs[region] / regionAreas[region];
    if (regionDiffs[region] >= 2 && ratio >= 0.02) {
      changedRegions.add(region);
      changedRows.add(Math.floor(region / gridSize));
      changedColumns.add(region % gridSize);
    }
  }
  return {
    edgeDifferenceRatio: edgeXor / pixelCount,
    edgeOverlapRatio: edgeUnion ? edgeIntersection / edgeUnion : 1,
    changedRegionCount: changedRegions.size,
    changedRowCount: changedRows.size,
    changedColumnCount: changedColumns.size
  };
}

export function validateDirectionEvidence(directory, options = {}) {
  const errors = [];
  if (!existsSync(directory)) return ['artifact directory does not exist'];
  const root = realpathSync(directory);
  let comparisonFile;
  let comparison;
  try {
    comparisonFile = readArtifactFile(
      root,
      options.comparisonRef || 'direction-comparison.json',
      'direction comparison'
    );
    comparison = JSON.parse(comparisonFile.bytes.toString('utf8'));
  } catch (error) {
    return [error.message];
  }
  errors.push(...validateJsonInstance(directionSchema, comparison)
    .map((error) => `direction-comparison ${error}`));

  let manifest;
  let ledgerFile;
  let ledger;
  let registryFile;
  let registry;
  let requirementFile;
  try {
    manifest = JSON.parse(
      readArtifactFile(root, 'manifest.json', 'manifest').bytes.toString('utf8')
    );
    ledgerFile = readArtifactFile(
      root,
      options.contentLedgerRef || 'content-ledger.json',
      'content ledger'
    );
    ledger = JSON.parse(ledgerFile.bytes.toString('utf8'));
    const hasRegistryRef = comparison.reference_registry_ref
      || comparison.reference_registry_sha256;
    if (hasRegistryRef) {
      if (!comparison.reference_registry_ref
          || !comparison.reference_registry_sha256) {
        errors.push(
          'direction comparison reference registry requires ref and sha256 together'
        );
      } else {
        if (options.referenceRegistryRef
            && comparison.reference_registry_ref !== options.referenceRegistryRef) {
          errors.push(
            'direction comparison reference_registry_ref must match evidence contract'
          );
        }
        registryFile = readArtifactFile(
          root,
          comparison.reference_registry_ref,
          'reference registry'
        );
        registry = JSON.parse(registryFile.bytes.toString('utf8'));
      }
    }
    const hasRequirementRef = comparison.requirement_verification_ref
      || comparison.requirement_verification_sha256;
    if (hasRequirementRef) {
      if (!comparison.requirement_verification_ref
          || !comparison.requirement_verification_sha256) {
        errors.push(
          'direction comparison requirement verification requires ref and sha256 together'
        );
      } else {
        requirementFile = readArtifactFile(
          root,
          comparison.requirement_verification_ref,
          'requirement verification'
        );
      }
    } else if (comparison.schema_version === 'design-direction-comparison/v2'
        && existsSync(resolve(root, 'requirement-verification.json'))) {
      errors.push(
        'v2 direction comparison must bind the available requirement verification'
      );
    }
  } catch (error) {
    errors.push(error.message);
  }
  if (registry) {
    errors.push(...validateJsonInstance(referenceSchema, registry)
      .map((error) => `reference-registry ${error}`));
  }
  if (manifest?.artifact_type !== comparison.artifact_type) {
    errors.push('direction comparison artifact_type must match manifest');
  }
  if (registry && registry.artifact_type !== comparison.artifact_type) {
    errors.push('reference registry artifact_type must match direction comparison');
  }
  if (ledgerFile && sha256(ledgerFile.bytes) !== comparison.content_ledger_sha256) {
    errors.push('direction comparison content_ledger_sha256 mismatch');
  }
  if (registryFile
      && sha256(registryFile.bytes) !== comparison.reference_registry_sha256) {
    errors.push('direction comparison reference_registry_sha256 mismatch');
  }
  if (requirementFile
      && sha256(requirementFile.bytes)
        !== comparison.requirement_verification_sha256) {
    errors.push('direction comparison requirement_verification_sha256 mismatch');
  }

  const directions = comparison.directions || [];
  const requiresExternalReference = directions.some((direction) =>
    direction.creative_basis?.includes('external_reference')
  );
  if (requiresExternalReference && !registryFile) {
    errors.push(
      'directions using external_reference require a reference registry'
    );
  }
  const references = registry?.references || [];
  const referenceIds = references.map((item) => item.id);
  const referenceRoles = references.map((item) => item.role);
  if (new Set(referenceIds).size !== referenceIds.length) {
    errors.push('reference registry ids must be unique');
  }
  if (new Set(referenceRoles).size !== referenceRoles.length) {
    errors.push('reference registry roles must be unique');
  }
  if (registry) {
    if (!referenceRoles.includes('content_topology')) {
      errors.push('reference registry requires one content_topology reference');
    }
    if (!referenceRoles.some((role) => (
      ['visual_language', 'media_strategy', 'interaction'].includes(role)
    ))) {
      errors.push('reference registry requires a visual, media, or interaction reference');
    }
  }
  for (const referenceItem of references) {
    const licences = [
      referenceItem.code_license,
      referenceItem.asset_license
    ].map((value) => String(value).trim().toLowerCase());
    const reusesMaterial = licences.some((value) => value !== 'not-used');
    if (reusesMaterial && !referenceItem.license_evidence_ref) {
      errors.push(
        `reference ${referenceItem.id} reuses material and requires license_evidence_ref`
      );
    }
    if (referenceItem.license_evidence_ref) {
      try {
        readArtifactFile(
          root,
          referenceItem.license_evidence_ref,
          `reference ${referenceItem.id} license evidence`
        );
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (referenceItem.adoption_mode === 'inspiration_only'
        && reusesMaterial) {
      errors.push(
        `reference ${referenceItem.id} inspiration_only must use not-used licenses`
      );
    }
    if (referenceItem.adoption_mode !== 'inspiration_only'
        && !reusesMaterial) {
      errors.push(
        `reference ${referenceItem.id} material adoption requires a verified license`
      );
    }
    if (referenceItem.adoption_mode === 'licensed_code'
        && (referenceItem.fixed_revision === 'snapshot-only'
          || !referenceItem.allowed_paths.length)) {
      errors.push(
        `reference ${referenceItem.id} licensed_code requires a fixed revision and allowed paths`
      );
    }
    if (referenceItem.adoption_mode === 'inspiration_only'
        && referenceItem.allowed_paths.length) {
      errors.push(
        `reference ${referenceItem.id} inspiration_only cannot declare reusable paths`
      );
    }
    try {
      const snapshot = readArtifactFile(
        root,
        referenceItem.snapshot_ref,
        `reference ${referenceItem.id} snapshot`
      );
      if (sha256(snapshot.bytes) !== referenceItem.snapshot_sha256) {
        errors.push(`reference ${referenceItem.id} snapshot SHA-256 mismatch`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  const ids = directions.map((direction) => direction.id);
  const previewHashes = directions.map((direction) => direction.preview_sha256);
  if (new Set(ids).size !== ids.length) errors.push('direction ids must be unique');
  if (new Set(previewHashes).size !== previewHashes.length) {
    errors.push('directions must use distinct rendered previews');
  }
  if (!ids.includes(comparison.selected_direction_id)) {
    errors.push('selected_direction_id must identify one compared direction');
  }
  if (directions.length === 2) {
    const [first, second] = directions;
    if (first.topology === second.topology
        && first.primary_focus === second.primary_focus
        && first.media_strategy === second.media_strategy) {
      errors.push('directions must differ in topology, primary focus, or media strategy');
    }
  }
  const decodedPreviews = [];
  for (const direction of directions) {
    if (direction.preview_frame?.width !== comparison.target_frame?.width
        || direction.preview_frame?.height !== comparison.target_frame?.height
        || direction.preview_frame?.unit !== comparison.target_frame?.unit) {
      errors.push(`direction ${direction.id} preview frame must match target_frame`);
    }
    try {
      const preview = readArtifactFile(root, direction.preview_ref, `direction ${direction.id} preview`);
      if (sha256(preview.bytes) !== direction.preview_sha256) {
        errors.push(`direction ${direction.id} preview SHA-256 mismatch`);
      }
      const decoded = decodePng(preview.bytes);
      if (!decoded) {
        errors.push(`direction ${direction.id} preview must be a complete decodable 8-bit PNG`);
      } else if (decoded.width !== direction.preview_frame.width
          || decoded.height !== direction.preview_frame.height) {
        errors.push(`direction ${direction.id} preview PNG dimensions mismatch`);
      }
      decodedPreviews.push(decoded);
    } catch (error) {
      errors.push(error.message);
      decodedPreviews.push(null);
    }
  }
  if (decodedPreviews.length === 2 && decodedPreviews.every(Boolean)) {
    const difference = structuralDifference(decodedPreviews[0], decodedPreviews[1]);
    if (!difference || difference.edgeDifferenceRatio < 0.025
        || difference.edgeOverlapRatio > 0.85
        || difference.changedRegionCount < 4
        || difference.changedRowCount < 2
        || difference.changedColumnCount < 2) {
      errors.push(
        'direction previews fail the machine structural floor; '
        + 'human review is still required for aesthetic quality'
      );
    }
  }
  if (comparison.schema_version === 'design-direction-comparison/v2') {
    const structureRefs = [];
    const structureHashes = [];
    const contentSets = [];
    const knownUnits = new Set([
      ...(ledger?.semantic_context?.semantic_units || []).map((unit) => unit.id),
      ...(ledger?.entries || []).map((entry) => entry.id)
    ]);
    const mustKeep = new Set(
      ledger?.semantic_context?.coverage?.must_keep_ids || []
    );
    for (const direction of directions) {
      structureRefs.push(direction.structure_ref);
      structureHashes.push(direction.structure_sha256);
      contentSets.push([...(direction.content_unit_ids || [])].sort());
      try {
        const structure = readArtifactFile(
          root,
          direction.structure_ref,
          `direction ${direction.id} structure`
        );
        if (sha256(structure.bytes) !== direction.structure_sha256) {
          errors.push(`direction ${direction.id} structure SHA-256 mismatch`);
        }
      } catch (error) {
        errors.push(error.message);
      }
      for (const id of direction.content_unit_ids || []) {
        if (!knownUnits.has(id)) {
          errors.push(`direction ${direction.id} references unknown content unit: ${id}`);
        }
      }
      for (const id of mustKeep) {
        if (!direction.content_unit_ids?.includes(id)) {
          errors.push(`direction ${direction.id} omits must-keep content unit: ${id}`);
        }
      }
    }
    if (new Set(structureRefs).size !== directions.length
        || new Set(structureHashes).size !== directions.length) {
      errors.push('v2 directions must bind distinct structure files and bytes');
    }
    if (contentSets.length === 2
        && JSON.stringify(contentSets[0]) !== JSON.stringify(contentSets[1])) {
      errors.push('v2 directions must cover the same content units');
    }

    const keyframes = comparison.keyframe_evidence;
    if (keyframes?.selected_direction_id !== comparison.selected_direction_id) {
      errors.push('keyframe evidence must bind selected_direction_id');
    }
    const roles = (keyframes?.frames || []).map((frame) => frame.role);
    const expectedRoles = [
      'critical_state',
      'dense_content',
      'first_viewport',
      'narrow_screen'
    ];
    if (JSON.stringify([...roles].sort()) !== JSON.stringify(expectedRoles)) {
      errors.push('keyframe evidence must contain each required role exactly once');
    }
    const keyframeRefs = new Set();
    for (const frame of keyframes?.frames || []) {
      if (keyframeRefs.has(frame.image_ref)) {
        errors.push('keyframe evidence image refs must be unique');
      }
      keyframeRefs.add(frame.image_ref);
      try {
        const image = readArtifactFile(
          root,
          frame.image_ref,
          `keyframe ${frame.role}`
        );
        if (sha256(image.bytes) !== frame.image_sha256) {
          errors.push(`keyframe ${frame.role} SHA-256 mismatch`);
        }
        const decoded = decodePng(image.bytes);
        if (!decoded) {
          errors.push(`keyframe ${frame.role} must be a complete decodable 8-bit PNG`);
        } else if (decoded.width !== frame.frame.width
            || decoded.height !== frame.frame.height) {
          errors.push(`keyframe ${frame.role} PNG dimensions mismatch`);
        }
      } catch (error) {
        errors.push(error.message);
      }
      if (frame.role === 'narrow_screen' && frame.frame?.width > 390) {
        errors.push('narrow_screen keyframe width must be at most 390px');
      }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const directory = process.argv[2];
  if (!directory) {
    console.error('Usage: node scripts/validate-direction-evidence.mjs <artifact-dir> [--comparison=<ref>] [--content-ledger=<ref>] [--reference-registry=<ref>]');
    process.exit(2);
  }
  const option = (name) => process.argv.find(
    (arg) => arg.startsWith(`--${name}=`)
  )?.slice(name.length + 3);
  const errors = validateDirectionEvidence(directory, {
    comparisonRef: option('comparison'),
    contentLedgerRef: option('content-ledger'),
    referenceRegistryRef: option('reference-registry')
  });
  if (errors.length) {
    console.error('Direction evidence validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Direction evidence validation passed: ${directory}`);
}
