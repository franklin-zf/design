export function v2Request(overrides = {}) {
  const base = {
    schema_version: 'design-execution-request/v2',
    goal: 'Create a decision artifact',
    use_scenario: 'Internal design review',
    audience: ['design lead'],
    source_materials: { mode: 'none', claim_scope: 'No external factual claims' },
    output_surface: { artifact_dir: 'artifact', artifact_type: 'poster', template_id: 'poster-type-led' },
    constraints: {
      workspace_root: '/private/tmp/design-workspace', changed_paths: [], sensitive_data: false,
      publication_target: false, multi_artifact: false, interactive: false, reversible: true,
      internal_only: true, direction_known: true
    },
    conditional_policies: {
      derived_data: { mode: 'none' },
      schematic: { enabled: false },
      render: {
        viewports: [1440, 390, 320],
        segments: [{ id: 'main', kind: 'selector', selector: 'main' }],
        states: [{ id: 'default', setup: [], assertions: [{ kind: 'visible', selector: 'main' }] }],
        remote_policy: { mode: 'deny_all', allowed_origins: [] }
      },
      accessibility: { standard: 'WCAG 2.2 AA' },
      privacy: { classification: 'internal' }
    },
    requested_profile: 'auto'
  };
  return { ...base, ...overrides };
}
