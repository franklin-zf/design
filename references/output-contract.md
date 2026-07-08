# Output Contract

## Common Files

Every artifact directory must include:

- `index.html`: the artifact readers open.
- `manifest.json`: machine-readable source, style, chart, layout, and risk contract.
- `summary-map.json`: visible-summary mapping for source-backed, non-schematic reports, dashboards, chart frames, decks, and PPT handoffs.
- `quality-report.md`: human-readable checks, caveats, assumptions, and next steps.

Decks also include:

- `slide-plan.json`: one row per slide with `slide`, `layout_id`, `purpose`, `theme`, `source`, and optional `image_slots`.
- `images/`: local images when used.

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

## HTML Requirements

- Use semantic regions when possible.
- Tag major regions with stable `data-design-id`.
- Tag charts with `data-chart-id`.
- Tag deck slides with `class="slide"`, `data-layout`, and `data-purpose`.
- Tag local images with `data-image-slot`.
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

Trend claims need at least 8 comparable observations or a non-trend fallback.

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

`artifact_status: ready` requires `semantic_entailment: manually_reviewed`, `summary_integrity: source_mapped`, `number_integrity: verbatim_checked`, `plain_language: manual_reviewed`, `visual_qa: smoke_passed|manual_reviewed`, and `accessibility: basic_checked|manually_reviewed`. Schematic artifacts should use `artifact_status: schematic` and `not_applicable` summary statuses.
