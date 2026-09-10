import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './json-schema.mjs';
import { validateTemplateLayoutContract } from './layout-registry.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const expectedPresetIds = [
  'consumer-brand',
  'data-analytics',
  'editorial-research',
  'enterprise-saas',
  'executive-strategy',
  'technical-architecture'
];
const expectedReaderJobs = [
  'analytical-evidence',
  'brand-communication',
  'executive-decision',
  'operational-workflow',
  'research-reading',
  'system-explanation'
];
const expectedRelationships = [
  'causality',
  'chronology',
  'comparison',
  'decision',
  'metrics',
  'narrative',
  'system'
];
const expectedSurfaceIds = ['html', 'poster', 'ppt'];
const expectedTopologyIds = [
  'causal-chain',
  'comparison-matrix',
  'decision-frame',
  'metric-evidence',
  'narrative-arc',
  'system-map',
  'timeline'
];
const surfaceIdByArtifactType = new Map([
  ['html-deck', 'html'],
  ['poster', 'poster'],
  ['ppt-handoff', 'ppt']
]);

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readJsonRecord(path) {
  const source = readFileSync(path, 'utf8');
  return {
    digest: digest(source),
    value: JSON.parse(source)
  };
}

function sorted(values) {
  return [...values].sort();
}

function sameValues(actual, expected) {
  return JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected));
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  return sorted(duplicates);
}

function validateCatalogueIntegrity(catalogue, themes) {
  const errors = [];
  const presets = catalogue.product_presets || [];
  const surfaces = catalogue.surface_contracts || [];
  const topologies = catalogue.topology_patterns || [];
  const routing = catalogue.routing || {};
  const presetIds = presets.map((item) => item.id);
  const surfaceIds = surfaces.map((item) => item.id);
  const topologyIds = topologies.map((item) => item.id);

  for (const [label, items] of [
    ['product preset', presets],
    ['surface contract', surfaces],
    ['topology pattern', topologies]
  ]) {
    const duplicates = duplicateIds(items);
    if (duplicates.length) errors.push(`${label} ids must be unique: ${duplicates.join(', ')}`);
  }
  if (!sameValues(presetIds, expectedPresetIds)) {
    errors.push(`product preset ids must be exactly: ${expectedPresetIds.join(', ')}`);
  }
  if (!sameValues(surfaceIds, expectedSurfaceIds)) {
    errors.push(`surface ids must be exactly: ${expectedSurfaceIds.join(', ')}`);
  }
  if (!sameValues(topologyIds, expectedTopologyIds)) {
    errors.push(`topology ids must be exactly: ${expectedTopologyIds.join(', ')}`);
  }
  if (!sameValues(Object.keys(routing.reader_job_to_preset || {}), expectedReaderJobs)) {
    errors.push(`reader job routes must be exactly: ${expectedReaderJobs.join(', ')}`);
  }
  for (const field of ['relationship_to_topology', 'relationship_to_secondary_preset']) {
    if (!sameValues(Object.keys(routing[field] || {}), expectedRelationships)) {
      errors.push(`${field} routes must be exactly: ${expectedRelationships.join(', ')}`);
    }
  }

  const presetSet = new Set(presetIds);
  const topologySet = new Set(topologyIds);
  const themeSet = new Set(Object.keys(themes.presets || {}));
  for (const [readerJob, presetId] of Object.entries(routing.reader_job_to_preset || {})) {
    if (!presetSet.has(presetId)) errors.push(`reader job ${readerJob} references unknown preset ${presetId}`);
  }
  for (const [relationship, presetId] of Object.entries(
    routing.relationship_to_secondary_preset || {}
  )) {
    if (!presetSet.has(presetId)) {
      errors.push(`relationship ${relationship} references unknown secondary preset ${presetId}`);
    }
  }
  for (const [relationship, topologyId] of Object.entries(
    routing.relationship_to_topology || {}
  )) {
    if (!topologySet.has(topologyId)) {
      errors.push(`relationship ${relationship} references unknown topology ${topologyId}`);
    }
  }
  for (const preset of presets) {
    for (const [surfaceId, stylePresetId] of Object.entries(
      preset.style_preset_by_surface || {}
    )) {
      if (!surfaceIds.includes(surfaceId)) {
        errors.push(`preset ${preset.id} references unknown surface ${surfaceId}`);
      }
      if (!themeSet.has(stylePresetId)) {
        errors.push(`preset ${preset.id} references unknown style preset ${stylePresetId}`);
      }
    }
  }
  for (const topology of topologies) {
    if (routing.relationship_to_topology?.[topology.relationship] !== topology.id) {
      errors.push(`topology ${topology.id} does not match route for ${topology.relationship}`);
    }
  }
  for (const surface of surfaces) {
    if (surfaceIdByArtifactType.get(surface.artifact_type) !== surface.id) {
      errors.push(`surface ${surface.id} does not match artifact type ${surface.artifact_type}`);
    }
  }
  return errors;
}

