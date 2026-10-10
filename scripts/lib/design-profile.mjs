import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonInstance } from './json-schema.mjs';
import { validateTemplateLayoutContract } from './layout-registry.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
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

const provenanceRanks = Object.freeze({
  'source-verbatim': 5,
  'accessibility-policy': 4,
  'content-constraint': 3,
  'profile-explicit': 2,
  'suggested-default': 1
});

const enforcedContentConstraintTargets = Object.freeze(new Set([
  'content.required_fields',
  'content.required_facts',
  'content.semantic_order',
  'content.density_bounds',
  'content.evidence_role',
  'content.primary_action',
  'content.do_not_rewrite',
  'content.preserved_invariants'
]));

const validDegradationStatuses = Object.freeze(new Set(['degraded_to_static']));
const validSecondaryPrecedence = Object.freeze(new Set(['primary-over-secondary']));

function assertRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function validateVisualRegistryIntegrity(registry) {
  const errors = [];
  const recipes = registry.recipes || [];
  const profiles = registry.profiles || [];
  for (const [label, items] of [['recipe', recipes], ['visual profile', profiles]]) {
    const duplicates = duplicateIds(items);
    if (duplicates.length) errors.push(`${label} ids must be unique: ${duplicates.join(', ')}`);
  }
  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  for (const recipe of recipes) {
    for (const reference of [...recipe.conflicts_with, recipe.fallback]) {
      if (!recipeIds.has(reference)) {
        errors.push(`recipe ${recipe.id} references unknown recipe ${reference}`);
      }
    }
    for (const conflictId of recipe.conflicts_with) {
      const peer = recipes.find((candidate) => candidate.id === conflictId);
      if (peer && !peer.conflicts_with.includes(recipe.id)) {
        errors.push(`recipe conflict must be symmetric: ${recipe.id} and ${conflictId}`);
      }
    }
  }
  for (const profile of profiles) {
    const usedIds = profile.recipe_uses.map((use) => use.recipe_id);
    if (new Set(usedIds).size !== usedIds.length) {
      errors.push(`visual profile ${profile.id} uses a recipe more than once`);
    }
    const compatibleKeys = new Set();
    for (const compatible of profile.compatible_recipe_inputs || []) {
      if (!recipeIds.has(compatible.recipe_id)) {
        errors.push(`visual profile ${profile.id} declares unknown compatible recipe ${compatible.recipe_id}`);
      }
      for (const name of compatible.input_names) {
        const key = `${compatible.recipe_id}.${name}`;
        if (compatibleKeys.has(key)) {
          errors.push(`visual profile ${profile.id} repeats compatible recipe input ${key}`);
        }
        compatibleKeys.add(key);
      }
    }
    const variationIds = (profile.variations || []).map((variation) => variation.id);
    if (new Set(variationIds).size !== variationIds.length) {
      errors.push(`visual profile ${profile.id} variation ids must be unique`);
    }
    for (const variation of profile.variations || []) {
      const variationRecipeIds = variation.recipe_inputs.map((item) => item.recipe_id);
      if (new Set(variationRecipeIds).size !== variationRecipeIds.length) {
        errors.push(`visual profile ${profile.id} variation ${variation.id} repeats a recipe`);
      }
      for (const item of variation.recipe_inputs) {
        if (!recipeIds.has(item.recipe_id)) {
          errors.push(`visual profile ${profile.id} variation ${variation.id} references unknown recipe ${item.recipe_id}`);
        }
        for (const [name, input] of Object.entries(item.inputs)) {
          if (input.provenance !== 'profile-explicit') {
            errors.push(`${profile.id}.${variation.id}.${name} cannot elevate provenance`);
          }
        }
      }
    }
    for (const use of profile.recipe_uses) {
      if (!recipeIds.has(use.recipe_id)) {
        errors.push(`visual profile ${profile.id} references unknown recipe ${use.recipe_id}`);
      }
      for (const [name, input] of Object.entries(use.inputs)) {
        if (!Object.hasOwn(provenanceRanks, input.provenance)) {
          errors.push(`${profile.id}.${name} has invalid provenance`);
        }
        if (input.provenance === 'source-verbatim') {
          errors.push(`${profile.id}.${name} cannot claim source-verbatim in the registry`);
        }
      }
    }
  }
  return errors;
}

