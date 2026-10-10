import { createHash } from 'node:crypto';

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function computeHumanFactorsDigest(humanFactors) {
  if (!humanFactors || typeof humanFactors !== 'object' || Array.isArray(humanFactors)) {
    throw new Error('human-factor digest requires a resolved human_factors object');
  }
  return createHash('sha256').update(stable(humanFactors)).digest('hex');
}

export function computeDesignProfileDigest(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)
      || !/^design-profile\/v\d+$/.test(String(profile.schema_version || ''))) {
    throw new Error('design-profile digest requires a resolved design-profile/vN object');
  }
  return createHash('sha256').update(stable(profile)).digest('hex');
}

const readingPatternByRelationship = Object.freeze({
  causality: 'orient-trace-verify',
  chronology: 'orient-trace-verify',
  comparison: 'inspect-compare-explain',
  decision: 'scan-decide-verify',
  metrics: 'scan-decide-verify',
  narrative: 'orient-deep-read-reference',
  system: 'orient-trace-verify'
});

export function resolveHumanFactors(profile) {
  if (profile?.human_factors) return profile.human_factors;
  const artifactType = profile?.surface?.artifact_type;
  const brief = profile?.brief || {};
  const isPpt = artifactType === 'ppt-handoff';
  const isPoster = artifactType === 'poster';
  const attention = brief.attention_context && brief.attention_context !== 'auto'
    ? brief.attention_context
    : isPpt ? 'projected' : isPoster ? 'glance' : 'focused';
  const frequency = brief.usage_frequency && brief.usage_frequency !== 'auto'
    ? brief.usage_frequency
    : 'repeated';
  const input = brief.input_context && brief.input_context !== 'auto'
    ? brief.input_context
    : isPpt ? 'keyboard' : isPoster ? 'none' : 'mixed';
  const interaction = isPpt || isPoster ? 'static' : 'navigate';
  const navigation = isPpt ? 'external-player' : isPoster ? 'static' : 'paged';
  const relationship = brief.primary_relationship || 'decision';
  return {
    reading_pattern: readingPatternByRelationship[relationship] || 'scan-decide-verify',
    attention_context: attention,
    usage_frequency: frequency,
    input_context: input,
    interaction_intent: interaction,
    navigation_mode: navigation,
    entry_point: isPoster ? 'primary claim' : 'title and current page',
    progression: isPoster
      ? ['primary claim', 'supporting evidence', 'source note']
      : ['answer', 'evidence', 'caveat or action'],
    reading_order_policy: 'DOM and visual order must describe the same evidence sequence.',
    orientation_policy: isPoster
      ? 'No navigation state is required for a fixed poster.'
      : 'Current page, total pages, and section context remain visible.',
    interaction_policy: isPpt || isPoster
      ? 'Meaning exists in the static surface.'
      : 'Keyboard and pointer navigation preserve the current reading state.',
    state_policy: 'Default state exposes the primary answer and does not hide required evidence.',
    feedback_policy: isPpt || isPoster
      ? 'No interaction feedback is required.'
      : 'Navigation updates route, visible page, ARIA state, and status together.',
    interruption_policy: isPpt || isPoster
      ? 'Return to the static surface without losing meaning.'
      : 'Refresh preserves the current route or returns to the declared entry point.',
    control_policy: isPpt || isPoster
      ? 'No controls are required for the declared surface.'
      : 'Controls have accessible names, visible focus, and at least 24 CSS px targets.',
    minimum_target_css_px: isPpt || isPoster ? 0 : 24,
    required_checks: ['entry-point', 'progression', 'orientation-recovery'],
    assumptions: ['Human-factor defaults are derived from artifact type and reader relationship.']
  };
}

const bindings = [
  ['ARTIFACT_TYPE', 'data-artifact-type', (profile) => profile.surface.artifact_type],
  ['PRIMARY_PRESET', 'data-primary-preset', (profile) => profile.primary_preset],
  ['STYLE_PRESET', 'data-style-preset', (profile) => profile.style_preset],
  ['DESIGN_PROFILE_DIGEST', 'data-design-profile-digest', computeDesignProfileDigest],
  ['READING_PATTERN', 'data-reading-pattern', (profile) => profile.human_factors.reading_pattern],
  ['ATTENTION_CONTEXT', 'data-attention-context', (profile) => profile.human_factors.attention_context],
  ['USAGE_FREQUENCY', 'data-usage-frequency', (profile) => profile.human_factors.usage_frequency],
  ['INPUT_CONTEXT', 'data-input-context', (profile) => profile.human_factors.input_context],
  ['INTERACTION_INTENT', 'data-interaction-intent', (profile) => profile.human_factors.interaction_intent],
  ['NAVIGATION_MODE', 'data-navigation-mode', (profile) => profile.human_factors.navigation_mode],
  ['MINIMUM_TARGET_CSS_PX', 'data-min-target-size', (profile) => String(profile.human_factors.minimum_target_css_px)],
  ['HUMAN_FACTORS_DIGEST', 'data-human-factors-digest', (profile) => computeHumanFactorsDigest(profile.human_factors)]
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function bindHumanFactorsToHtml(html, profile) {
  if (typeof html !== 'string' || !html.trim()) {
    throw new Error('human-factor binding requires non-empty HTML');
  }
  if (!profile?.surface?.artifact_type) {
    throw new Error('human-factor binding requires a resolved design profile');
  }
  const humanFactors = resolveHumanFactors(profile);
  let output = html;
  const resolvedBindings = [];
  for (const [placeholder, attribute, resolveValue] of bindings) {
    const value = resolveValue({ ...profile, human_factors: humanFactors });
    if (typeof value !== 'string' || !value || value === 'auto') {
      throw new Error(`resolved design profile has invalid ${attribute}: ${String(value)}`);
    }
    output = output.replaceAll(`{{${placeholder}}}`, value);
    resolvedBindings.push([attribute, value]);
  }
  const humanRoot = output.match(/<main\b[^>]*\bdata-design-id\s*=\s*["'][^"']+["'][^>]*>/i)?.[0];
  if (!humanRoot) {
    throw new Error('HTML must bind human factors on one <main data-design-id> root');
  }
  for (const [attribute, value] of resolvedBindings) {
    const pattern = new RegExp(`\\b${attribute}=["']${escapeRegExp(value)}["']`, 'i');
    if (!pattern.test(humanRoot)) {
      throw new Error(`HTML root does not bind ${attribute}="${value}"`);
    }
  }
  for (const [placeholder] of bindings) {
    if (output.includes(`{{${placeholder}}}`)) {
      throw new Error(`HTML retains unresolved human-factor placeholder: ${placeholder}`);
    }
  }
  return output;
}