function validateSchemaIdConsistency(catalogueSchema, briefSchema, profileSchema) {
  const errors = [];
  const sources = [
    ['catalogue schema', catalogueSchema.$defs?.product_preset_id?.enum || []],
    ['brief schema', briefSchema.$defs?.product_preset_id?.enum || []],
    ['profile schema', profileSchema.$defs?.product_preset_id?.enum || []]
  ];
  for (const [label, ids] of sources) {
    if (!sameValues(ids, expectedPresetIds)) {
      errors.push(`${label} product preset ids do not match the canonical set`);
    }
  }
  return errors;
}

function validateOrThrow(schema, instance, label) {
  const errors = validateJsonInstance(schema, instance);
  if (errors.length) throw new Error(`${label} is invalid:\n- ${errors.join('\n- ')}`);
}

export function loadDesignProfileAssets(root = packageRoot) {
  const catalogueRecord = readJsonRecord(
    join(root, 'design-systems/defaults/design-profile-catalogue.json')
  );
  const themeRecord = readJsonRecord(join(root, 'assets/themes/presets.json'));
  const catalogueSchema = readJsonRecord(
    join(root, 'schemas/design-profile-catalogue.schema.json')
  ).value;
  const briefSchema = readJsonRecord(join(root, 'schemas/design-brief.schema.json')).value;
  const profileSchema = readJsonRecord(join(root, 'schemas/design-profile.schema.json')).value;

  validateOrThrow(
    catalogueSchema,
    catalogueRecord.value,
    'design profile catalogue'
  );
  const integrityErrors = validateCatalogueIntegrity(
    catalogueRecord.value,
    themeRecord.value
  );
  integrityErrors.push(...validateSchemaIdConsistency(
    catalogueSchema,
    briefSchema,
    profileSchema
  ));
  if (integrityErrors.length) {
    throw new Error(`design profile catalogue integrity failed:\n- ${integrityErrors.join('\n- ')}`);
  }
  return {
    briefSchema,
    catalogue: catalogueRecord.value,
    catalogueDigest: catalogueRecord.digest,
    profileSchema,
    themes: themeRecord.value,
    themeDigest: themeRecord.digest
  };
}