function selectVisualProfile(request, profiles) {
  if (request.profile_id) {
    const profile = profiles.find((candidate) => candidate.id === request.profile_id);
    if (!profile) throw new Error(`unknown visual profile: ${request.profile_id}`);
    return profile;
  }
  const cues = new Set(request.cues || []);
  const ranked = profiles
    .map((profile) => ({
      profile,
      score: profile.cues.filter((cue) => cues.has(cue)).length
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.profile.id.localeCompare(b.profile.id));
  if (!ranked.length || (ranked[1] && ranked[0].score === ranked[1].score)) return null;
  return ranked[0].profile;
}

function selectDecision(current, candidate) {
  if (!current) return structuredClone(candidate);
  return provenanceRanks[candidate.provenance] > provenanceRanks[current.provenance]
    ? structuredClone(candidate)
    : current;
}

function selectVariationDecision(current, candidate) {
  if (!current || provenanceRanks[current.provenance] <= provenanceRanks['profile-explicit']) {
    return structuredClone(candidate);
  }
  return current;
}

export function resolveVisualTreatment(request = {}, registry) {
  assertRecord(request, 'visual treatment request');
  assertRecord(registry, 'visual recipe registry');
  const integrityErrors = validateVisualRegistryIntegrity(registry);
  if (integrityErrors.length) {
    throw new Error(`visual recipe registry integrity failed:\n- ${integrityErrors.join('\n- ')}`);
  }
  const profile = selectVisualProfile(request, registry.profiles);
  if (!profile) {
    return {
      status: 'profile_not_applied',
      profile_id: null,
      variation_id: null,
      variation_patch: {},
      decisions: {},
      trace: ['no-unique-profile-match']
    };
  }

  const recipesById = new Map(registry.recipes.map((recipe) => [recipe.id, recipe]));
  const selectedIds = [
    ...profile.recipe_uses.map((use) => use.recipe_id),
    ...(request.recipe_ids || [])
  ];
  for (const recipeId of selectedIds) {
    if (!recipesById.has(recipeId)) throw new Error(`unknown recipe: ${recipeId}`);
  }
  const selectedSet = new Set(selectedIds);
  const conflicts = [];
  for (const recipeId of sorted(selectedSet)) {
    for (const conflictId of recipesById.get(recipeId).conflicts_with) {
      if (selectedSet.has(conflictId) && recipeId.localeCompare(conflictId) < 0) {
        conflicts.push([recipeId, conflictId]);
      }
    }
  }
  if (conflicts.length) {
    return {
      status: 'conflict',
      profile_id: profile.id,
      decisions: {},
      trace: ['fail-closed:unresolved-conflict'],
      conflicts
    };
  }

  const decisions = {};
  const trace = [];
  for (const use of profile.recipe_uses) {
    const recipe = recipesById.get(use.recipe_id);
    for (const [name, input] of Object.entries(use.inputs)) {
      const path = `${recipe.dimension}.${name}`;
      decisions[path] = selectDecision(decisions[path], input);
    }
    trace.push(`recipe:${recipe.id}`);
  }
  const variationPatch = {};
  const variationId = request.variation_id || null;
  if (variationId) {
    const variation = (profile.variations || []).find((candidate) => candidate.id === variationId);
    if (!variation) {
      return {
        status: 'variation_not_found',
        profile_id: profile.id,
        variation_id: variationId,
        variation_patch: {},
        decisions,
        trace: [...trace, `fail-closed:variation-not-found:${variationId}`]
      };
    }
    const usedIds = new Set(profile.recipe_uses.map((use) => use.recipe_id));
    const compatibleKeys = new Set((profile.compatible_recipe_inputs || []).flatMap(
      (compatible) => compatible.input_names.map(
        (name) => `${compatible.recipe_id}.${name}`
      )
    ));
    const incompatible = variation.recipe_inputs.flatMap((item) => Object.keys(item.inputs)
      .filter((name) => !usedIds.has(item.recipe_id)
        || !compatibleKeys.has(`${item.recipe_id}.${name}`))
      .map((name) => `${item.recipe_id}.${name}`));
    if (incompatible.length) {
      return {
        status: 'incompatible_recipe',
        profile_id: profile.id,
        variation_id: variationId,
        variation_patch: {},
        decisions,
        trace: [...trace, `fail-closed:incompatible-recipe:${sorted(incompatible).join(',')}`]
      };
    }
    for (const item of variation.recipe_inputs) {
      const recipe = recipesById.get(item.recipe_id);
      for (const [name, input] of Object.entries(item.inputs)) {
        const path = `${recipe.dimension}.${name}`;
        variationPatch[path] = structuredClone(input);
        decisions[path] = selectVariationDecision(decisions[path], input);
      }
    }
    trace.push(`variation:${variationId}`);
  }
  for (const recipeId of request.recipe_ids || []) trace.push(`recipe:${recipeId}`);
  for (const [path, input] of Object.entries(request.overrides || {})) {
    assertRecord(input, `visual treatment override ${path}`);
    if (!Object.hasOwn(input, 'value') || !Object.hasOwn(provenanceRanks, input.provenance)) {
      throw new Error(`visual treatment override ${path} requires value and valid provenance`);
    }
    if (typeof input.value === 'number' && !input.unit) {
      throw new Error(`visual treatment override ${path} requires unit for a numeric value`);
    }
    decisions[path] = selectDecision(decisions[path], input);
    trace.push(`override:${path}:${input.provenance}`);
  }

  const fallbackReason = request.capabilities?.backdrop_filter === false
    ? 'unsupported-backdrop-filter'
    : request.content_density === 'dense'
      ? 'dense-content'
      : request.background_complexity === 'high'
        ? 'complex-background'
        : null;
  if (decisions['material.mode']?.value === 'translucent' && fallbackReason) {
    decisions['material.mode'] = {
      value: 'opaque-readable',
      provenance: request.capabilities?.backdrop_filter === false
        ? 'accessibility-policy'
        : 'content-constraint'
    };
    delete decisions['material.blur'];
    trace.push(`fallback:${fallbackReason}:material.opaque-readable-surface`);
    return {
      status: 'capability_fallback',
      profile_id: profile.id,
      variation_id: variationId,
      variation_patch: variationPatch,
      decisions,
      trace
    };
  }
  return {
    status: 'resolved',
    profile_id: profile.id,
    variation_id: variationId,
    variation_patch: variationPatch,
    decisions,
    trace
  };
}

function validateContentRoutingIntegrity(catalogue) {
  const errors = [];
  const routing = catalogue.content_routing;
  if (!routing || typeof routing !== 'object' || Array.isArray(routing)) {
    return ['content_routing must be an object'];
  }
  const presets = catalogue.product_presets || [];
  const duplicatePresetIds = duplicateIds(presets);
  if (duplicatePresetIds.length) {
    errors.push(`product preset ids must be unique: ${duplicatePresetIds.join(', ')}`);
  }
  const presetIds = new Set(presets.map((item) => item.id));
  const constraints = routing.constraints || [];
  const constraintIds = new Set();
  for (const constraint of constraints) {
    if (constraintIds.has(constraint.id)) {
      errors.push(`content constraint ids must be unique: ${constraint.id}`);
    }
    constraintIds.add(constraint.id);
    if (!enforcedContentConstraintTargets.has(constraint.target_path)) {
      errors.push(`content constraint ${constraint.id} target is not allowlisted: ${constraint.target_path}`);
    }
  }
  const ruleIds = new Set();
  for (const rule of routing.rules || []) {
    if (ruleIds.has(rule.id)) errors.push(`content routing rule ids must be unique: ${rule.id}`);
    ruleIds.add(rule.id);
    if (!presetIds.has(rule.profile_id)) {
      errors.push(`content routing rule ${rule.id} references unknown profile ${rule.profile_id}`);
    }
    for (const constraintId of rule.enforced_constraint_ids || []) {
      if (!constraintIds.has(constraintId)) {
        errors.push(`content routing rule ${rule.id} references unknown constraint ${constraintId}`);
      }
    }
  }
  const degradationIds = duplicateIds((routing.degradation_rules || []).map((rule) => ({ id: rule.id })));
  if (degradationIds.length) errors.push(`degradation rule ids must be unique: ${degradationIds.join(', ')}`);
  for (const rule of routing.degradation_rules || []) {
    if (!validDegradationStatuses.has(rule.status)) {
      errors.push(`degradation rule ${rule.id} has invalid status ${rule.status}`);
    }
    for (const field of [
      'source_mediums', 'target_mediums', 'preserved_invariants',
      'removed_mechanisms', 'substitute_representation'
    ]) {
      if (!Array.isArray(rule[field]) || rule[field].length === 0) {
        errors.push(`degradation rule ${rule.id} requires non-empty ${field}`);
      }
    }
  }
  const policyIds = duplicateIds((routing.visual_conflict_policies || []).map((rule) => ({ id: rule.id })));
  if (policyIds.length) errors.push(`visual conflict policy ids must be unique: ${policyIds.join(', ')}`);

  const secondaryPolicy = catalogue.routing?.secondary_override_policy;
  if (!secondaryPolicy || typeof secondaryPolicy !== 'object' || Array.isArray(secondaryPolicy)) {
    errors.push('secondary override policy must be an object');
  } else {
    for (const precedence of secondaryPolicy.allowed_precedence || []) {
      if (!validSecondaryPrecedence.has(precedence)) {
        errors.push(`secondary override policy has invalid precedence ${precedence}`);
      }
    }
    if (!sameValues(
      secondaryPolicy.allowed_contributions || [],
      catalogue.routing?.secondary_inheritance_fields || []
    )) {
      errors.push('secondary override contributions must match secondary inheritance fields');
    }
    const seenPairs = new Set();
    for (const pair of secondaryPolicy.mutually_exclusive_profile_pairs || []) {
      const normalized = sorted(pair || []).join('\0');
      if (seenPairs.has(normalized)) errors.push(`duplicate mutually exclusive profile pair: ${pair.join(', ')}`);
      seenPairs.add(normalized);
      for (const profileId of pair || []) {
        if (!presetIds.has(profileId)) {
          errors.push(`secondary override policy references unknown profile ${profileId}`);
        }
      }
    }
  }
  return errors;
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
  errors.push(...validateContentRoutingIntegrity(catalogue));
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
  const visualRegistryRecord = readJsonRecord(
    join(root, 'design-systems/defaults/visual-recipe-registry.json')
  );
  const catalogueSchema = readJsonRecord(
    join(root, 'schemas/design-profile-catalogue.schema.json')
  ).value;
  const briefSchema = readJsonRecord(join(root, 'schemas/design-brief.schema.json')).value;
  const profileSchema = readJsonRecord(join(root, 'schemas/design-profile.schema.json')).value;
  const themeSchema = readJsonRecord(join(root, 'schemas/style-presets.schema.json')).value;
  const colorContractSchema = readJsonRecord(
    join(root, 'schemas/color-contract.schema.json')
  ).value;
  const visualRegistrySchema = readJsonRecord(
    join(root, 'schemas/visual-recipe-registry.schema.json')
  ).value;

  validateOrThrow(
    catalogueSchema,
    catalogueRecord.value,
    'design profile catalogue'
  );
  validateOrThrow(themeSchema, themeRecord.value, 'style preset registry');
  for (const [presetId, preset] of Object.entries(themeRecord.value.presets || {})) {
    validateOrThrow(
      colorContractSchema,
      preset.color_contract,
      `style preset ${presetId} color contract`
    );
  }
  validateOrThrow(
    visualRegistrySchema,
    visualRegistryRecord.value,
    'visual recipe registry'
  );
  const integrityErrors = validateCatalogueIntegrity(
    catalogueRecord.value,
    themeRecord.value
  );
  integrityErrors.push(...validateVisualRegistryIntegrity(visualRegistryRecord.value));
  if (integrityErrors.length) {
    throw new Error(`design profile catalogue integrity failed:\n- ${integrityErrors.join('\n- ')}`);
  }
  return {
    briefSchema,
    catalogue: catalogueRecord.value,
    catalogueDigest: catalogueRecord.digest,
    profileSchema,
    themes: themeRecord.value,
    themeSchema,
    themeDigest: themeRecord.digest,
    colorContractSchema,
    visualRegistry: visualRegistryRecord.value,
    visualRegistryDigest: visualRegistryRecord.digest
  };
}

function valueAtPath(value, path) {
  return path.split('.').reduce(
    (current, segment) => current && Object.hasOwn(current, segment) ? current[segment] : undefined,
    value
  );
}

function routingResult(status, additions = {}) {
  return {
    schema_version: 'content-routing/v1',
    status,
    selected_profile_id: null,
    candidate_profile_ids: [],
    rejected_candidate_ids: [],
    reason_codes: [],
    matched_rule_ids: [],
    unknown_signals: [],
    conflicts: [],
    clarification_questions: [],
    content_constraints: {},
    enforced_constraints: [],
    semantic_degradation: null,
    trace: [],
    ...additions
  };
}

function secondaryOverrideConflict(brief, primaryPresetId, catalogue, context = {}) {
  const secondaryPresetId = brief.secondary_preset_override;
  if (!secondaryPresetId || secondaryPresetId === primaryPresetId) return null;
  const policy = catalogue.routing?.secondary_override_policy;
  const precedence = brief.secondary_preset_precedence;
  const base = {
    candidate_profile_ids: context.candidate_profile_ids || [primaryPresetId],
    rejected_candidate_ids: sorted([primaryPresetId, secondaryPresetId]),
    matched_rule_ids: context.matched_rule_ids || [],
    content_constraints: context.content_constraints || {},
    selected_profile_id: null
  };
  if (!precedence || !policy?.allowed_precedence?.includes(precedence)) {
    return routingResult('conflict', {
      ...base,
      reason_codes: ['intent_conflict', 'secondary_precedence_missing'],
      conflicts: [{
        field: 'secondary_preset_override',
        sources: ['primary-profile', 'user-explicit-secondary'],
        values: [primaryPresetId, secondaryPresetId]
      }],
      clarification_questions: [
        'Declare whether the primary profile takes precedence over the secondary profile.'
      ],
      trace: [...(context.trace || []), 'conflict:secondary-precedence-missing']
    });
  }
  const pairKey = sorted([primaryPresetId, secondaryPresetId]).join('\0');
  const mutuallyExclusive = (policy.mutually_exclusive_profile_pairs || [])
    .some((pair) => sorted(pair).join('\0') === pairKey);
  if (mutuallyExclusive) {
    return routingResult('conflict', {
      ...base,
      reason_codes: ['intent_conflict', 'secondary_profiles_mutually_exclusive'],
      conflicts: [{
        field: 'secondary_preset_override',
        sources: ['catalogue-mutual-exclusion', 'user-explicit-secondary'],
        values: [primaryPresetId, secondaryPresetId]
      }],
      clarification_questions: ['Choose one of the mutually exclusive profiles.'],
      trace: [...(context.trace || []), 'conflict:secondary-profiles-mutually-exclusive']
    });
  }
  return null;
}

function signalMatches(actual, accepted) {
  return Array.isArray(accepted) && accepted.includes(actual);
}

function routingConditionMatches(when = {}, brief, signals) {
  return (!when.reader_jobs || signalMatches(brief.reader_job, when.reader_jobs))
    && (!when.content_roles || signalMatches(signals.content_role, when.content_roles))
    && (!when.evidence_roles || signalMatches(signals.evidence_role, when.evidence_roles))
    && (when.requires_reduced_transparency === undefined
      || signals.accessibility?.requires_reduced_transparency === when.requires_reduced_transparency);
}

export function evaluateContentRouting(brief, artifactType, catalogue) {
  assertRecord(brief, 'design brief');
  assertRecord(catalogue, 'design profile catalogue');
  const integrityErrors = validateContentRoutingIntegrity(catalogue);
  if (integrityErrors.length) {
    throw new Error(`design profile catalogue integrity failed:\n- ${integrityErrors.join('\n- ')}`);
  }
  const config = catalogue.content_routing;
  const signals = brief.content_signals;
  if (!config || !signals) {
    return routingResult('abstained', {
      reason_codes: ['content_signals_absent'],
      unknown_signals: ['content_signals'],
      trace: ['abstain:content-signals-absent']
    });
  }

  const unknownSignals = sorted((config.required_signal_paths || [])
    .filter((path) => valueAtPath(signals, path) === undefined)
    .map((path) => `content_signals.${path}`));
  if (unknownSignals.length) {
    return routingResult('blocked', {
      reason_codes: ['content_constraints_incomplete'],
      unknown_signals: unknownSignals,
      trace: [
        ...unknownSignals.map((path) => `unknown:${path}`),
        'blocked:content-constraints-incomplete'
      ]
    });
  }

  const contentConstraints = Object.fromEntries([
    'content_role', 'required_fields', 'required_facts', 'semantic_order', 'density_bounds', 'evidence_role',
    'primary_action', 'do_not_rewrite', 'preserved_invariants', 'truth_status'
  ].map((name) => [name, structuredClone(signals[name])]));
  if (['unknown', 'conflict'].includes(signals.truth_status)) {
    const explicitVisualProfile = brief.visual_treatment?.profile_id;
    const hasExplicitConflict = Boolean(explicitVisualProfile);
    return routingResult(hasExplicitConflict ? 'conflict' : 'blocked', {
      rejected_candidate_ids: [],
      reason_codes: [
        ...(hasExplicitConflict ? ['intent_conflict'] : []),
        'truth_constraints_incomplete'
      ],
      unknown_signals: [`content_signals.truth_status:${signals.truth_status}`],
      conflicts: hasExplicitConflict ? [{
        field: 'visual_treatment.profile_id',
        sources: ['truth-constraint', 'user-explicit'],
        values: ['truth-safe-treatment', explicitVisualProfile]
      }] : [],
      clarification_questions: hasExplicitConflict
        ? ['Resolve the truth state before applying an explicit visual treatment.']
        : ['What verified truth state should the content preserve?'],
      content_constraints: contentConstraints,
      trace: [`${hasExplicitConflict ? 'conflict' : 'blocked'}:truth-status:${signals.truth_status}`]
    });
  }
  const candidateTrace = Object.entries(signals.candidate_signals || {})
    .flatMap(([kind, values]) => (values || []).map((value) => `candidate-signal:${kind}:${value}`))
    .sort();
  const matchedRules = (config.rules || [])
    .filter((rule) => routingConditionMatches(rule.when, brief, signals))
    .sort((a, b) => a.id.localeCompare(b.id));
  const candidateIds = sorted(new Set(matchedRules.map((rule) => rule.profile_id)));
  const matchedRuleIds = matchedRules.map((rule) => rule.id);
  const routeTrace = [
    `signal:reader-job:${brief.reader_job}`,
    `signal:content-role:${signals.content_role}`,
    ...candidateTrace,
    ...matchedRuleIds.map((id) => `matched-rule:${id}`)
  ];

  if (!candidateIds.length) {
    return routingResult('abstained', {
      reason_codes: ['no_semantic_route'],
      matched_rule_ids: matchedRuleIds,
      content_constraints: contentConstraints,
      trace: [...routeTrace, 'abstain:no-semantic-route']
    });
  }
  if (candidateIds.length > 1) {
    return routingResult('conflict', {
      candidate_profile_ids: candidateIds,
      rejected_candidate_ids: candidateIds,
      reason_codes: ['ambiguous_semantic_routes', 'intent_conflict'],
      matched_rule_ids: matchedRuleIds,
      conflicts: [{
        field: 'primary_preset',
        sources: matchedRuleIds,
        values: candidateIds
      }],
      clarification_questions: [
        'Which reader-job/content-role route should take precedence?'
      ],
      content_constraints: contentConstraints,
      trace: [...routeTrace, 'conflict:ambiguous-semantic-routes']
    });
  }

  const selectedProfileId = candidateIds[0];
  if (brief.primary_preset_override && brief.primary_preset_override !== selectedProfileId) {
    return routingResult('conflict', {
      candidate_profile_ids: candidateIds,
      rejected_candidate_ids: sorted([selectedProfileId, brief.primary_preset_override]),
      reason_codes: ['intent_conflict'],
      matched_rule_ids: matchedRuleIds,
      conflicts: [{
        field: 'primary_preset',
        sources: ['content-routing', 'user-explicit'],
        values: [selectedProfileId, brief.primary_preset_override]
      }],
      clarification_questions: [
        'Should the explicit primary preset or the reader-job/content-role route take precedence?'
      ],
      content_constraints: contentConstraints,
      trace: [...routeTrace, 'conflict:explicit-primary-preset']
    });
  }

  const secondaryConflict = secondaryOverrideConflict(
    brief,
    selectedProfileId,
    catalogue,
    {
      candidate_profile_ids: candidateIds,
      matched_rule_ids: matchedRuleIds,
      content_constraints: contentConstraints,
      trace: routeTrace
    }
  );
  if (secondaryConflict) return secondaryConflict;
  const secondaryPolicyId = brief.secondary_preset_override
    ? catalogue.routing.secondary_override_policy.id
    : null;

  const visualProfileId = brief.visual_treatment?.profile_id;
  const visualConflict = (config.visual_conflict_policies || [])
    .filter((policy) => routingConditionMatches(policy.when, brief, signals)
      && policy.disallowed_visual_profile_ids?.includes(visualProfileId))
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (visualConflict) {
    return routingResult('conflict', {
      candidate_profile_ids: candidateIds,
      rejected_candidate_ids: [selectedProfileId],
      reason_codes: ['intent_conflict', visualConflict.reason_code],
      matched_rule_ids: [...matchedRuleIds, visualConflict.id],
      conflicts: [{
        field: 'visual_treatment.profile_id',
        sources: ['content-constraint', 'user-explicit'],
        values: ['truth-safe-treatment', visualProfileId]
      }],
      clarification_questions: [
        'Remove the conflicting visual treatment or provide an approved truth-safe alternative?'
      ],
      content_constraints: contentConstraints,
      trace: [...routeTrace, `matched-rule:${visualConflict.id}`, 'conflict:visual-constraint']
    });
  }

  const delivery = signals.delivery;
  const requiresDegradation = delivery.source_medium !== delivery.target_medium
    || delivery.reduced_motion === true;
  const degradationRule = (config.degradation_rules || [])
    .filter((rule) => signalMatches(delivery.source_medium, rule.source_mediums)
      && signalMatches(delivery.target_medium, rule.target_mediums)
      && signals.preserved_invariants.every(
        (invariant) => rule.preserved_invariants.includes(invariant)
      ))
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (requiresDegradation && !degradationRule) {
    return routingResult('blocked', {
      candidate_profile_ids: candidateIds,
      rejected_candidate_ids: candidateIds,
      reason_codes: ['semantic_degradation_blocked'],
      matched_rule_ids: matchedRuleIds,
      content_constraints: contentConstraints,
      semantic_degradation: {
        source_medium: delivery.source_medium,
        target_medium: delivery.target_medium,
        preserved_invariants: structuredClone(signals.preserved_invariants),
        removed_mechanisms: [],
        substitute_representation: [],
        status: 'semantic_degradation_blocked'
      },
      trace: [...routeTrace, `blocked:no-equivalent-degradation:${artifactType}`]
    });
  }

  const constraintById = new Map((config.constraints || []).map((item) => [item.id, item]));
  const constraintIds = sorted(new Set(matchedRules.flatMap(
    (rule) => rule.enforced_constraint_ids || []
  )));
  const enforcedConstraints = constraintIds.map((id) => {
    const definition = constraintById.get(id);
    if (!definition || !enforcedContentConstraintTargets.has(definition.target_path)) {
      throw new Error(`content routing constraint is not allowlisted: ${id}`);
    }
    return {
      id,
      target_path: definition.target_path,
      value: structuredClone(valueAtPath(signals, definition.source_path)),
      provenance: 'content-constraint'
    };
  });
  const semanticDegradation = degradationRule ? {
    source_medium: delivery.source_medium,
    target_medium: delivery.target_medium,
    preserved_invariants: structuredClone(signals.preserved_invariants),
    removed_mechanisms: structuredClone(degradationRule.removed_mechanisms),
    substitute_representation: structuredClone(degradationRule.substitute_representation),
    status: degradationRule.status
  } : {
    source_medium: delivery.source_medium,
    target_medium: delivery.target_medium,
    preserved_invariants: structuredClone(signals.preserved_invariants),
    removed_mechanisms: [],
    substitute_representation: [],
    status: 'not_required'
  };
  const degradationIds = degradationRule ? [degradationRule.id] : [];
  return routingResult('recommended', {
    selected_profile_id: selectedProfileId,
    candidate_profile_ids: candidateIds,
    reason_codes: sorted(new Set([
      ...matchedRules.map((rule) => rule.reason_code),
      ...(secondaryPolicyId ? ['secondary_precedence_applied'] : []),
      ...(degradationRule ? [degradationRule.status] : [])
    ])),
    matched_rule_ids: [
      ...matchedRuleIds,
      ...(secondaryPolicyId ? [secondaryPolicyId] : []),
      ...degradationIds
    ],
    content_constraints: contentConstraints,
    enforced_constraints: enforcedConstraints,
    semantic_degradation: semanticDegradation,
    trace: [
      ...routeTrace,
      ...(secondaryPolicyId ? [`precedence:${secondaryPolicyId}:primary-over-secondary`] : []),
      ...degradationIds.map((id) => `matched-rule:${id}`),
      `recommended:${selectedProfileId}`
    ]
  });
}

function contentRoutingError(result) {
  const code = result.reason_codes.includes('intent_conflict')
    ? 'intent_conflict'
    : result.reason_codes.includes('semantic_degradation_blocked')
      ? 'semantic_degradation_blocked'
      : result.reason_codes.includes('truth_constraints_incomplete')
        ? 'truth_constraints_incomplete'
        : result.reason_codes.includes('content_constraints_incomplete')
          ? 'content_constraints_incomplete'
          : 'content_route_abstained';
  const error = new Error(`content routing ${code}`);
  error.code = code;
  error.routing = result;
  return error;
}

export function resolveDesignProfile(brief, artifactType, assets = loadDesignProfileAssets()) {
  validateOrThrow(assets.briefSchema, brief, 'design brief');
  const surfaceId = surfaceIdByArtifactType.get(artifactType);
  if (!surfaceId) {
    throw new Error(`design profiles support only ppt-handoff, html-deck, and poster: ${artifactType}`);
  }

  const catalogue = assets.catalogue;
  const catalogueIntegrityErrors = validateCatalogueIntegrity(catalogue, assets.themes);
  if (catalogueIntegrityErrors.length) {
    throw new Error(`design profile catalogue integrity failed:\n- ${catalogueIntegrityErrors.join('\n- ')}`);
  }
  const contentRouting = brief.content_signals
    ? evaluateContentRouting(brief, artifactType, catalogue)
    : null;
  if (contentRouting && contentRouting.status !== 'recommended') {
    throw contentRoutingError(contentRouting);
  }
  const primaryPresetId = contentRouting?.selected_profile_id
    || brief.primary_preset_override
    || catalogue.routing.reader_job_to_preset[brief.reader_job];
  const primaryPreset = catalogue.product_presets.find(
    (item) => item.id === primaryPresetId
  );
  if (!primaryPreset) throw new Error(`unknown primary product preset: ${primaryPresetId}`);
  const secondaryConflict = secondaryOverrideConflict(
    brief,
    primaryPresetId,
    catalogue,
    contentRouting || {}
  );
  if (secondaryConflict) throw contentRoutingError(secondaryConflict);

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
  const visualRequest = brief.visual_treatment
    ? {
        ...brief.visual_treatment,
        content_density: density
      }
    : { content_density: density };
  const visualTreatment = resolveVisualTreatment(visualRequest, assets.visualRegistry);
  if (visualTreatment.status === 'conflict') {
    throw new Error(
      `visual treatment conflict: ${visualTreatment.conflicts.map((pair) => pair.join(' <> ')).join(', ')}`
    );
  }
  if (visualTreatment.status === 'variation_not_found') {
    throw new Error(
      `visual treatment variation_not_found: ${visualTreatment.profile_id}/${visualTreatment.variation_id}`
    );
  }
  if (visualTreatment.status === 'incompatible_recipe') {
    throw new Error(
      `visual treatment incompatible_recipe: ${visualTreatment.profile_id}/${visualTreatment.variation_id}`
    );
  }
  const profile = {
    schema_version: 'design-profile/v2',
    catalogue_digest: assets.catalogueDigest,
    theme_digest: assets.themeDigest,
    visual_registry_digest: assets.visualRegistryDigest,
    brief: structuredClone(brief),
    ...(contentRouting ? { content_routing: contentRouting } : {}),
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
        contributes: catalogue.routing.secondary_override_policy.allowed_contributions
      }
    } : {}),
    topologies,
    style_preset: stylePreset,
    resolved_theme: structuredClone(theme),
    resolved_rules: {
      aesthetic_thesis: primaryPreset.aesthetic_thesis,
      tone: primaryPreset.tone,
      typography_direction: primaryPreset.typography_direction,
      color_direction: primaryPreset.color_direction,
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
    visual_treatment: visualTreatment,
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
  if (profile.visual_registry_digest !== assets.visualRegistryDigest) {
    errors.push('visual_registry_digest does not match the installed visual recipe registry');
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
