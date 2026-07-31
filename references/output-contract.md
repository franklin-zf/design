# Output Contract

## Common Files

Every artifact directory must include:

- `index.html`: the artifact readers open.
- `manifest.json`: machine-readable source, style, chart, layout, and risk contract.
- `summary-map.json`: visible-summary mapping for source-backed, non-schematic reports, dashboards, chart frames, decks, and PPT handoffs.
- `quality-report.md`: human-readable checks, caveats, assumptions, and next steps.

V2 resolved-plan delivery also includes `evidence-contract.json`, `source-inventory.json`, `.design/render-spec.json`, `accessibility-checks.json`, `privacy-checks.json`, and `render-profile.json`. A ready artifact adds `reviewer-record.json`. The render spec binds the plan and core artifact digests; the profile must execute its exact viewport, state, assertion, and segment matrix and hash every screenshot. Check sidecars use the complete versioned check sets and bind both digests; every current accessibility/privacy check is mandatory and must be `passed`. Ready delivery has no unresolved privacy finding. An approved ready reviewer record has all mandatory checks passed and no unresolved major/blocking finding. Prose in `quality-report.md` cannot self-award these states.

Decks also include:

- `slide-plan.json`: one row per slide with `slide`, `layout_id`, `purpose`, `theme`, `source`, and required `media_decision`; non-`none` media decisions must bind `image_slot` or `image_slots`.
- `images/`: local images when used.

Posters also include:

- `poster-plan.json`: one row of intent with `poster_goal`, `single_message`, `visual_hook`, `layout_lock`, `image_strategy`, `claim_integrity`, and `anti_ai_slop_checks`.

Open Design-like design-system packages also include:

- `DESIGN.md`, `USAGE.md`, `tokens.css`, `design-tokens.json`, `components.html`, `components.manifest.json`, `preview/`, and `source/` evidence.

Substantial source-backed or aesthetic-sensitive artifacts should also include:

- `agent-handoffs/poster.json` or a project-level poster handoff;
- `agent-handoffs/designer.json` or a project-level designer handoff;
- `agent-handoffs/reviewer.json` or a project-level reviewer report.

Source-backed artifacts with derived values also include:

- `source/`: immutable source copies or references;
- `calculations/`: executable calculation code and deterministic tests;
- `derived/`: generated calculation outputs;
- `data-provenance.json`: source, code, test, and output identity plus rerun metadata.

The package machine-validates `data-provenance.json` with `validate-data-provenance.mjs`. Derived execution is admitted only by a v2 resolved plan: exact registered hashes are trusted, statically bounded local Node code is restricted to verified disposable isolation, and unsafe or unavailable controls are untrusted with zero spawn. Read and write allowlists are artifact-relative; the sandbox is default-deny; every artifact-tree symlink is blocking; telemetry paths reject symlink components. Cache is explicitly off and the runner reports `cache_capability=not_implemented`, so an enabled cache declaration fails before gate execution. A named limiter must resolve to a registered CPU/memory limiter implementation. This candidate currently registers none, so derived execution blocks honestly with `registered-resource-limiter-unavailable`. Reviewer approval and caller-supplied booleans never change execution admission.

## Manifest Fields

Required:

- `schema_version`
- `artifact_type`
- `audience`
- `surface`
- `style_preset`
- `schematic`
- `source_materials`
- `data_sources`
- `metrics`
- `charts`
- `layouts`
- `assumptions`
- `missing_data`
- `unverified_items`

Use `design_system` when an artifact binds to a reusable system:

```json
{
  "design_system": {
    "id": "swiss-deck"
  }
}
```

Use `aesthetic_contract` when the artifact needs enforceable taste gates:

```json
{
  "aesthetic_contract": {
    "layout_lock": "swiss-s01-s22",
    "accent_policy": {
      "accent_2": "marker_only"
    },
    "svg_text_policy": "forbid_visible_text_in_swiss_assets",
    "motion_policy": "semantic_with_reduced_motion",
    "expression_level": "L2-motion",
    "semantic_job": "sequence",
    "reader_value": "Make the source-supported order visible without hiding any step",
    "attention_budget": {
      "primary_attention_region": "evidence-sequence",
      "signature_move_count": 1,
      "ambient_field_count": 0
    },
    "fallback": {
      "reduced_motion": "Show every step in its final state and preserve reading order",
      "static_html": "Show the complete sequence without interaction",
      "ppt_handoff": "Use one static build per stage or one fully labeled sequence"
    },
    "component_provenance_ref": "assets/components/registry.json#design-owned-staged-evidence-reveal",
    "visual_rhythm": {
      "max_same_weight_run": 2,
      "min_unique_layouts_for_8_slides": 4
    }
  }
}
```

When an artifact selects an admitted component, declare the exact catalogue ids:

```json
{
  "component_refs": [
    "design-owned-staged-evidence-reveal"
  ]
}
```

The compiled plan must include the matching digest-bound `component_resolution`.
The runner writes `.design/component-resolution.json` and invokes the
registered `validate-component-usage` adapter. Do not hand-author approval,
resolve inspiration-only records, or invoke a second component runtime.