export function resolveDesignProfile(brief, artifactType, assets = loadDesignProfileAssets()) {
  validateOrThrow(assets.briefSchema, brief, 'design brief');
  const surfaceId = surfaceIdByArtifactType.get(artifactType);
  if (!surfaceId) {
    throw new Error(`design profiles support only ppt-handoff, html-deck, and poster: ${artifactType}`);
  }

  const catalogue = assets.catalogue;
  const primaryPresetId = brief.primary_preset_override
    || catalogue.routing.reader_job_to_preset[brief.reader_job];
  const primaryPreset = catalogue.product_presets.find(
    (item) => item.id === primaryPresetId
  );
  if (!primaryPreset) throw new Error(`unknown primary product preset: ${primaryPresetId}`);

  const routedSecondaryId = catalogue.routing.relationship_to_secondary_preset[
    brief.primary_relationship
  ];
  const secondaryPresetId = brief.secondary_preset_override || routedSecondaryId;
  if (brief.secondary_preset_override && secondaryPresetId === primaryPresetId) {
    throw new Error('secondary_preset_override must differ from the primary preset');
  }
  const secondaryPreset = secondaryPresetId === primaryPresetId
    ? null
    : catalogue.product_presets.find((item) => item.id === secondaryPresetId);
  if (secondaryPresetId !== primaryPresetId && !secondaryPreset) {
    throw new Error(`unknown secondary product preset: ${secondaryPresetId}`);
  }

  const relationships = [
    brief.primary_relationship,
    ...brief.secondary_relationships
  ];
  const topologies = [...new Set(relationships.map(
    (relationship) => catalogue.routing.relationship_to_topology[relationship]
  ))];
  if (topologies.some((value) => !value)) {
    throw new Error('design brief contains a relationship without a topology route');
  }

  const surface = catalogue.surface_contracts.find((item) => item.id === surfaceId);
  const stylePreset = primaryPreset.style_preset_by_surface[surfaceId];
  const theme = assets.themes.presets?.[stylePreset];
  if (!theme) throw new Error(`resolved style preset is not registered: ${stylePreset}`);

  const density = brief.content_density === 'auto'
    ? primaryPreset.composition.density
    : brief.content_density;
  const supportingEmphasis = secondaryPreset
    ? ` Supporting ${secondaryPreset.id}: ${secondaryPreset.surface_emphasis[surfaceId]}`
    : '';
  const profile = {
    schema_version: 'design-profile/v1',
    catalogue_digest: assets.catalogueDigest,
    theme_digest: assets.themeDigest,
    brief: structuredClone(brief),
    surface: {
      id: surface.id,
      artifact_type: surface.artifact_type,
      delivery_mode: surface.delivery_mode,
      rules: {
        canvas: surface.canvas,
        grid: surface.grid,
        safe_area: surface.safe_area,
        minimum_body_size: surface.minimum_body_size,
        max_primary_claims: surface.max_primary_claims,
        interaction_policy: surface.interaction_policy,
        required_checks: surface.required_checks
      }
    },
    primary_preset: primaryPreset.id,
    ...(secondaryPreset ? {
      secondary_preset: {
        id: secondaryPreset.id,
        contributes: catalogue.routing.secondary_inheritance_fields
      }
    } : {}),
    topologies,
    style_preset: stylePreset,
    resolved_theme: structuredClone(theme),
    resolved_rules: {
      aesthetic_thesis: primaryPreset.aesthetic_thesis,
      tone: primaryPreset.tone,
      typography_direction: primaryPreset.typography_direction,
      composition: {
        ...primaryPreset.composition,
        density
      },
      media: primaryPreset.media,
      data_visualization: primaryPreset.data_visualization,
      motion: primaryPreset.motion,
      surface_emphasis: primaryPreset.surface_emphasis[surfaceId] + supportingEmphasis,
      anti_patterns: primaryPreset.anti_patterns
    },
    selection: {
      override_used: Boolean(
        brief.primary_preset_override || brief.secondary_preset_override
      ),
      reason_codes: [
        `reader-job:${brief.reader_job}`,
        `primary-relationship:${brief.primary_relationship}`,
        `surface:${surfaceId}`,
        ...(brief.override_reason ? ['explicit-preset-override'] : [])
      ],
      brand_status: brief.brand_context === 'provided'
        ? 'requires_verified_brand_merge'
        : 'not_provided'
    }
  };
  validateOrThrow(assets.profileSchema, profile, 'resolved design profile');
  return profile;
}

export function validateResolvedDesignProfile(
  profile,
  artifactType,
  assets = loadDesignProfileAssets()
) {
  const errors = validateJsonInstance(assets.profileSchema, profile);
  if (errors.length) return errors.map((error) => `profile schema: ${error}`);
  if (profile.catalogue_digest !== assets.catalogueDigest) {
    errors.push('catalogue_digest does not match the installed design profile catalogue');
  }
  if (profile.theme_digest !== assets.themeDigest) {
    errors.push('theme_digest does not match the installed theme registry');
  }
  if (profile.surface?.artifact_type !== artifactType) {
    errors.push(
      `profile surface ${profile.surface?.artifact_type} does not match artifact type ${artifactType}`
    );
  }
  if (errors.length) return errors;

  try {
    const expected = resolveDesignProfile(profile.brief, artifactType, assets);
    if (JSON.stringify(profile) !== JSON.stringify(expected)) {
      errors.push('profile does not match the deterministic resolution of its brief');
    }
  } catch (error) {
    errors.push(`profile cannot be reproduced: ${error.message}`);
  }
  return errors;
}

export function resolveTemplateCandidates(profile, templateRegistry) {
  if (!templateRegistry || !Array.isArray(templateRegistry.templates)) {
    throw new Error('template registry is required for design profile routing');
  }
  const compatibleTemplates = templateRegistry.templates
    .filter((template) => template.artifact_types?.includes(profile.surface.artifact_type))
    .filter((template) => template.style_presets?.includes(profile.style_preset));
  const layoutErrors = compatibleTemplates.flatMap(
    (template) => validateTemplateLayoutContract(template)
  );
  if (layoutErrors.length) {
    throw new Error(`template layout contract is invalid:\n- ${layoutErrors.join('\n- ')}`);
  }
  const candidates = compatibleTemplates
    .filter((template) => profile.topologies.every(
      (topologyId) => Array.isArray(template.topology_support?.[topologyId])
        && template.topology_support[topologyId].length > 0
    ))
    .filter((template) => {
      if (profile.surface.artifact_type !== 'poster') return true;
      const [firstTopology, ...remainingTopologies] = profile.topologies;
      const sharedLayouts = new Set(template.topology_support[firstTopology]);
      return remainingTopologies.every((topologyId) => {
        for (const layoutId of [...sharedLayouts]) {
          if (!template.topology_support[topologyId].includes(layoutId)) {
            sharedLayouts.delete(layoutId);
          }
        }
        return sharedLayouts.size > 0;
      });
    })
    .map((template) => ({
      template_id: template.id,
      topology_layouts: Object.fromEntries(profile.topologies.map((topologyId) => [
        topologyId,
        [...template.topology_support[topologyId]]
      ]))
    }))
    .sort((a, b) => a.template_id.localeCompare(b.template_id));
  const status = candidates.length === 0
    ? 'unsupported'
    : candidates.length === 1
      ? 'resolved'
      : 'needs_direction_selection';
  return {
    schema_version: 'design-template-resolution/v1',
    status,
    artifact_type: profile.surface.artifact_type,
    style_preset: profile.style_preset,
    topologies: [...profile.topologies],
    candidates,
    reason_codes: [
      `artifact-type:${profile.surface.artifact_type}`,
      `style-preset:${profile.style_preset}`,
      ...profile.topologies.map((topologyId) => `topology:${topologyId}`),
      ...(candidates.length ? [] : ['no-compatible-template'])
    ]
  };
}

export function resolveSelectedTemplate(profile, templateRegistry, templateId) {
  const candidateResolution = resolveTemplateCandidates(profile, templateRegistry);
  if (candidateResolution.status === 'unsupported') {
    throw new Error(
      `design profile has no compatible template for `
      + `${profile.surface.artifact_type}, ${profile.style_preset}, `
      + `${profile.topologies.join(', ')}`
    );
  }
  const selectedCandidate = candidateResolution.candidates.find(
    (candidate) => candidate.template_id === templateId
  );
  if (!selectedCandidate) {
    throw new Error(
      `template ${templateId} is not a design-profile candidate; choose one of: `
      + candidateResolution.candidates.map(
        (candidate) => candidate.template_id
      ).join(', ')
    );
  }
  return {
    ...candidateResolution,
    candidate_status: candidateResolution.status,
    status: 'selected',
    selected_template_id: selectedCandidate.template_id,
    selected_topology_layouts: selectedCandidate.topology_layouts
  };
}