For `visual_assets`, prefer explicit provenance over decorative labels:

```json
{
  "id": "system-map",
  "file": "images/system.svg",
  "slot": "s17-system-16x10",
  "kind": "generated-schematic",
  "provenance": "generated_from_source",
  "declared_media_decision": "generated-schematic",
  "text_policy": "html_labels_only",
  "aspect_ratio": "16:10",
  "allowed_slot": "s17-system-16x10"
}
```

## HTML Requirements

- Use semantic regions when possible.
- Tag major regions with stable `data-design-id`.
- Tag charts with `data-chart-id`.
- Tag deck slides with `class="slide"`, `data-layout`, and `data-purpose`.
- Tag local images with `data-image-slot`.
- Tag poster roots with `data-poster-id`.
- Tag every visible source-backed claim with `data-claim-id`; mappings are bidirectional.
- Schematic artifacts keep a visible `data-schematic-disclosure` marker.
- Tag deliberate motion with stable `data-animate` and `data-anim` markers or document the equivalent pattern.
- Tag every selected component root with
  `data-design-component="<catalogue-id>"`; the visible marker set must exactly
  match `manifest.component_refs`.
- Include viewport meta and responsive CSS.
- Keep everything self-contained unless the quality report declares external dependencies.
- Declare `data-style-preset="<manifest.style_preset>"` on a visible root container.

## Chart Contract

For source-backed `data-report`, `dashboard`, and `chart-frame` artifacts, every rendered `data-chart-id` must match a `manifest.charts[]` entry. Each chart entry must include:

- `id`, `family`, `source`, `unit`;
- `question`, `takeaway`, `grain`, `fields`;
- `sample_size`;
- `visual_encoding.mark`, `x`, `y`, `scale_type`, `baseline`, `domain`, and `label_policy`;
- `denominator` for rate, ratio, or percent semantics, unless denominator absence is explicitly listed in `missing_data`.
- `data_origin: raw|code_derived` and a derivation reference for any computed field, metric, ordering, scale, or mark position.

Trend claims need at least 8 comparable observations or a non-trend fallback.

## Poster Contract

Poster artifacts must have exactly one primary `h1`, one clear message, a visible hook, and `poster-plan.json`. They must avoid fake urgency, emoji hooks, inflated Chinese abstractions, and generic AI-gradient styling. If the poster summarizes source material, it must keep numbers verbatim and keep any unsupported claim in `unverified_items`.

## Aesthetic And Asset Gates

Run these validators when their contracts apply:

```bash
node scripts/validate-aesthetic-contract.mjs <artifact-dir>
node scripts/validate-asset-contract.mjs <artifact-dir>
node scripts/validate-layout-lock.mjs <artifact-dir>
node scripts/validate-visual-rhythm.mjs <artifact-dir>
node scripts/validate-poster-contract.mjs <artifact-dir>
node scripts/validate-poster-anti-ai-slop.mjs <artifact-dir>
```

## Quality Report Sections

Use these headings:

```markdown
# Quality Report

## Artifact
## Sources
## Assumptions
## Validation
## Status
## Visual QA
## Data Gaps
## Remaining Risks
```

When browser smoke is run, `quality-report.md` should name the generated screenshots under `qa/`. When strict layout or interaction smoke is run, record those checks separately from manual visual judgment. If only structural checks were run, say so explicitly and keep visual quality as a remaining risk.

When `visual_qa: smoke_passed`, the artifact must include desktop and mobile PNG screenshots under `qa/`.

`## Status` must include these machine-checkable lines:

```text
artifact_status: ready|partial|blocked|schematic
claim_assurance: local_provenance_only|externally_verified|unverified|schematic
semantic_entailment: not_proven|manually_reviewed
summary_integrity: source_mapped|not_applicable|not_checked
number_integrity: verbatim_checked|not_applicable|not_checked
plain_language: manual_reviewed|not_applicable|not_checked
visual_qa: not_run|smoke_passed|manual_reviewed|blocked
accessibility: not_run|basic_checked|manually_reviewed|blocked
runtime.browser_smoke: available|missing|not_checked|not_claimed
runtime.browser_launch: available|missing|not_checked|not_claimed|blocked
```

For artifacts that use `data_provenance_ref`, `quality-report.md` may set `calculation_integrity: code_tested` only after the v2 Policy Executor and resolved-plan gates pass. The provenance CLI is static-only; its legacy `--execute-trusted` flag is rejected. Hashes and tests prove declared identity and reproducibility, not formula intent or external truth.

`artifact_status: ready` requires `semantic_entailment: manually_reviewed`, `summary_integrity: source_mapped`, `number_integrity: verbatim_checked`, `plain_language: manual_reviewed`, `visual_qa: smoke_passed|manual_reviewed`, and `accessibility: basic_checked|manually_reviewed`. Artifacts with derived values additionally require the current manual calculation evidence described above; missing evidence blocks `ready`. Schematic artifacts should use `artifact_status: schematic` and `not_applicable` summary statuses.
